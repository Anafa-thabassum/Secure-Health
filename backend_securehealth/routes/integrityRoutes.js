import { Router } from "express";
import { z } from "zod";
import { AuditEvent } from "../models/AuditEvent.js";
import { getConfig } from "../config/env.js";
import { authenticate, authorizeRoles } from "../middleware/authenticate.js";
import { validate } from "../middleware/validateRequest.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError, notFound } from "../utils/errors.js";
import { verifyAuditChain } from "../services/auditService.js";
import { recordSecurityEvent } from "../services/securityEventService.js";

const router = Router();
router.use(authenticate, authorizeRoles("ADMIN", "AUDITOR"));
router.get("/verify", asyncHandler(async (_req, res) => res.json({ data: await verifyAuditChain() })));
router.post("/demo/tamper", validate(z.object({ eventId: z.string().min(4), reason: z.string().min(3).default("Academic tamper-detection scenario") })), asyncHandler(async (req, res) => {
  if (!getConfig().allowDemoTamper || getConfig().production) throw new AppError(403, "DEMO_DISABLED", "Tamper simulation is disabled");
  const event = await AuditEvent.findOne({ eventId: req.body.eventId }).lean();
  if (!event) throw notFound("Audit event");
  await AuditEvent.collection.updateOne({ eventId: req.body.eventId }, { $set: { reason: req.body.reason } });
  const result = await verifyAuditChain();
  await recordSecurityEvent({ requestId: req.requestId, type: "TAMPERING_DETECTED", title: "Audit integrity verification failed", detail: `Hash mismatch at ${req.body.eventId}`, severity: "CRITICAL", actorUserId: req.user.userId, organizationId: req.user.organizationId, metadata: result });
  res.json({ data: result });
}));

export default router;

