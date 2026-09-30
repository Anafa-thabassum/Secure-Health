import mongoose from "mongoose";

const schema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  tokenHash: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  usedAt: Date,
}, { timestamps: true });

export const EmailVerificationToken = mongoose.models.EmailVerificationToken || mongoose.model("EmailVerificationToken", schema);
