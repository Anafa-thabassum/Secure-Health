import mongoose from "mongoose";

const schema = new mongoose.Schema({
  messageId: { type: String, required: true, unique: true, index: true },
  to: { type: String, required: true },
  from: { type: String, required: true },
  template: { type: String, required: true },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  status: { type: String, enum: ["PENDING", "SENT", "FAILED"], default: "PENDING", index: true },
  attempts: { type: Number, default: 0 },
  sentAt: Date,
  lastError: String,
}, { timestamps: true, minimize: false });

export const MailOutbox = mongoose.models.MailOutbox || mongoose.model("MailOutbox", schema);
