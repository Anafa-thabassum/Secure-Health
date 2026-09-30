import mongoose from "mongoose";

const schema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  passwordHash: { type: String, required: true, select: false },
  name: { type: String, required: true, trim: true },
  role: { type: String, enum: ["PATIENT", "DOCTOR", "ADMIN", "AUDITOR"], required: true, index: true },
  organizationId: { type: String, required: true, index: true },
  patientId: { type: String, default: null, index: true },
  careRelationships: { type: [String], default: [] },
  status: { type: String, enum: ["ACTIVE", "SUSPENDED", "INVITED"], default: "ACTIVE", index: true },
  lastLoginAt: Date,
  passwordChangedAt: Date,
}, { timestamps: true, minimize: false });

schema.set("toJSON", { transform: (_doc, value) => { delete value.passwordHash; delete value.__v; return value; } });

export const User = mongoose.models.User || mongoose.model("User", schema);
