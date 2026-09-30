import mongoose from "mongoose";

const schema = new mongoose.Schema({
  patientId: { type: String, required: true, unique: true, index: true },
  organizationId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  gender: String,
  mrn: { type: String, required: true, unique: true },
  condition: String,
  primaryDoctorId: { type: String, index: true },
  careTeamUserIds: { type: [String], default: [] },
  status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
}, { timestamps: true });

export const Patient = mongoose.models.Patient || mongoose.model("Patient", schema);
