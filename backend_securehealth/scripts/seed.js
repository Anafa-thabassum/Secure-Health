import dotenv from "dotenv";
dotenv.config();
import bcrypt from "bcryptjs";
import { getConfig } from "../config/env.js";
import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { User } from "../models/User.js";
import { Patient } from "../models/Patient.js";
import { ClinicalRecord } from "../models/ClinicalRecord.js";
import { Consent } from "../models/Consent.js";
import { AuditEvent } from "../models/AuditEvent.js";
import { AuditCheckpoint } from "../models/AuditCheckpoint.js";
import { SecurityEvent } from "../models/SecurityEvent.js";
import { SentinelAlert } from "../models/SentinelAlert.js";
import { FHIRRequest } from "../models/FHIRRequest.js";
import { BreakGlassSession } from "../models/BreakGlassSession.js";
import { RefreshSession } from "../models/RefreshSession.js";
import { PasswordResetToken } from "../models/PasswordResetToken.js";
import { encryptClinicalData } from "../services/encryptionService.js";
import { appendAuditEvent } from "../services/auditService.js";

const config = getConfig();
await connectDatabase(config.mongoUri);

await Promise.all([User, Patient, ClinicalRecord, Consent, AuditEvent, AuditCheckpoint, SecurityEvent, SentinelAlert, FHIRRequest, BreakGlassSession, RefreshSession, PasswordResetToken].map((model) => model.deleteMany({})));
const passwordHash = await bcrypt.hash("SecureHealth!2026", 12);
const verified = new Date();

await User.insertMany([
  { userId: "USR-ADMIN", email: "admin@securehealth.demo", passwordHash, name: "Elena Torres", role: "ADMINISTRATOR", organizationId: "ORG-NORTHSTAR", status: "ACTIVE", emailVerifiedAt: verified },
  { userId: "USR-0182", email: "maya.chen@securehealth.demo", passwordHash, name: "Dr. Maya Chen", role: "DOCTOR", organizationId: "ORG-NORTHSTAR", careRelationships: ["P001", "P014", "P027", "P038"], status: "ACTIVE", emailVerifiedAt: verified },
  { userId: "USR-0219", email: "amir.khan@securehealth.demo", passwordHash, name: "Dr. Amir Khan", role: "DOCTOR", organizationId: "ORG-NORTHSTAR", careRelationships: ["P014", "P038"], status: "ACTIVE", emailVerifiedAt: verified },
  { userId: "USR-NURSE", email: "nurse@securehealth.demo", passwordHash, name: "Nurse Riley", role: "NURSE", organizationId: "ORG-NORTHSTAR", careRelationships: ["P001", "P014"], status: "ACTIVE", emailVerifiedAt: verified },
  { userId: "USR-LAB", email: "lab@securehealth.demo", passwordHash, name: "Jamie Lab", role: "LAB_TECHNICIAN", organizationId: "ORG-NORTHSTAR", careRelationships: ["P014"], status: "ACTIVE", emailVerifiedAt: verified },
  { userId: "USR-P001", email: "avery.morgan@securehealth.demo", passwordHash, name: "Avery Morgan", role: "PATIENT", organizationId: "ORG-NORTHSTAR", patientId: "P001", status: "ACTIVE", emailVerifiedAt: verified },
  { userId: "USR-AUDIT", email: "auditor@securehealth.demo", passwordHash, name: "Morgan Ellis", role: "AUDITOR", organizationId: "ORG-NORTHSTAR", status: "ACTIVE", emailVerifiedAt: verified },
]);

