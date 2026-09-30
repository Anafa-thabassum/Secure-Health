import { evaluateAttributes } from "./abacService.js";
import { isRolePermitted, normalizeRole, permissionsForRole } from "./rbacService.js";

const allowedPurposes = new Set(["treatment", "care-coordination", "billing", "operations", "emergency"]);
const allowedResources = new Set(["Patient", "ClinicalRecord", "Observation", "DiagnosticReport", "MedicationRequest", "Appointment", "Consent", "FHIR", "AuditEvent", "SecurityEvent", "Integrity", "BreakGlass", "User", "Role", "Policy"]);
const result = (key, label, passed, reasonCode, reason, metadata = {}) => ({ key, label, status: passed ? "PASSED" : "FAILED", reasonCode, reason, ...metadata });

export const authorizeRequest = ({ subject, patient, resource, action = "read", purpose, sensitivity = "STANDARD", consent, breakGlass, now = new Date() }) => {
  const role = normalizeRole(subject?.role);
  const identity = Boolean(subject?.userId && subject?.status === "ACTIVE");
  const emergency = Boolean(breakGlass?.status === "ACTIVE" && new Date(breakGlass.expiresAt) > now && breakGlass.patientId === patient?.patientId && breakGlass.resource === resource);
  const rbac = identity && isRolePermitted(role, resource, action);
  const attributes = evaluateAttributes({ subject: { ...subject, role }, patient, resource, sensitivity, purpose, now, emergency });
  const self = attributes.self;
  const consentActive = Boolean(consent && consent.status === "ACTIVE" && new Date(consent.startsAt) <= now && new Date(consent.expiresAt) > now && consent.patientId === patient?.patientId && consent.granteeOrganizationId === subject?.organizationId && (!consent.granteeUserId || consent.granteeUserId === subject?.userId) && consent.resources.includes(resource) && consent.purposes.includes(purpose));
  const consentPassed = self || emergency || !["Patient", "ClinicalRecord", "Observation", "DiagnosticReport", "MedicationRequest", "FHIR"].includes(resource) || consentActive;
  const resourcePassed = allowedResources.has(resource);
  const purposePassed = allowedPurposes.has(purpose);

  const layers = [
    result("identity", "Identity", identity, identity ? "IDENTITY_VERIFIED" : "IDENTITY_INVALID", identity ? "Verified active token subject" : "Identity is missing, invalid, or inactive"),
    result("rbac", "RBAC", rbac, rbac ? "ROLE_PERMITTED" : "ROLE_DENIED", rbac ? `${role} permits ${action} on ${resource}` : `${role || "Unknown"} does not permit ${action} on ${resource}`),
    result("organization", "Organization", attributes.checks.organization.passed, attributes.checks.organization.reasonCode, attributes.checks.organization.reason),
    result("relationship", "Patient relationship", attributes.checks.relationship.passed, attributes.checks.relationship.reasonCode, attributes.checks.relationship.reason),
    result("sensitivity", "Resource sensitivity", attributes.checks.sensitivity.passed, attributes.checks.sensitivity.reasonCode, attributes.checks.sensitivity.reason, { sensitivity }),
    result("context", "Time and context", attributes.checks.context.passed, attributes.checks.context.reasonCode, attributes.checks.context.reason),
    result("consent", "Consent firewall", consentPassed, consentPassed ? emergency ? "BREAK_GLASS_ACTIVE" : self ? "SELF_ACCESS" : "CONSENT_ACTIVE" : consent?.status === "REVOKED" ? "CONSENT_REVOKED" : consent && new Date(consent.expiresAt) <= now ? "CONSENT_EXPIRED" : "NO_ACTIVE_CONSENT", consentPassed ? emergency ? "Temporary emergency authorization is active" : self ? "Patient is accessing their own data" : "Active consent matches organization, resource, and purpose" : consent?.status === "REVOKED" ? "Patient consent was revoked" : consent && new Date(consent.expiresAt) <= now ? `Patient consent expired on ${new Date(consent.expiresAt).toISOString()}` : "No active consent for this resource and purpose"),
    result("resource", "Resource policy", resourcePassed, resourcePassed ? "RESOURCE_PERMITTED" : "RESOURCE_DENIED", resourcePassed ? "Resource is explicitly permitted" : "Resource is not present in the authorization policy"),
    result("purpose", "Purpose policy", purposePassed, purposePassed ? "PURPOSE_VALID" : "PURPOSE_INVALID", purposePassed ? `Purpose '${purpose}' is permitted` : "Purpose is missing or not permitted"),
  ];
  const allowed = layers.every((layer) => layer.status === "PASSED");
  const failures = layers.filter((layer) => layer.status === "FAILED");
  return { decision: allowed ? "ALLOW" : "DENY", reasonCode: allowed ? emergency ? "BREAK_GLASS_GRANTED" : "POLICY_SATISFIED" : failures[0]?.reasonCode || "DENY_BY_DEFAULT", reason: allowed ? emergency ? "Temporary emergency policy satisfied" : "All authorization layers passed" : failures.map((layer) => layer.reason).join("; "), emergency, layers, reasons: failures.map((layer) => layer.reason), permissions: permissionsForRole(role) };
};

