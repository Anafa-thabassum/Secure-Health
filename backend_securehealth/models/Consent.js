import mongoose from "mongoose";

const schema = new mongoose.Schema({
  consentId: { type: String, required: true, unique: true, index: true },
  patientId: { type: String, required: true, index: true },
  granteeOrganizationId: { type: String, required: true, index: true },
  granteeUserId: { type: String, default: null, index: true },
  resources: { type: [String], required: true },
  purposes: { type: [String], required: true },
  status: { type: String, enum: ["ACTIVE", "EXPIRED", "REVOKED"], default: "ACTIVE", index: true },
  startsAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true, index: true },
  revokedAt: Date,
  revokedByUserId: String,
  createdByUserId: { type: String, required: true },
  version: { type: Number, default: 1 },
}, { timestamps: true });

schema.index({ patientId: 1, granteeOrganizationId: 1, status: 1, expiresAt: 1 });

export const Consent = mongoose.models.Consent || mongoose.model("Consent", schema);
