import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { fhirRateLimiter } from "../middleware/rateLimiter.js";
import { validate } from "../middleware/validateRequest.js";
import { z } from "zod";
import * as controller from "../controllers/fhirController.js";

const router = Router();
router.use(fhirRateLimiter, authenticate);

router.get("/requests", asyncHandler(controller.listRequests));

router.get("/:resource", asyncHandler(controller.read));

router.post("/:resource", validate(z.object({ patientId: z.string().min(2), purpose: z.enum(["treatment", "care-coordination", "operations"]), sensitivity: z.enum(["STANDARD", "RESTRICTED", "HIGHLY_RESTRICTED"]).default("STANDARD"), resource: z.record(z.unknown()) }).strict()), asyncHandler(controller.create));

export default router;
