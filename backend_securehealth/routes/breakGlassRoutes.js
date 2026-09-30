import { Router } from "express";
import { z } from "zod";
import { BreakGlassSession } from "../models/BreakGlassSession.js";
import { authenticate, authorizeRoles } from "../middleware/authenticate.js";
import { validate } from "../middleware/validateRequest.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { activateBreakGlass, endBreakGlass, reviewBreakGlass } from "../services/breakGlassService.js";

const router = Router();
const context = (req) => ({ requestId: req.requestId, ip: req.ip, userAgent: req.get("user-agent") });
router.use(authenticate);
router.get("/", authorizeRoles("ADMIN", "DOCTOR", "AUDITOR"), asyncHandler(async (req, res) => {
  const query = req.user.role === "DOCTOR" ? { doctorUserId: req.user.userId } : {};
  res.json({ data: await BreakGlassSession.find(query).sort({ createdAt: -1 }).lean() });
}));
router.post("/activate", authorizeRoles("DOCTOR"), validate(z.object({ patientId: z.string().min(2), resource: z.string().min(2), reason: z.string().min(12).max(500), durationMinutes: z.union([z.literal(5), z.literal(15), z.literal(30)]), acknowledgment: z.literal(true) })), asyncHandler(async (req, res) => res.status(201).json({ data: await activateBreakGlass(req.body, req.user, context(req)) })));
router.post("/:breakGlassId/end", authorizeRoles("DOCTOR", "ADMIN"), asyncHandler(async (req, res) => res.json({ data: await endBreakGlass(req.params.breakGlassId, req.user, context(req)) })));
router.post("/:breakGlassId/review", authorizeRoles("ADMIN"), validate(z.object({ outcome: z.enum(["APPROVED", "POLICY_BREACH", "ESCALATED"]), notes: z.string().min(3).max(1000) })), asyncHandler(async (req, res) => res.json({ data: await reviewBreakGlass(req.params.breakGlassId, req.body, req.user, context(req)) })));

export default router;

