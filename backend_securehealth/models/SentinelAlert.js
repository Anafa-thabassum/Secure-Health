import mongoose from "mongoose";

const schema = new mongoose.Schema({
  alertId: { type: String, required: true, unique: true, index: true },
  rule: { type: String, required: true, index: true },
  severity: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"], required: true, index: true },
  status: { type: String, enum: ["OPEN", "INVESTIGATING", "ACKNOWLEDGED", "RESOLVED"], default: "OPEN", index: true },
  title: { type: String, required: true },
  reason: { type: String, required: true },
  actorUserId: { type: String, default: null, index: true },
  organizationId: { type: String, default: null },
  evidence: { type: mongoose.Schema.Types.Mixed, default: {} },
  acknowledgedAt: Date,
  acknowledgedByUserId: String,
}, { timestamps: true, minimize: false });

export const SentinelAlert = mongoose.models.SentinelAlert || mongoose.model("SentinelAlert", schema);
