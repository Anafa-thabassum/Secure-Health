import { FHIRRequest } from "../models/FHIRRequest.js";
import { AppError } from "../utils/errors.js";
import { processFHIRRequest } from "../services/fhirService.js";

const context = (req) => ({ ip: req.ip, userAgent: req.get("user-agent") });
export const listRequests = async (req, res) => {
  if (!["ADMINISTRATOR", "AUDITOR"].includes(req.user.role)) throw new AppError(403, "ROLE_DENIED", "This role cannot inspect FHIR gateway traffic");
  res.json({ data: await FHIRRequest.find().sort({ createdAt: -1 }).limit(200).lean() });
};
export const read = async (req, res) => {
  if (!req.query.patient || !req.query.purpose) throw new AppError(400, "FHIR_CONTEXT_REQUIRED", "FHIR requests require patient and purpose parameters");
  const result = await processFHIRRequest({ user: req.user, method: "GET", resource: req.params.resource, patientId: req.query.patient, purpose: req.query.purpose, context: context(req) });
  res.status(result.status).set("x-securehealth-request-id", result.requestId).json(result.body);
};
export const create = async (req, res) => {
  const result = await processFHIRRequest({ user: req.user, method: "POST", resource: req.params.resource, patientId: req.body.patientId, purpose: req.body.purpose, sensitivity: req.body.sensitivity, body: req.body.resource, context: context(req) });
  res.status(result.status).set("x-securehealth-request-id", result.requestId).json(result.body);
};

