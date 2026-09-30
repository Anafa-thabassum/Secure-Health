import { Patient } from "../models/Patient.js";
import { ClinicalRecord } from "../models/ClinicalRecord.js";
import { AppError, notFound } from "../utils/errors.js";
import { ids } from "../utils/ids.js";
import { evaluatePolicy } from "./policyEngine.js";
import { findActiveConsent } from "./consentService.js";
import { findActiveBreakGlass, recordBreakGlassAccess } from "./breakGlassService.js";
import { appendAuditEvent } from "./auditService.js";
import { recordSecurityEvent } from "./securityEventService.js";
import { observeDecision } from "./sentinelService.js";
import { decryptClinicalData } from "./encryptionService.js";
import { minimizeClinicalData } from "./dataMinimizationService.js";

export const evaluateAccess = async ({ user, patientId, resource, action = "read", purpose, sensitivity = "STANDARD", recordId, requestId = ids.request(), context = {} }) => {
  const patient = await Patient.findOne({ patientId }).lean();
  if (!patient) throw notFound("Patient");
  const [consent, breakGlass] = await Promise.all([
    findActiveConsent({ patientId, organizationId: user.organizationId, userId: user.userId, resource, purpose }),
    user.role === "DOCTOR" ? findActiveBreakGlass(user.userId, patientId, resource) : null,
  ]);
  const evaluation = evaluatePolicy({ subject: user, patient, resource, action, purpose, sensitivity, consent, breakGlass });
  const reason = evaluation.reasons.join("; ") || (evaluation.emergency ? "Temporary emergency authorization active" : "All authorization layers passed");
  await appendAuditEvent({ requestId, actor: user, patientId, organizationId: user.organizationId, resource, action: action.toUpperCase(), purpose, decision: evaluation.decision, reason, severity: evaluation.decision === "DENY" ? "HIGH" : evaluation.emergency ? "CRITICAL" : "INFO", context: { ...context, layers: evaluation.layers } });
  await recordSecurityEvent({ requestId, type: evaluation.decision === "ALLOW" ? "ACCESS_GRANTED" : "ACCESS_DENIED", title: evaluation.decision === "ALLOW" ? "Protected access granted" : "Authorization denied", detail: reason, severity: evaluation.decision === "ALLOW" ? (evaluation.emergency ? "CRITICAL" : "INFO") : "HIGH", actorUserId: user.userId, patientId, organizationId: user.organizationId, metadata: { resource, purpose, emergency: evaluation.emergency } });
  await observeDecision({ user, patient, evaluation, requestId, action });
  if (evaluation.decision === "ALLOW" && evaluation.emergency && breakGlass) await recordBreakGlassAccess(breakGlass.breakGlassId, { resource, recordId, requestId });
  return { requestId, timestamp: new Date().toISOString(), requester: { userId: user.userId, role: user.role, organizationId: user.organizationId }, patientId, resource, purpose, ...evaluation };
};

export const getProtectedRecord = async ({ user, recordId, purpose, context }) => {
  const record = await ClinicalRecord.findOne({ recordId }).lean();
  if (!record) throw notFound("Clinical record");
  const evaluation = await evaluateAccess({ user, patientId: record.patientId, resource: record.resource, sensitivity: record.sensitivity, recordId, action: "read", purpose, context });
  if (evaluation.decision !== "ALLOW") throw new AppError(403, "ACCESS_DENIED", "Authorization denied", evaluation);
  const decrypted = decryptClinicalData(record.encryptedPayload, `${record.patientId}:${record.recordId}`);
  return { ...record, encryptedPayload: undefined, protectedData: minimizeClinicalData({ data: decrypted, role: user.role, resource: record.resource, emergency: evaluation.emergency }), dataMinimizationApplied: !evaluation.emergency && user.role !== "PATIENT", accessDecision: evaluation };
};
