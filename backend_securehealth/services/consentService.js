import { Consent } from "../models/Consent.js";
import { cache } from "../config/redis.js";
import { ids } from "../utils/ids.js";
import { AppError, notFound } from "../utils/errors.js";
import { appendAuditEvent } from "./auditService.js";
import { recordSecurityEvent } from "./securityEventService.js";

const cacheKey = (patientId, organizationId, userId, resource, purpose) => `consent:${patientId}:${organizationId}:${userId || "org"}:${resource}:${purpose}`;

export const findActiveConsent = async ({ patientId, organizationId, userId, resource, purpose, now = new Date() }) => {
  const key = cacheKey(patientId, organizationId, userId, resource, purpose);
  const cached = await cache.getJson(key);
  if (cached) return cached;
  const consent = await Consent.findOne({
    patientId, granteeOrganizationId: organizationId, status: "ACTIVE", startsAt: { $lte: now }, expiresAt: { $gt: now },
    resources: resource, purposes: purpose, $or: [{ granteeUserId: null }, { granteeUserId: userId }],
  }).lean();
  if (consent) await cache.setJson(key, consent, Math.max(1, Math.min(300, Math.floor((new Date(consent.expiresAt) - now) / 1000))));
  return consent;
};

export const listConsents = async (user, filters = {}) => {
  const query = {};
  if (user.role === "PATIENT") query.patientId = user.patientId;
  else if (user.role === "DOCTOR") query.granteeOrganizationId = user.organizationId;
  if (filters.patientId && user.role !== "PATIENT") query.patientId = filters.patientId;
  if (filters.status) query.status = filters.status;
  return Consent.find(query).sort({ createdAt: -1 }).lean();
};

export const grantConsent = async (input, user, context) => {
  if (user.role === "PATIENT" && user.patientId !== input.patientId) throw new AppError(403, "PATIENT_SCOPE_DENIED", "Patients may grant consent only for their own records");
  const consent = await Consent.create({ consentId: ids.consent(), ...input, startsAt: input.startsAt || new Date(), status: "ACTIVE", createdByUserId: user.userId });
  await appendAuditEvent({ requestId: context.requestId, actor: user, patientId: input.patientId, organizationId: input.granteeOrganizationId, resource: "Consent", action: "GRANT", purpose: input.purposes.join(","), decision: "ALLOW", reason: "Consent granted", severity: "INFO", context: { resources: input.resources, expiresAt: input.expiresAt, ip: context.ip, userAgent: context.userAgent } });
  await recordSecurityEvent({ requestId: context.requestId, type: "CONSENT_GRANTED", title: "Consent granted", detail: `${input.patientId} granted ${input.granteeOrganizationId} access`, severity: "INFO", actorUserId: user.userId, patientId: input.patientId, organizationId: input.granteeOrganizationId, metadata: { consentId: consent.consentId } });
  return consent.toJSON();
};

export const revokeConsent = async (consentId, user, context) => {
  const consent = await Consent.findOne({ consentId });
  if (!consent) throw notFound("Consent");
  if (user.role === "PATIENT" && user.patientId !== consent.patientId) throw new AppError(403, "PATIENT_SCOPE_DENIED", "Patients may revoke only their own consent");
  if (consent.status === "REVOKED") return { ...consent.toJSON(), cacheInvalidated: true };
  consent.status = "REVOKED"; consent.revokedAt = new Date(); consent.revokedByUserId = user.userId; consent.version += 1;
  await consent.save();
  for (const resource of consent.resources) for (const purpose of consent.purposes) await cache.delete(cacheKey(consent.patientId, consent.granteeOrganizationId, consent.granteeUserId, resource, purpose));
  await appendAuditEvent({ requestId: context.requestId, actor: user, patientId: consent.patientId, organizationId: consent.granteeOrganizationId, resource: "Consent", action: "REVOKE", decision: "ALLOW", reason: "Persistent consent state updated; authorization cache invalidated", severity: "MEDIUM", context: { consentId } });
  await recordSecurityEvent({ requestId: context.requestId, type: "CONSENT_REVOKED", title: "Consent revoked", detail: "Future matching requests will be denied", severity: "MEDIUM", actorUserId: user.userId, patientId: consent.patientId, organizationId: consent.granteeOrganizationId, metadata: { consentId, cacheInvalidated: true } });
  return { ...consent.toJSON(), cacheInvalidated: true };
};

