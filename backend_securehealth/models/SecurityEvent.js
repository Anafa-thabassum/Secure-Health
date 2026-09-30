import mongoose from "mongoose";

const schema = new mongoose.Schema({
  securityEventId: { type: String, required: true, unique: true, index: true },
  requestId: { type: String, index: true },
  type: { type: String, required: true, index: true },
  title: { type: String, required: true },
  detail: { type: String, required: true },
  severity: { type: String, enum: ["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"], required: true, index: true },
  actorUserId: { type: String, default: null, index: true },
  patientId: { type: String, default: null, index: true },
  organizationId: { type: String, default: null, index: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  acknowledgedAt: Date,
  acknowledgedByUserId: String,
}, { timestamps: true, minimize: false });

schema.index({ createdAt: -1, severity: 1 });

export const SecurityEvent = mongoose.models.SecurityEvent || mongoose.model("SecurityEvent", schema);
