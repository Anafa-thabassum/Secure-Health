import { BreakGlassSession } from "../models/BreakGlassSession.js";
import { securityConfig } from "../config/security.js";
import { ids } from "../utils/ids.js";
import { AppError, notFound } from "../utils/errors.js";
import { appendAuditEvent } from "./auditService.js";
import { recordSecurityEvent } from "./securityEventService.js";

export const activateBreakGlass = async (input, user, context) => {
  if (user.role !== "DOCTOR") throw new AppError(403, "ROLE_DENIED", "Only doctors may activate emergency access");
  if (!input.acknowledgment) throw new AppError(400, "ACKNOWLEDGMENT_REQUIRED", "Emergency access acknowledgment is required");
  if (!securityConfig.breakGlassDurations.includes(input.durationMinutes)) throw new AppError(400, "INVALID_DURATION", "Emergency access must be 5, 15, or 30 minutes");
  const expiresAt = new Date(Date.now() + input.durationMinutes * 60_000);
  const session = await BreakGlassSession.create({ breakGlassId: ids.breakGlass(), doctorUserId: user.userId, patientId: input.patientId, resource: input.resource, reason: input.reason, acknowledgment: true, expiresAt });
  await appendAuditEvent({ requestId: context.requestId, actor: user, patientId: input.patientId, organizationId: user.organizationId, resource: input.resource, action: "BREAK_GLASS_ACTIVATE", purpose: "emergency", decision: "ALLOW", reason: input.reason, severity: "CRITICAL", context: { breakGlassId: session.breakGlassId, expiresAt } });
  await recordSecurityEvent({ requestId: context.requestId, type: "BREAK_GLASS_ACTIVATED", title: "Emergency access activated", detail: `${input.durationMinutes}-minute emergency window opened`, severity: "CRITICAL", actorUserId: user.userId, patientId: input.patientId, organizationId: user.organizationId, metadata: { breakGlassId: session.breakGlassId, expiresAt } });
  return session.toJSON();
};

export const findActiveBreakGlass = async (doctorUserId, patientId, resource) => {
  const now = new Date();
  await BreakGlassSession.updateMany({ status: "ACTIVE", expiresAt: { $lte: now } }, { $set: { status: "REVIEW_REQUIRED" } });
  return BreakGlassSession.findOne({ doctorUserId, patientId, resource, status: "ACTIVE", expiresAt: { $gt: now } }).lean();
};

export const endBreakGlass = async (breakGlassId, user, context) => {
  const session = await BreakGlassSession.findOne({ breakGlassId });
  if (!session) throw notFound("Break-glass session");
  if (user.role !== "ADMIN" && session.doctorUserId !== user.userId) throw new AppError(403, "ROLE_DENIED", "You cannot end this emergency session");
  session.status = "REVIEW_REQUIRED"; session.endedAt = new Date(); session.endedByUserId = user.userId;
  await session.save();
  await appendAuditEvent({ requestId: context.requestId, actor: user, patientId: session.patientId, organizationId: user.organizationId, resource: session.resource, action: "BREAK_GLASS_END", purpose: "emergency", decision: "INFO", reason: "Emergency access ended; administrative review required", severity: "HIGH", context: { breakGlassId } });
  return session.toJSON();
};

export const reviewBreakGlass = async (breakGlassId, input, user, context) => {
  const session = await BreakGlassSession.findOne({ breakGlassId });
  if (!session) throw notFound("Break-glass session");
  session.status = "REVIEWED"; session.review = { ...input, reviewedByUserId: user.userId, reviewedAt: new Date() };
  await session.save();
  await appendAuditEvent({ requestId: context.requestId, actor: user, patientId: session.patientId, organizationId: user.organizationId, resource: session.resource, action: "BREAK_GLASS_REVIEW", decision: "INFO", reason: input.outcome, severity: "HIGH", context: { breakGlassId } });
  return session.toJSON();
};

