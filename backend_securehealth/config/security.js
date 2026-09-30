export const securityConfig = {
  maxPayloadSize: "1mb",
  rateLimit: { windowMs: 15 * 60 * 1000, max: 300 },
  authRateLimit: { windowMs: 15 * 60 * 1000, max: 20 },
  fhirRateLimit: { windowMs: 60 * 1000, max: 60 },
  searchRateLimit: { windowMs: 60 * 1000, max: 90 },
  bulkRateLimit: { windowMs: 15 * 60 * 1000, max: 10 },
  password: { minLength: 12, bcryptRounds: 12 },
  breakGlassDurations: [5, 15, 30],
  allowedPurposes: ["treatment", "care-coordination", "billing", "operations", "emergency"],
  roles: ["PATIENT", "DOCTOR", "NURSE", "LAB_TECHNICIAN", "ADMINISTRATOR", "AUDITOR"],
  resources: ["Patient", "ClinicalRecord", "Observation", "DiagnosticReport", "MedicationRequest", "Appointment", "Consent", "FHIR", "AuditEvent", "SecurityEvent", "Integrity"],
};
