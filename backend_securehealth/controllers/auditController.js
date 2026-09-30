import { AuditEvent } from "../models/AuditEvent.js";
import { pagination, escapeRegex } from "../utils/query.js";
import { notFound } from "../utils/errors.js";
import { verifyAuditChain } from "../services/auditService.js";
import { listCheckpoints } from "../services/checkpointService.js";

export const list = async (req, res) => {
  const { page, limit, skip } = pagination(req.query); const query = {};
  if (req.query.decision) query.decision = req.query.decision;
  if (req.query.severity) query.severity = req.query.severity;
  if (req.query.patientId) query.patientId = req.query.patientId;
  if (req.query.search) { const regex = new RegExp(escapeRegex(req.query.search), "i"); query.$or = [{ eventId: regex }, { requestId: regex }, { resource: regex }, { action: regex }, { reason: regex }, { "actor.name": regex }, { "actor.email": regex }]; }
  const [rows, total] = await Promise.all([AuditEvent.find(query).sort({ timestamp: -1 }).skip(skip).limit(limit).lean(), AuditEvent.countDocuments(query)]);
  res.json({ data: rows, meta: { page, limit, total, pages: Math.ceil(total / limit) } });
};
export const integrity = async (_req, res) => { const [verification, checkpoints] = await Promise.all([verifyAuditChain(), listCheckpoints()]); res.json({ data: { ...verification, lastCheckpoint: checkpoints.at(-1) || null } }); };
export const get = async (req, res) => {
  const event = await AuditEvent.findOne({ eventId: req.params.eventId }).lean(); if (!event) throw notFound("Audit event");
  const checkpoint = (await listCheckpoints()).find((item) => item.chainPosition >= event.chainPosition) || null;
  res.json({ data: { ...event, checkpoint } });
};

