import { Router } from "express";
import { z } from "zod";
import { authenticate, authorizeRoles } from "../middleware/authenticate.js";
import { validate } from "../middleware/validateRequest.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as controller from "../controllers/emergencyController.js";

const router = Router();
router.use(authenticate);
router.get("/", authorizeRoles("ADMINISTRATOR", "DOCTOR", "AUDITOR"), asyncHandler(controller.list));
router.post("/activate", authorizeRoles("DOCTOR"), validate(z.object({ patientId: z.string().min(2), resource: z.string().min(2), reason: z.string().min(12).max(500), durationMinutes: z.union([z.literal(5), z.literal(15), z.literal(30)]), acknowledgment: z.literal(true) }).strict()), asyncHandler(controller.activate));
router.post("/:breakGlassId/end", authorizeRoles("DOCTOR", "ADMINISTRATOR"), asyncHandler(controller.end));
router.post("/:breakGlassId/review", authorizeRoles("ADMINISTRATOR"), validate(z.object({ outcome: z.enum(["APPROVED", "POLICY_BREACH", "ESCALATED"]), notes: z.string().min(3).max(1000) }).strict()), asyncHandler(controller.review));

export default router;
