import mongoose from "mongoose";

const schema = new mongoose.Schema({
  tokenId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  reason: { type: String, required: true },
}, { timestamps: true });

export const RevokedAccessToken = mongoose.models.RevokedAccessToken || mongoose.model("RevokedAccessToken", schema);
