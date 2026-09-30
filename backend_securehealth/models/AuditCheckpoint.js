import mongoose from "mongoose";

export const auditCheckpointSchema = new mongoose.Schema({
  checkpointId: { type: String, required: true, unique: true, immutable: true },
  chainPosition: { type: Number, required: true, unique: true, immutable: true },
  eventId: { type: String, required: true, immutable: true },
  hash: { type: String, required: true, immutable: true },
  signature: { type: String, required: true, immutable: true },
  publicKeyFingerprint: { type: String, required: true, immutable: true },
  timestamp: { type: Date, required: true, immutable: true },
}, { timestamps: false, strict: "throw", collection: "audit_checkpoints" });

export const createAuditCheckpointModel = (connection = mongoose) => connection.models.AuditCheckpoint || connection.model("AuditCheckpoint", auditCheckpointSchema);
export const AuditCheckpoint = createAuditCheckpointModel();