await Patient.insertMany([
  { patientId: "P001", organizationId: "ORG-NORTHSTAR", name: "Avery Morgan", dateOfBirth: "1984-04-18", gender: "female", mrn: "MRN-2048-771", condition: "Hypertension", primaryDoctorId: "USR-0182", careTeamUserIds: ["USR-0182"] },
  { patientId: "P014", organizationId: "ORG-NORTHSTAR", name: "Jordan Lee", dateOfBirth: "1969-08-02", gender: "male", mrn: "MRN-1911-420", condition: "Type 2 diabetes", primaryDoctorId: "USR-0219", careTeamUserIds: ["USR-0182", "USR-0219"] },
  { patientId: "P027", organizationId: "ORG-NORTHSTAR", name: "Samira Patel", dateOfBirth: "1993-11-11", gender: "female", mrn: "MRN-2284-119", condition: "Post-operative review", primaryDoctorId: "USR-0182", careTeamUserIds: ["USR-0182"] },
  { patientId: "P038", organizationId: "ORG-NORTHSTAR", name: "Theo Brooks", dateOfBirth: "1958-01-24", gender: "male", mrn: "MRN-1734-885", condition: "Cardiac monitoring", primaryDoctorId: "USR-0219", careTeamUserIds: ["USR-0219"] },
]);

const recordRows = [
  { recordId: "REC-7781", patientId: "P001", resource: "ClinicalRecord", title: "Cardiology consultation", authoredAt: "2026-09-27T09:30:00Z", authorUserId: "USR-0182", sensitivity: "RESTRICTED", body: { summary: "Blood pressure improving on current therapy.", diagnosis: ["Essential hypertension"], plan: "Continue medication and review in six weeks." } },
  { recordId: "LAB-4419", patientId: "P014", resource: "Observation", title: "Metabolic panel", authoredAt: "2026-09-26T10:15:00Z", authorUserId: "USR-0219", sensitivity: "STANDARD", body: { code: "2345-7", display: "Glucose", valueQuantity: { value: 142, unit: "mg/dL" }, interpretation: "High" } },
  { recordId: "REC-7620", patientId: "P027", resource: "DiagnosticReport", title: "Discharge summary", authoredAt: "2026-09-25T15:30:00Z", authorUserId: "USR-0182", sensitivity: "RESTRICTED", body: { conclusion: "Stable after uncomplicated procedure.", followUp: "Surgical review in fourteen days." } },
];
await ClinicalRecord.insertMany(recordRows.map(({ body, ...record }) => ({ ...record, organizationId: "ORG-NORTHSTAR", encryptedPayload: encryptClinicalData(body, `${record.patientId}:${record.recordId}`), metadata: { protection: "AES-256-GCM" } })));

await Consent.insertMany([
  { consentId: "CON-7021", patientId: "P001", granteeOrganizationId: "ORG-NORTHSTAR", resources: ["ClinicalRecord", "Observation", "DiagnosticReport"], purposes: ["treatment", "care-coordination"], status: "ACTIVE", startsAt: "2026-08-14T00:00:00Z", expiresAt: "2026-12-14T00:00:00Z", createdByUserId: "USR-P001" },
  { consentId: "CON-6894", patientId: "P014", granteeOrganizationId: "ORG-NORTHSTAR", resources: ["Observation"], purposes: ["treatment"], status: "ACTIVE", startsAt: "2026-06-02T00:00:00Z", expiresAt: "2026-10-15T00:00:00Z", createdByUserId: "USR-ADMIN" },
  { consentId: "CON-5840", patientId: "P038", granteeOrganizationId: "ORG-NORTHSTAR", resources: ["DiagnosticReport"], purposes: ["treatment"], status: "REVOKED", startsAt: "2026-02-21T00:00:00Z", expiresAt: "2026-12-21T00:00:00Z", revokedAt: "2026-08-21T00:00:00Z", revokedByUserId: "USR-P001", createdByUserId: "USR-ADMIN" },
]);

await appendAuditEvent({ requestId: "REQ-SEED001", actor: { userId: "SYSTEM", role: "SYSTEM", name: "SecureHealth Seeder" }, patientId: null, organizationId: "ORG-NORTHSTAR", resource: "System", action: "SEED", decision: "INFO", reason: "Synthetic academic demonstration data initialized", severity: "INFO", context: { environment: config.environment } });
await disconnectDatabase();
console.log("SecureHealth synthetic data seeded. Demo password: SecureHealth!2026");
