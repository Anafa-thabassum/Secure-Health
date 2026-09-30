import mongoose from "mongoose";

const encryptedPayload = new mongoose.Schema({
  algorithm: { type: String, enum: ["aes-256-gcm"], required: true },
  keyId: { type: String, required: true },
  iv: { type: String, required: true },
  ciphertext: { type: String, required: true },
  authTag: { type: String, required: true },
}, { _id: false });

const schema = new mongoose.Schema({
  recordId: { type: String, required: true, unique: true, index: true },
  patientId: { type: String, required: true, index: true },
  organizationId: { type: String, required: true, index: true },
  resource: { type: String, required: true, index: true },
  title: { type: String, required: true },
  authoredAt: { type: Date, required: true, index: true },
  authorUserId: { type: String, required: true },
  sensitivity: { type: String, enum: ["STANDARD", "RESTRICTED", "HIGHLY_RESTRICTED"], default: "STANDARD" },
  encryptedPayload: { type: encryptedPayload, required: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true, minimize: false });

schema.index({ patientId: 1, resource: 1, authoredAt: -1 });

export const ClinicalRecord = mongoose.models.ClinicalRecord || mongoose.model("ClinicalRecord", schema);
