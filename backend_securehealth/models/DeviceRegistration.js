import mongoose from "mongoose";

const schema = new mongoose.Schema({
  registrationId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  organizationId: { type: String, required: true, index: true },
  platform: { type: String, enum: ["ANDROID", "IOS"], required: true, index: true },
  tokenHash: { type: String, required: true, unique: true, select: false },
  tokenEnvelope: { type: mongoose.Schema.Types.Mixed, required: true, select: false },
  deviceId: { type: String, default: null },
  label: { type: String, default: null },
  appId: { type: String, default: null },
  status: { type: String, enum: ["ACTIVE", "REVOKED", "INVALID"], default: "ACTIVE", index: true },
  lastRegisteredAt: { type: Date, required: true },
  revokedAt: { type: Date, default: null },
  invalidatedAt: { type: Date, default: null },
  lastFailureCode: { type: String, default: null },
}, { timestamps: true, minimize: false });

schema.index({ userId: 1, status: 1 });
schema.set("toJSON", {
  transform: (_doc, value) => {
    delete value.tokenHash;
    delete value.tokenEnvelope;
    delete value.__v;
    return value;
  },
});

export const DeviceRegistration = mongoose.models.DeviceRegistration || mongoose.model("DeviceRegistration", schema);
