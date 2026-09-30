import { Patient } from "../models/Patient.js";
import { evaluateAccess } from "../services/accessService.js";
import { AppError, notFound } from "../utils/errors.js";

const context = (req) => ({ ip: req.ip, userAgent: req.get("user-agent") });
export const list = async (req, res) => {
  const query = req.user.role === "PATIENT" ? { patientId: req.user.patientId } : ["DOCTOR", "NURSE", "LAB_TECHNICIAN"].includes(req.user.role) ? { organizationId: req.user.organizationId, careTeamUserIds: req.user.userId } : { _id: null };
  res.json({ data: await Patient.find(query).sort({ name: 1 }).lean() });
};
export const get = async (req, res) => {
  const patient = await Patient.findOne({ patientId: req.params.patientId }).lean();
  if (!patient) throw notFound("Patient");
  const decision = await evaluateAccess({ user: req.user, patientId: patient.patientId, resource: "Patient", action: "read", purpose: req.query.purpose || "treatment", requestId: req.requestId, context: context(req) });
  if (decision.decision !== "ALLOW") throw new AppError(403, "ACCESS_DENIED", "Authorization denied", decision);
  res.json({ data: { ...patient, accessDecision: decision } });
};

