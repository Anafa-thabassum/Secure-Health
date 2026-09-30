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

const router = Router();
router.use(authenticate, authorizeRoles("ADMIN"));

router.get("/users", asyncHandler(async (_req, res) => res.json({ data: await User.find().sort({ createdAt: -1 }).lean() })));
router.patch("/users/:userId/status", validate(z.object({ status: z.enum(["ACTIVE", "SUSPENDED", "INVITED"]) })), asyncHandler(async (req, res) => {
  const user = await User.findOneAndUpdate({ userId: req.params.userId }, { $set: { status: req.body.status } }, { new: true }).lean();
  if (!user) throw notFound("User");
  res.json({ data: user });
}));
router.get("/roles", (_req, res) => res.json({ data: ["PATIENT", "DOCTOR", "ADMIN", "AUDITOR"].map((role) => ({ role, permissions: permissionsForRole(role) })) }));
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

