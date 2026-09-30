import { Router } from "express";
import { z } from "zod";
import { authenticate, authorizeRoles } from "../middleware/authenticate.js";
import { validate } from "../middleware/validateRequest.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { grantConsent, listConsents, revokeConsent } from "../services/consentService.js";

const router = Router();
const context = (req) => ({ requestId: req.requestId, ip: req.ip, userAgent: req.get("user-agent") });
router.use(authenticate);
router.get("/", asyncHandler(async (req, res) => res.json({ data: await listConsents(req.user, req.query) })));
router.post("/", authorizeRoles("PATIENT", "ADMIN"), validate(z.object({ patientId: z.string().min(2), granteeOrganizationId: z.string().min(2), granteeUserId: z.string().nullable().optional(), resources: z.array(z.string()).min(1), purposes: z.array(z.enum(["treatment", "care-coordination", "billing", "operations"])).min(1), startsAt: z.coerce.date().optional(), expiresAt: z.coerce.date().refine((date) => date > new Date(), "Expiry must be in the future") })), asyncHandler(async (req, res) => res.status(201).json({ data: await grantConsent(req.body, req.user, context(req)) })));
router.post("/:consentId/revoke", authorizeRoles("PATIENT", "ADMIN"), asyncHandler(async (req, res) => res.json({ data: await revokeConsent(req.params.consentId, req.user, context(req)) })));

export default router;

