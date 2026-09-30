import mongoose from "mongoose";

const schema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  tokenHash: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  revokedAt: Date,
  replacedBySessionId: String,
  ip: String,
  userAgent: String,
}, { timestamps: true });

export const RefreshSession = mongoose.models.RefreshSession || mongoose.model("RefreshSession", schema);
