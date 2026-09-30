import { Router } from "express";
import { Patient } from "../models/Patient.js";
import { ClinicalRecord } from "../models/ClinicalRecord.js";
import { authenticate } from "../middleware/authenticate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { notFound, AppError } from "../utils/errors.js";
import { getProtectedRecord } from "../services/accessService.js";
import { evaluateAccess } from "../services/accessService.js";
import { encryptClinicalData } from "../services/encryptionService.js";
import { authorizeRoles } from "../middleware/authenticate.js";
import { validate } from "../middleware/validateRequest.js";
import { z } from "zod";
import { ids } from "../utils/ids.js";

const router = Router();
router.use(authenticate);

router.get("/", asyncHandler(async (req, res) => {
  const query = req.user.role === "PATIENT" ? { patientId: req.user.patientId } : req.user.role === "DOCTOR" ? { organizationId: req.user.organizationId, careTeamUserIds: req.user.userId } : {};
  const patients = await Patient.find(query).sort({ name: 1 }).lean();
  res.json({ data: patients });
}));

router.get("/:patientId", asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ patientId: req.params.patientId }).lean();
  if (!patient) throw notFound("Patient");
  const self = req.user.role === "PATIENT" && req.user.patientId === patient.patientId;
  const careTeam = req.user.role === "DOCTOR" && patient.careTeamUserIds.includes(req.user.userId);
  if (!self && !careTeam && !["ADMIN", "AUDITOR"].includes(req.user.role)) throw new AppError(403, "PATIENT_SCOPE_DENIED", "No active patient relationship");
  res.json({ data: patient });
}));

router.get("/:patientId/records", asyncHandler(async (req, res) => {
  const query = { patientId: req.params.patientId };
  if (req.query.resource) query.resource = req.query.resource;
  const records = await ClinicalRecord.find(query).select("-encryptedPayload").sort({ authoredAt: -1 }).lean();
  res.json({ data: records });
}));

router.post("/:patientId/records", authorizeRoles("DOCTOR", "ADMIN"), validate(z.object({ resource: z.enum(["ClinicalRecord", "Observation", "DiagnosticReport", "MedicationRequest"]), title: z.string().min(3).max(160), purpose: z.enum(["treatment", "care-coordination", "operations"]), sensitivity: z.enum(["STANDARD", "RESTRICTED", "HIGHLY_RESTRICTED"]).default("STANDARD"), data: z.record(z.unknown()) })), asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ patientId: req.params.patientId }).lean();
  if (!patient) throw notFound("Patient");
  const decision = await evaluateAccess({ user: req.user, patientId: patient.patientId, resource: req.body.resource, action: "create", purpose: req.body.purpose, requestId: req.requestId, context: { ip: req.ip, userAgent: req.get("user-agent") } });
  if (decision.decision !== "ALLOW") throw new AppError(403, "ACCESS_DENIED", "Authorization denied", decision);
  const recordId = `REC-${ids.session().slice(0, 8).toUpperCase()}`;
  const record = await ClinicalRecord.create({ recordId, patientId: patient.patientId, organizationId: patient.organizationId, resource: req.body.resource, title: req.body.title, authoredAt: new Date(), authorUserId: req.user.userId, sensitivity: req.body.sensitivity, encryptedPayload: encryptClinicalData(req.body.data, `${patient.patientId}:${recordId}`), metadata: { protection: "AES-256-GCM" } });
  res.status(201).json({ data: { ...record.toJSON(), encryptedPayload: undefined, accessDecision: decision } });
}));

router.get("/:patientId/records/:recordId", asyncHandler(async (req, res) => {
  const record = await getProtectedRecord({ user: req.user, recordId: req.params.recordId, purpose: req.query.purpose || (req.user.role === "PATIENT" ? "treatment" : "treatment"), context: { requestId: req.requestId, ip: req.ip, userAgent: req.get("user-agent") } });
  res.json({ data: record });
}));

export default router;
