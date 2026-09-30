const clinicalResources = new Set(["ClinicalRecord", "Observation", "DiagnosticReport", "MedicationRequest", "Patient"]);

export const evaluateAttributes = ({ subject, patient, resource, sensitivity = "STANDARD", purpose, now = new Date(), emergency = false }) => {
  const self = subject?.role === "PATIENT" && subject?.patientId === patient?.patientId;
  const sameOrganization = self || subject?.organizationId === patient?.organizationId;
  const careRelationship = self || patient?.careTeamUserIds?.includes(subject?.userId) || subject?.careRelationships?.includes(patient?.patientId);
  const organizationPassed = !clinicalResources.has(resource) || sameOrganization;
  const relationshipPassed = !clinicalResources.has(resource) || careRelationship || emergency;
  const sensitivityPassed = sensitivity !== "HIGHLY_RESTRICTED" || self || emergency || subject?.role === "DOCTOR";
  const hour = now.getHours();
  const contextPassed = emergency || self || (hour >= 5 && hour < 23) || purpose === "treatment";
  return {
    passed: organizationPassed && relationshipPassed && sensitivityPassed && contextPassed,
    self,
    checks: {
      organization: { passed: organizationPassed, reasonCode: organizationPassed ? "ORGANIZATION_MATCH" : "ORGANIZATION_MISMATCH", reason: organizationPassed ? "Requester organization is eligible" : "Organization mismatch: requester does not match the patient organization" },
      relationship: { passed: relationshipPassed, reasonCode: relationshipPassed ? "RELATIONSHIP_VERIFIED" : "RELATIONSHIP_MISSING", reason: relationshipPassed ? "Patient relationship is active" : "No active patient-care relationship" },
      sensitivity: { passed: sensitivityPassed, reasonCode: sensitivityPassed ? "SENSITIVITY_PERMITTED" : "SENSITIVITY_DENIED", reason: sensitivityPassed ? `${sensitivity} data is permitted for this context` : `${sensitivity} data requires a doctor, patient, or emergency context` },
      context: { passed: contextPassed, reasonCode: contextPassed ? "CONTEXT_ELIGIBLE" : "OFF_HOURS_CONTEXT_DENIED", reason: contextPassed ? "Time and purpose context is eligible" : "Off-hours context requires treatment or emergency purpose" },
    },
  };
};
