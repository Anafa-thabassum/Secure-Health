import { FHIRRequest } from "../models/FHIRRequest.js";
import { ClinicalRecord } from "../models/ClinicalRecord.js";
import { ids } from "../utils/ids.js";
import { evaluateAccess } from "./accessService.js";
import { decryptClinicalData } from "./encryptionService.js";

export const processFHIRRequest = async ({ user, method, resource, patientId, purpose, context }) => {
  const started = performance.now();
  const requestId = ids.request();
  const evaluation = await evaluateAccess({ user, patientId, resource, action: method === "GET" ? "read" : "create", purpose, requestId, context: { ...context, channel: "FHIR" } });
  let body;
  let status = 403;
  if (evaluation.decision === "ALLOW") {
    const records = await ClinicalRecord.find({ patientId, resource }).sort({ authoredAt: -1 }).limit(50).lean();
    body = {
      resourceType: "Bundle", type: "searchset", total: records.length,
      entry: records.map((record) => ({ fullUrl: `urn:uuid:${record.recordId}`, resource: { resourceType: record.resource, id: record.recordId, subject: { reference: `Patient/${patientId}` }, ...decryptClinicalData(record.encryptedPayload, `${record.patientId}:${record.recordId}`) } })),
    };
    status = 200;
  } else {
    body = { resourceType: "OperationOutcome", issue: evaluation.reasons.map((diagnostics) => ({ severity: "error", code: "forbidden", diagnostics })) };
  }
  const fhirRequestId = ids.fhir();
  await FHIRRequest.create({ fhirRequestId, requestId, method, endpoint: `/fhir/${resource}?patient=${patientId}`, fhirResource: resource, requesterUserId: user.userId, organizationId: user.organizationId, patientId, purpose, decision: evaluation.decision, policyEvaluation: evaluation, responseStatus: status, latencyMs: Math.round(performance.now() - started) });
  return { fhirRequestId, requestId, status, evaluation, body };
};

