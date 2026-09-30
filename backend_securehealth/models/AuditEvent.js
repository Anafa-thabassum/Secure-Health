import mongoose from "mongoose";

const schema = new mongoose.Schema({
  eventId: { type: String, required: true, unique: true, index: true, immutable: true },
  requestId: { type: String, required: true, index: true, immutable: true },
  chainPosition: { type: Number, required: true, unique: true, index: true, immutable: true },
  timestamp: { type: Date, required: true, index: true, immutable: true },
  actor: { type: mongoose.Schema.Types.Mixed, required: true, immutable: true },
  patientId: { type: String, default: null, index: true, immutable: true },
  organizationId: { type: String, default: null, index: true, immutable: true },
  resource: { type: String, required: true, index: true, immutable: true },
  action: { type: String, required: true, index: true, immutable: true },
  purpose: { type: String, default: null, immutable: true },
  decision: { type: String, enum: ["ALLOW", "DENY", "INFO"], required: true, index: true, immutable: true },
  reason: { type: String, required: true, immutable: true },
  severity: { type: String, enum: ["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"], default: "INFO", index: true, immutable: true },
  context: { type: mongoose.Schema.Types.Mixed, default: {}, immutable: true },
  previousHash: { type: String, required: true, immutable: true },
  currentHash: { type: String, required: true, unique: true, immutable: true },
}, { timestamps: false, strict: "throw", minimize: false });

schema.index({ timestamp: -1, decision: 1, severity: 1 });

export const AuditEvent = mongoose.models.AuditEvent || mongoose.model("AuditEvent", schema);
