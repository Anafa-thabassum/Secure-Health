const rolePermissions = {
  ADMIN: { "*": ["*"] },
  AUDITOR: { AuditEvent: ["read", "verify"], SecurityEvent: ["read"], Integrity: ["read", "verify"] },
  DOCTOR: {
    Patient: ["read"], ClinicalRecord: ["read", "create"], Observation: ["read", "create"], DiagnosticReport: ["read", "create"],
    MedicationRequest: ["read", "create"], Appointment: ["read", "create", "update"], Consent: ["read"], FHIR: ["read"],
  },
  PATIENT: {
    Patient: ["read", "update-self"], ClinicalRecord: ["read"], Observation: ["read"], DiagnosticReport: ["read"],
    MedicationRequest: ["read"], Appointment: ["read", "create"], Consent: ["read", "create", "revoke"],
  },
};

const permitted = (role, resource, action) => {
  const permissions = rolePermissions[role] || {};
  return permissions["*"]?.includes("*") || permissions[resource]?.includes(action);
};

const layer = (key, label, passed, reason) => ({ key, label, status: passed ? "PASSED" : "FAILED", reason });

export const evaluatePolicy = ({ subject, patient, resource, action = "read", purpose, consent, breakGlass, now = new Date() }) => {
  const identity = Boolean(subject?.userId && subject?.status !== "SUSPENDED");
  const rbac = identity && permitted(subject.role, resource, action);
  const sameOrganization = subject?.role === "ADMIN" || subject?.role === "AUDITOR" || subject?.organizationId === patient?.organizationId;
  const self = subject?.role === "PATIENT" && subject?.patientId === patient?.patientId;
  const careRelationship = self || subject?.role === "ADMIN" || patient?.careTeamUserIds?.includes(subject?.userId) || subject?.careRelationships?.includes(patient?.patientId);
  const contextEligible = Boolean(sameOrganization && careRelationship);
  const emergency = breakGlass?.status === "ACTIVE" && new Date(breakGlass.expiresAt) > now && breakGlass.patientId === patient?.patientId && breakGlass.resource === resource;
  const activeConsent = self || subject?.role === "ADMIN" || emergency || Boolean(
    consent && consent.status === "ACTIVE" && new Date(consent.startsAt) <= now && new Date(consent.expiresAt) > now &&
    consent.patientId === patient?.patientId && consent.granteeOrganizationId === subject?.organizationId &&
    (!consent.granteeUserId || consent.granteeUserId === subject?.userId) && consent.resources.includes(resource) && consent.purposes.includes(purpose)
  );
  const resourceAllowed = Boolean(resource && resource !== "RestrictedResearchRecord");
  const purposeAllowed = ["treatment", "care-coordination", "billing", "operations", "emergency"].includes(purpose);

  const layers = [
    layer("identity", "Identity", identity, identity ? "Verified token subject" : "Identity is missing, invalid, or suspended"),
    layer("rbac", "RBAC", rbac, rbac ? `${subject?.role} role permits ${action}` : `${subject?.role || "Unknown"} role does not permit ${action}`),
    layer("abac", "ABAC", contextEligible || emergency, emergency ? "Emergency context approved" : contextEligible ? "Organization and patient relationship are eligible" : !sameOrganization ? "Organization mismatch" : "No active patient relationship"),
    layer("consent", "Consent firewall", activeConsent, activeConsent ? emergency ? "Temporary emergency authorization active" : self ? "Patient accessing own data" : "Active consent matches organization, resource, and purpose" : "No active consent for this resource and purpose"),
    layer("resource", "Resource", resourceAllowed, resourceAllowed ? "Resource is permitted by policy" : "Resource is restricted by policy"),
    layer("purpose", "Purpose", purposeAllowed, purposeAllowed ? `Purpose '${purpose}' is permitted` : "Purpose is missing or not permitted"),
  ];
  const allowed = layers.every((item) => item.status === "PASSED");
  return {
    decision: allowed ? "ALLOW" : "DENY",
    emergency,
    layers,
    reasons: layers.filter((item) => item.status === "FAILED").map((item) => item.reason),
  };
};

export const permissionsForRole = (role) => rolePermissions[role] || {};

