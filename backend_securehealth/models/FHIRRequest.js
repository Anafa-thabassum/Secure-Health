import mongoose from "mongoose";

const schema = new mongoose.Schema({
  fhirRequestId: { type: String, required: true, unique: true, index: true },
  requestId: { type: String, required: true, index: true },
  method: { type: String, required: true },
  endpoint: { type: String, required: true },
  fhirResource: { type: String, required: true, index: true },
  requesterUserId: { type: String, required: true, index: true },
  organizationId: { type: String, required: true },
  patientId: { type: String, required: true, index: true },
  purpose: { type: String, required: true },
  decision: { type: String, enum: ["ALLOW", "DENY"], required: true, index: true },
  policyEvaluation: { type: mongoose.Schema.Types.Mixed, required: true },
  responseStatus: { type: Number, required: true },
  latencyMs: { type: Number, required: true },
}, { timestamps: true, minimize: false });

export const FHIRRequest = mongoose.models.FHIRRequest || mongoose.model("FHIRRequest", schema);
