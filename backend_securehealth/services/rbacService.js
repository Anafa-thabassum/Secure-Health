const rolePermissions = Object.freeze({
  PATIENT: {
    Patient: ["read", "update-self"], ClinicalRecord: ["read"], Observation: ["read"], DiagnosticReport: ["read"], MedicationRequest: ["read"], Appointment: ["read", "create"], Consent: ["read", "create", "revoke"],
  },
  DOCTOR: {
    Patient: ["read"], ClinicalRecord: ["read", "create"], Observation: ["read", "create"], DiagnosticReport: ["read", "create"], MedicationRequest: ["read", "create"], Appointment: ["read", "create", "update"], Consent: ["read"], FHIR: ["read"],
  },
  NURSE: {
    Patient: ["read"], ClinicalRecord: ["read"], Observation: ["read", "create"], DiagnosticReport: ["read"], MedicationRequest: ["read"], Appointment: ["read", "update"], Consent: ["read"], FHIR: ["read"],
  },
  LAB_TECHNICIAN: {
    Patient: ["read"], Observation: ["read", "create"], DiagnosticReport: ["read", "create"], FHIR: ["read"],
  },
  ADMINISTRATOR: {
    User: ["read", "create", "update", "suspend"], Role: ["read", "update"], Policy: ["read", "update"], AuditEvent: ["read", "verify"], SecurityEvent: ["read", "acknowledge"], Integrity: ["read", "verify"], BreakGlass: ["read", "review"],
  },
  AUDITOR: { AuditEvent: ["read", "verify"], SecurityEvent: ["read"], Integrity: ["read", "verify"], BreakGlass: ["read"] },
});

export const normalizeRole = (role) => role === "ADMIN" ? "ADMINISTRATOR" : role;
export const permissionsForRole = (role) => rolePermissions[normalizeRole(role)] || {};
export const isRolePermitted = (role, resource, action) => permissionsForRole(role)[resource]?.includes(action) === true;
export const supportedRoles = Object.keys(rolePermissions);

