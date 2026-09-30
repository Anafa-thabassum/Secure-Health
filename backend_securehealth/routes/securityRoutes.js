import { Router } from "express";
import { SecurityEvent } from "../models/SecurityEvent.js";
import { AuditEvent } from "../models/AuditEvent.js";
import { SentinelAlert } from "../models/SentinelAlert.js";
import { authenticate, authorizeRoles } from "../middleware/authenticate.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(authenticate, authorizeRoles("ADMIN", "AUDITOR"));

router.get("/events", asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.severity) query.severity = req.query.severity;
  if (req.query.type) query.type = req.query.type;
  const events = await SecurityEvent.find(query).sort({ createdAt: -1 }).limit(Math.min(200, Number(req.query.limit) || 50)).lean();
  res.json({ data: events });
}));

router.get("/metrics", asyncHandler(async (_req, res) => {
  const since = new Date(Date.now() - 24 * 60 * 60_000);
  const [total, allowed, denied, suspicious, critical, timeline] = await Promise.all([
    AuditEvent.countDocuments({ timestamp: { $gte: since } }), AuditEvent.countDocuments({ timestamp: { $gte: since }, decision: "ALLOW" }), AuditEvent.countDocuments({ timestamp: { $gte: since }, decision: "DENY" }),
    SentinelAlert.countDocuments({ createdAt: { $gte: since }, status: { $ne: "RESOLVED" } }), SecurityEvent.countDocuments({ createdAt: { $gte: since }, severity: "CRITICAL" }),
    AuditEvent.aggregate([{ $match: { timestamp: { $gte: since } } }, { $group: { _id: { hour: { $dateTrunc: { date: "$timestamp", unit: "hour" } }, decision: "$decision" }, count: { $sum: 1 } } }, { $sort: { "_id.hour": 1 } }]),
  ]);
  res.json({ data: { totalRequests: total, allowed, denied, suspicious, critical, timeline } });
}));

export default router;

