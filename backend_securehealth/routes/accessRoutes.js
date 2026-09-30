import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validateRequest.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { evaluateAccess } from "../services/accessService.js";
import { strictObject } from "../utils/validators.js";

const router = Router();
router.use(authenticate);
router.post("/evaluate", validate(strictObject({ patientId: z.string().min(2), resource: z.string().min(2), action: z.enum(["read", "create", "update"]).default("read"), purpose: z.enum(["treatment", "care-coordination", "billing", "operations", "emergency"]), sensitivity: z.enum(["STANDARD", "RESTRICTED", "HIGHLY_RESTRICTED"]).default("STANDARD") })), asyncHandler(async (req, res) => {
  const data = await evaluateAccess({ user: req.user, ...req.body, requestId: req.requestId, context: { ip: req.ip, userAgent: req.get("user-agent") } });
  res.status(data.decision === "ALLOW" ? 200 : 403).json({ data });
}));

export default router;
