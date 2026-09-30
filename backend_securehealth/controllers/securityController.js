import { SecurityEvent } from "../models/SecurityEvent.js";
import { AuditEvent } from "../models/AuditEvent.js";
import { SentinelAlert } from "../models/SentinelAlert.js";

export const events = async (req, res) => {
  const query = {};
  if (req.query.severity) query.severity = req.query.severity;
  if (req.query.type) query.type = req.query.type;
  res.json({ data: await SecurityEvent.find(query).sort({ createdAt: -1 }).limit(Math.min(200, Number(req.query.limit) || 50)).lean() });
};
export const metrics = async (_req, res) => {
  const since = new Date(Date.now() - 24 * 60 * 60_000);
  const [total, allowed, denied, suspicious, critical, timeline] = await Promise.all([
    AuditEvent.countDocuments({ timestamp: { $gte: since } }), AuditEvent.countDocuments({ timestamp: { $gte: since }, decision: "ALLOW" }), AuditEvent.countDocuments({ timestamp: { $gte: since }, decision: "DENY" }),
    SentinelAlert.countDocuments({ createdAt: { $gte: since }, status: { $ne: "RESOLVED" } }), SecurityEvent.countDocuments({ createdAt: { $gte: since }, severity: "CRITICAL" }),
    AuditEvent.aggregate([{ $match: { timestamp: { $gte: since } } }, { $group: { _id: { hour: { $dateTrunc: { date: "$timestamp", unit: "hour" } }, decision: "$decision" }, count: { $sum: 1 } } }, { $sort: { "_id.hour": 1 } }]),
  ]);
  res.json({ data: { totalRequests: total, allowed, denied, suspicious, critical, timeline } });
};

