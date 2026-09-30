import { Router } from "express";
import { z } from "zod";
import { authenticate, authorizeRoles } from "../middleware/authenticate.js";
import { validate } from "../middleware/validateRequest.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as controller from "../controllers/consentController.js";

const router = Router();
router.use(authenticate);
router.get("/", asyncHandler(controller.list));
router.post("/", authorizeRoles("PATIENT", "ADMINISTRATOR"), validate(z.object({ patientId: z.string().min(2), granteeOrganizationId: z.string().min(2), granteeUserId: z.string().nullable().optional(), resources: z.array(z.string()).min(1), purposes: z.array(z.enum(["treatment", "care-coordination", "billing", "operations"])).min(1), startsAt: z.coerce.date().optional(), expiresAt: z.coerce.date().refine((date) => date > new Date(), "Expiry must be in the future") }).strict()), asyncHandler(controller.grant));
router.post("/:consentId/revoke", authorizeRoles("PATIENT", "ADMINISTRATOR"), asyncHandler(controller.revoke));

export default router;
