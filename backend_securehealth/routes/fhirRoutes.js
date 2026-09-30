import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/errors.js";
import { processFHIRRequest } from "../services/fhirService.js";
import { FHIRRequest } from "../models/FHIRRequest.js";

const router = Router();
router.use(authenticate);

router.get("/requests", asyncHandler(async (req, res) => {
  if (!["ADMIN", "AUDITOR"].includes(req.user.role)) throw new AppError(403, "ROLE_DENIED", "This role cannot inspect FHIR gateway traffic");
  res.json({ data: await FHIRRequest.find().sort({ createdAt: -1 }).limit(200).lean() });
}));

router.get("/:resource", asyncHandler(async (req, res) => {
  if (!req.query.patient || !req.query.purpose) throw new AppError(400, "FHIR_CONTEXT_REQUIRED", "FHIR requests require patient and purpose parameters");
  const result = await processFHIRRequest({ user: req.user, method: "GET", resource: req.params.resource, patientId: req.query.patient, purpose: req.query.purpose, context: { ip: req.ip, userAgent: req.get("user-agent") } });
  res.status(result.status).set("x-securehealth-request-id", result.requestId).json(result.body);
}));

export default router;

