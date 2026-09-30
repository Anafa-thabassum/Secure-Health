import { Router } from "express";
import { AuditEvent } from "../models/AuditEvent.js";
import { AuditCheckpoint } from "../models/AuditCheckpoint.js";
import { authenticate, authorizeRoles } from "../middleware/authenticate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { pagination, escapeRegex } from "../utils/query.js";
import { notFound } from "../utils/errors.js";
import { verifyAuditChain } from "../services/auditService.js";

const router = Router();
router.use(authenticate, authorizeRoles("ADMIN", "AUDITOR"));

router.get("/", asyncHandler(async (req, res) => {
  const { page, limit, skip } = pagination(req.query);
  const query = {};
  if (req.query.decision) query.decision = req.query.decision;
  if (req.query.severity) query.severity = req.query.severity;
  if (req.query.patientId) query.patientId = req.query.patientId;
  if (req.query.search) {
    const regex = new RegExp(escapeRegex(req.query.search), "i");
    query.$or = [{ eventId: regex }, { requestId: regex }, { resource: regex }, { action: regex }, { reason: regex }, { "actor.name": regex }, { "actor.email": regex }];
  }
  const [rows, total] = await Promise.all([AuditEvent.find(query).sort({ timestamp: -1 }).skip(skip).limit(limit).lean(), AuditEvent.countDocuments(query)]);
  res.json({ data: rows, meta: { page, limit, total, pages: Math.ceil(total / limit) } });
}));

router.get("/integrity", asyncHandler(async (_req, res) => {
  const [verification, checkpoint] = await Promise.all([verifyAuditChain(), AuditCheckpoint.findOne().sort({ chainPosition: -1 }).lean()]);
  res.json({ data: { ...verification, lastCheckpoint: checkpoint } });
}));

router.get("/:eventId", asyncHandler(async (req, res) => {
  const event = await AuditEvent.findOne({ eventId: req.params.eventId }).lean();
  if (!event) throw notFound("Audit event");
  const checkpoint = await AuditCheckpoint.findOne({ chainPosition: { $gte: event.chainPosition } }).sort({ chainPosition: 1 }).lean();
  res.json({ data: { ...event, checkpoint } });
}));

export default router;

