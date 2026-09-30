import { ClinicalRecord } from "../models/ClinicalRecord.js";
import { Patient } from "../models/Patient.js";
import { evaluateAccess, getProtectedRecord } from "../services/accessService.js";
import { encryptClinicalData } from "../services/encryptionService.js";
import { AppError, notFound } from "../utils/errors.js";
import { ids } from "../utils/ids.js";

const context = (req) => ({ ip: req.ip, userAgent: req.get("user-agent") });
export const list = async (req, res) => {
  if (!req.query.resource) throw new AppError(400, "RESOURCE_REQUIRED", "Record listings require a resource parameter");
  const decision = await evaluateAccess({ user: req.user, patientId: req.params.patientId, resource: req.query.resource, action: "read", purpose: req.query.purpose || "treatment", requestId: req.requestId, context: context(req) });
  if (decision.decision !== "ALLOW") throw new AppError(403, "ACCESS_DENIED", "Authorization denied", decision);
  const data = await ClinicalRecord.find({ patientId: req.params.patientId, resource: req.query.resource }).select("-encryptedPayload").sort({ authoredAt: -1 }).lean();
  res.json({ data, accessDecision: decision });
};
export const create = async (req, res) => {
  const patient = await Patient.findOne({ patientId: req.params.patientId }).lean();
  if (!patient) throw notFound("Patient");
  const decision = await evaluateAccess({ user: req.user, patientId: patient.patientId, resource: req.body.resource, action: "create", purpose: req.body.purpose, sensitivity: req.body.sensitivity, requestId: req.requestId, context: context(req) });
  if (decision.decision !== "ALLOW") throw new AppError(403, "ACCESS_DENIED", "Authorization denied", decision);
  const recordId = `REC-${ids.session().slice(0, 8).toUpperCase()}`;
  const record = await ClinicalRecord.create({ recordId, patientId: patient.patientId, organizationId: patient.organizationId, resource: req.body.resource, title: req.body.title, authoredAt: new Date(), authorUserId: req.user.userId, sensitivity: req.body.sensitivity, encryptedPayload: encryptClinicalData(req.body.data, `${patient.patientId}:${recordId}`), metadata: { protection: "AES-256-GCM" } });
  res.status(201).json({ data: { ...record.toJSON(), encryptedPayload: undefined, accessDecision: decision } });
};
export const get = async (req, res) => res.json({ data: await getProtectedRecord({ user: req.user, recordId: req.params.recordId, purpose: req.query.purpose || "treatment", context: { ...context(req), requestId: req.requestId } }) });

