import { FHIRRequest } from "../models/FHIRRequest.js";
import { ClinicalRecord } from "../models/ClinicalRecord.js";
import { ids } from "../utils/ids.js";
import { evaluateAccess } from "./accessService.js";
import { decryptClinicalData } from "./encryptionService.js";
import { encryptClinicalData } from "./encryptionService.js";
import { minimizeClinicalData } from "./dataMinimizationService.js";
import { observeBulkAccess } from "./sentinelService.js";

export const processFHIRRequest = async ({ user, method, resource, patientId, purpose, context, body: resourceBody, sensitivity = "STANDARD" }) => {
  const started = performance.now();
  const requestId = ids.request();
  const evaluation = await evaluateAccess({ user, patientId, resource, action: method === "GET" ? "read" : "create", purpose, requestId, context: { ...context, channel: "FHIR" } });
  let body;
  let status = 403;
  if (evaluation.decision === "ALLOW" && method === "GET") {
    const records = await ClinicalRecord.find({ patientId, resource }).sort({ authoredAt: -1 }).limit(50).lean();
    await observeBulkAccess({ user, recordCount: records.length, requestId, resource });
    body = {
      resourceType: "Bundle", type: "searchset", total: records.length,
      entry: records.map((record) => ({ fullUrl: `urn:uuid:${record.recordId}`, resource: { resourceType: record.resource, id: record.recordId, subject: { reference: `Patient/${patientId}` }, ...minimizeClinicalData({ data: decryptClinicalData(record.encryptedPayload, `${record.patientId}:${record.recordId}`), role: user.role, resource: record.resource, emergency: evaluation.emergency }) } })),
    };
    status = 200;
  } else if (evaluation.decision === "ALLOW" && method === "POST") {
    const recordId = `FHIR-${ids.session().slice(0, 12).toUpperCase()}`;
    const record = await ClinicalRecord.create({ recordId, patientId, organizationId: user.organizationId, resource, title: resourceBody?.title || `${resource} submitted through FHIR gateway`, authoredAt: new Date(), authorUserId: user.userId, sensitivity, encryptedPayload: encryptClinicalData(resourceBody, `${patientId}:${recordId}`), metadata: { channel: "FHIR", protection: "AES-256-GCM" } });
    body = { resourceType: resource, id: record.recordId, meta: { security: [{ code: sensitivity }] } };
    status = 201;
  } else {
    body = { resourceType: "OperationOutcome", issue: evaluation.reasons.map((diagnostics) => ({ severity: "error", code: "forbidden", diagnostics })) };
  }
  const fhirRequestId = ids.fhir();
  await FHIRRequest.create({ fhirRequestId, requestId, method, endpoint: `/fhir/${resource}?patient=${patientId}`, fhirResource: resource, requesterUserId: user.userId, organizationId: user.organizationId, patientId, purpose, decision: evaluation.decision, policyEvaluation: evaluation, responseStatus: status, latencyMs: Math.round(performance.now() - started) });
  return { fhirRequestId, requestId, status, evaluation, body };
};
