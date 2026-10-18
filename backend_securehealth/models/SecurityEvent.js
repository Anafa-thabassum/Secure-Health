import mongoose from "mongoose";

const deliverySchema = new mongoose.Schema({
  registrationId: { type: String, required: true },
  platform: { type: String, enum: ["ANDROID", "IOS"], required: true },
  status: { type: String, enum: ["ACCEPTED", "TRANSIENT_FAILURE", "PERMANENT_FAILURE"], required: true },
  providerMessageId: { type: String, default: null },
  code: { type: String, default: null },
  message: { type: String, default: null },
  attemptedAt: { type: Date, required: true },
}, { _id: false });

const notificationSchema = new mongoose.Schema({
  status: { type: String, enum: ["NOT_REQUIRED", "PENDING", "PROCESSING", "RETRY", "ACCEPTED", "FAILED"], required: true },
  attempts: { type: Number, default: 0, min: 0 },
  nextAttemptAt: { type: Date, default: null },
  leaseUntil: { type: Date, default: null },
  acceptedAt: { type: Date, default: null },
  lastAttemptAt: { type: Date, default: null },
  lastError: { type: String, default: null },
  deliveries: { type: [deliverySchema], default: [] },
}, { _id: false });

const schema = new mongoose.Schema({
  securityEventId: { type: String, required: true, unique: true, index: true },
  requestId: { type: String, index: true },
  type: { type: String, required: true, index: true },
  title: { type: String, required: true },
  detail: { type: String, required: true },
  severity: { type: String, enum: ["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"], required: true, index: true },
  actorUserId: { type: String, default: null, index: true },
  patientId: { type: String, default: null, index: true },
  organizationId: { type: String, default: null, index: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  notification: { type: notificationSchema, required: true },
  acknowledgedAt: Date,
  acknowledgedByUserId: String,
}, { timestamps: true, minimize: false });

schema.index({ createdAt: -1, severity: 1 });
schema.index({ "notification.status": 1, "notification.nextAttemptAt": 1 });

export const SecurityEvent = mongoose.models.SecurityEvent || mongoose.model("SecurityEvent", schema);
