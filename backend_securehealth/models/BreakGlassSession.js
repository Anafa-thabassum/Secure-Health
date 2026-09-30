import mongoose from "mongoose";

const schema = new mongoose.Schema({
  breakGlassId: { type: String, required: true, unique: true, index: true },
  doctorUserId: { type: String, required: true, index: true },
  patientId: { type: String, required: true, index: true },
  resource: { type: String, required: true },
  reason: { type: String, required: true },
  acknowledgment: { type: Boolean, required: true },
  status: { type: String, enum: ["ACTIVE", "ENDED", "EXPIRED", "REVIEW_REQUIRED", "REVIEWED"], default: "ACTIVE", index: true },
  expiresAt: { type: Date, required: true, index: true },
  endedAt: Date,
  endedByUserId: String,
  accessedResources: { type: [{ resource: String, recordId: String, requestId: String, accessedAt: Date }], default: [] },
  review: { type: mongoose.Schema.Types.Mixed, default: null },
}, { timestamps: true, minimize: false });

schema.index({ doctorUserId: 1, patientId: 1, status: 1, expiresAt: 1 });

export const BreakGlassSession = mongoose.models.BreakGlassSession || mongoose.model("BreakGlassSession", schema);
