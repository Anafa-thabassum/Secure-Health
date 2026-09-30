import mongoose from "mongoose";

const schema = new mongoose.Schema({
  checkpointId: { type: String, required: true, unique: true, immutable: true },
  chainPosition: { type: Number, required: true, unique: true, immutable: true },
  eventId: { type: String, required: true, immutable: true },
  hash: { type: String, required: true, immutable: true },
  signature: { type: String, required: true, immutable: true },
  publicKeyFingerprint: { type: String, required: true, immutable: true },
  timestamp: { type: Date, required: true, immutable: true },
}, { timestamps: false, strict: "throw" });

export const AuditCheckpoint = mongoose.models.AuditCheckpoint || mongoose.model("AuditCheckpoint", schema);
