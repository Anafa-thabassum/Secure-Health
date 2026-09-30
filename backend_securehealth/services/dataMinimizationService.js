const allowedFields = {
  PATIENT: { "*": null },
  DOCTOR: { ClinicalRecord: ["summary", "diagnosis", "plan", "allergies", "medications"], Observation: ["code", "display", "valueQuantity", "interpretation", "effectiveDateTime"], DiagnosticReport: ["conclusion", "results", "followUp"], MedicationRequest: ["medication", "dosage", "status", "authoredOn"] },
  NURSE: { ClinicalRecord: ["summary", "plan", "allergies", "medications"], Observation: ["code", "display", "valueQuantity", "interpretation", "effectiveDateTime"], DiagnosticReport: ["conclusion", "followUp"], MedicationRequest: ["medication", "dosage", "status"] },
  LAB_TECHNICIAN: { Observation: ["code", "display", "valueQuantity", "interpretation", "effectiveDateTime"], DiagnosticReport: ["conclusion", "results"] },
};

const pick = (value, fields) => Object.fromEntries(fields.filter((field) => Object.hasOwn(value, field)).map((field) => [field, value[field]]));
export const minimizeClinicalData = ({ data, role, resource, emergency = false }) => {
  if (emergency || role === "PATIENT") return structuredClone(data);
  const fields = allowedFields[role]?.[resource] ?? allowedFields[role]?.["*"];
  return Array.isArray(fields) ? pick(data, fields) : {};
};
