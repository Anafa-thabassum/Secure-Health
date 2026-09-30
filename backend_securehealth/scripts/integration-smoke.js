import assert from "node:assert/strict";

process.env.MONGODB_URI ||= "mongodb://127.0.0.1:27019/securehealth_smoke";
process.env.CHECKPOINT_MONGODB_URI ||= "mongodb://127.0.0.1:27019/securehealth_checkpoints_smoke";
process.env.AUDIT_CHECKPOINT_INTERVAL = "1";

const [{ connectDatabase, disconnectDatabase }, { connectCheckpointDatabase, disconnectCheckpointDatabase }, { User }, { Patient }, { Consent }, { ClinicalRecord }, { AuditEvent }, { RevokedAccessToken }, { appendAuditEvent }, { verifyAuditChain }, { encryptClinicalData, decryptClinicalData }, { createAccessToken, verifyAccessToken }, { revokeAccessToken, isAccessTokenRevoked }] = await Promise.all([
  import("../config/database.js"), import("../config/checkpointDatabase.js"), import("../models/User.js"), import("../models/Patient.js"), import("../models/Consent.js"), import("../models/ClinicalRecord.js"), import("../models/AuditEvent.js"), import("../models/RevokedAccessToken.js"), import("../services/auditService.js"), import("../services/auditIntegrityService.js"), import("../services/encryptionService.js"), import("../services/tokenService.js"), import("../services/sessionService.js"),
]);

await connectDatabase(process.env.MONGODB_URI);
await connectCheckpointDatabase(process.env.CHECKPOINT_MONGODB_URI);
try {
  await Promise.all([User.deleteMany({}), Patient.deleteMany({}), Consent.deleteMany({}), ClinicalRecord.deleteMany({}), AuditEvent.deleteMany({}), RevokedAccessToken.deleteMany({})]);
  const user = await User.create({ userId: "SMOKE-DOC", email: "smoke@example.invalid", passwordHash: "not-a-real-credential", name: "Smoke Doctor", role: "DOCTOR", organizationId: "SMOKE-ORG", careRelationships: ["SMOKE-PATIENT"], status: "ACTIVE", emailVerifiedAt: new Date(), sessionVersion: 1 });
  await Patient.create({ patientId: "SMOKE-PATIENT", organizationId: "SMOKE-ORG", name: "Synthetic Patient", dateOfBirth: new Date("1990-01-01"), mrn: "SMOKE-MRN", careTeamUserIds: [user.userId] });
  await Consent.create({ consentId: "SMOKE-CONSENT", patientId: "SMOKE-PATIENT", granteeOrganizationId: "SMOKE-ORG", resources: ["ClinicalRecord"], purposes: ["treatment"], status: "ACTIVE", startsAt: new Date(Date.now() - 1_000), expiresAt: new Date(Date.now() + 60_000), createdByUserId: "SMOKE-PATIENT" });
  const envelope = encryptClinicalData({ summary: "Synthetic smoke record" }, "SMOKE-PATIENT:SMOKE-RECORD");
  await ClinicalRecord.create({ recordId: "SMOKE-RECORD", patientId: "SMOKE-PATIENT", organizationId: "SMOKE-ORG", resource: "ClinicalRecord", title: "Smoke record", authoredAt: new Date(), authorUserId: user.userId, encryptedPayload: envelope });
  assert.equal(decryptClinicalData(envelope, "SMOKE-PATIENT:SMOKE-RECORD").summary, "Synthetic smoke record");
  await appendAuditEvent({ requestId: "SMOKE-REQ-1", actor: user.toJSON(), patientId: "SMOKE-PATIENT", organizationId: "SMOKE-ORG", resource: "ClinicalRecord", action: "READ", purpose: "treatment", decision: "ALLOW", reason: "Smoke policy passed", severity: "INFO", context: {} });
  await appendAuditEvent({ requestId: "SMOKE-REQ-2", actor: user.toJSON(), patientId: "SMOKE-PATIENT", organizationId: "SMOKE-ORG", resource: "ClinicalRecord", action: "READ", purpose: "treatment", decision: "DENY", reason: "Synthetic denial", severity: "HIGH", context: {} });
  const integrity = await verifyAuditChain();
  assert.equal(integrity.valid, true);
  assert.equal(integrity.checkpointsVerified, 2);
  const accessToken = createAccessToken(user);
  const payload = verifyAccessToken(accessToken);
  await revokeAccessToken(payload, "INTEGRATION_SMOKE");
  assert.equal(await isAccessTokenRevoked(payload), true);
  console.log(JSON.stringify({ database: "connected", checkpointDatabase: "connected", encryptedRecord: "verified", auditEvents: integrity.eventsVerified, checkpoints: integrity.checkpointsVerified, tokenRevocation: "verified" }));
} finally {
  await Promise.allSettled([disconnectCheckpointDatabase(), disconnectDatabase()]);
}

