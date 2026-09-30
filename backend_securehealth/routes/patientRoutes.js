import { Router } from "express";
import { z } from "zod";
import { authenticate, authorizeRoles } from "../middleware/authenticate.js";
import { validate } from "../middleware/validateRequest.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as patientController from "../controllers/patientController.js";
import * as recordController from "../controllers/recordController.js";

const router = Router();
router.use(authenticate);
router.get("/", asyncHandler(patientController.list));
router.get("/:patientId", asyncHandler(patientController.get));
router.get("/:patientId/records", asyncHandler(recordController.list));
router.post("/:patientId/records", authorizeRoles("DOCTOR", "ADMINISTRATOR"), validate(z.object({ resource: z.enum(["ClinicalRecord", "Observation", "DiagnosticReport", "MedicationRequest"]), title: z.string().min(3).max(160), purpose: z.enum(["treatment", "care-coordination", "operations"]), sensitivity: z.enum(["STANDARD", "RESTRICTED", "HIGHLY_RESTRICTED"]).default("STANDARD"), data: z.record(z.unknown()) }).strict()), asyncHandler(recordController.create));
router.get("/:patientId/records/:recordId", asyncHandler(recordController.get));

export default router;

