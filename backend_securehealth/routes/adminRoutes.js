import { Router } from "express";
import { z } from "zod";
import { User } from "../models/User.js";
import { authenticate, authorizeRoles } from "../middleware/authenticate.js";
import { validate } from "../middleware/validateRequest.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { permissionsForRole } from "../services/policyEngine.js";
import { databaseHealth } from "../config/database.js";
import { redisHealth } from "../config/redis.js";
import { notFound } from "../utils/errors.js";
import { revokeAllRefreshSessions } from "../services/sessionService.js";
import { appendAuditEvent } from "../services/auditService.js";
import { authorize } from "../middleware/authorize.js";

const router = Router();
router.use(authenticate, authorizeRoles("ADMINISTRATOR"));

router.get("/users", authorize("User", "read"), asyncHandler(async (_req, res) => res.json({ data: await User.find().sort({ createdAt: -1 }).lean() })));
router.patch("/users/:userId/status", validate(z.object({ status: z.enum(["ACTIVE", "SUSPENDED", "INVITED"]) }).strict()), asyncHandler(async (req, res) => {
  const user = await User.findOne({ userId: req.params.userId });
  if (!user) throw notFound("User");
  user.status = req.body.status;
  if (req.body.status !== "ACTIVE") { user.sessionVersion = (user.sessionVersion || 1) + 1; await revokeAllRefreshSessions(user.userId); }
  await user.save();
  await appendAuditEvent({ requestId: req.requestId, actor: req.user, organizationId: req.user.organizationId, resource: "User", action: "STATUS_CHANGE", decision: "INFO", reason: `User status changed to ${req.body.status}`, severity: req.body.status === "SUSPENDED" ? "HIGH" : "MEDIUM", context: { targetUserId: user.userId, ip: req.ip, userAgent: req.get("user-agent") } });
  res.json({ data: user.toJSON() });
}));
router.get("/roles", (_req, res) => res.json({ data: ["PATIENT", "DOCTOR", "NURSE", "LAB_TECHNICIAN", "ADMINISTRATOR", "AUDITOR"].map((role) => ({ role, permissions: permissionsForRole(role) })) }));
router.get("/policies", (_req, res) => res.json({ data: [
  { id: "POL-RBAC-01", name: "Role-based clinical access", status: "ENFORCED", version: 4 },
  { id: "POL-ABAC-02", name: "Organization and care relationship", status: "ENFORCED", version: 7 },
  { id: "POL-CONSENT-03", name: "Consent firewall", status: "ENFORCED", version: 12 },
  { id: "POL-EMERGENCY-04", name: "Time-bound emergency override", status: "ENFORCED", version: 3 },
] }));
router.get("/system-health", (_req, res) => {
  const database = databaseHealth(); const redis = redisHealth();
  res.json({ data: {
    overall: database.connected && redis.connected ? "HEALTHY" : "DEGRADED",
    services: [
      { name: "Authorization Engine", status: "OPERATIONAL" }, { name: "Consent Service", status: redis.connected ? "OPERATIONAL" : "DEGRADED" },
      { name: "Encryption Service", status: "OPERATIONAL" }, { name: "Audit Integrity", status: database.connected ? "OPERATIONAL" : "UNAVAILABLE" },
      { name: "Sentinel", status: redis.connected ? "OPERATIONAL" : "DEGRADED" }, { name: "FHIR Gateway", status: "OPERATIONAL" },
      { name: "MongoDB", status: database.state.toUpperCase() }, { name: "Redis", status: redis.state.toUpperCase() },
    ],
  } });
});

export default router;
