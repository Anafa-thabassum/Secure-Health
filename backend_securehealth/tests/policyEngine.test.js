import test from "node:test";
import assert from "node:assert/strict";
import { evaluatePolicy } from "../services/policyEngine.js";

const patient = { patientId: "P001", organizationId: "ORG-A", careTeamUserIds: ["USR-DOC"] };
const doctor = { userId: "USR-DOC", role: "DOCTOR", organizationId: "ORG-A", status: "ACTIVE", careRelationships: ["P001"] };
const consent = { patientId: "P001", granteeOrganizationId: "ORG-A", granteeUserId: null, resources: ["ClinicalRecord"], purposes: ["treatment"], status: "ACTIVE", startsAt: new Date(Date.now() - 1000), expiresAt: new Date(Date.now() + 60_000) };

test("allows access only when every zero-trust layer passes", () => {
  const result = evaluatePolicy({ subject: doctor, patient, resource: "ClinicalRecord", action: "read", purpose: "treatment", consent });
  assert.equal(result.decision, "ALLOW");
  assert.equal(result.layers.every((item) => item.status === "PASSED"), true);
});

test("explains organization and consent failures", () => {
  const result = evaluatePolicy({ subject: { ...doctor, organizationId: "ORG-B" }, patient, resource: "ClinicalRecord", action: "read", purpose: "treatment", consent: null });
  assert.equal(result.decision, "DENY");
  assert.match(result.reasons.join(" "), /Organization mismatch/);
  assert.match(result.reasons.join(" "), /No active consent/);
});

test("permits an active, resource-scoped break-glass session", () => {
  const result = evaluatePolicy({ subject: doctor, patient, resource: "ClinicalRecord", action: "read", purpose: "emergency", consent: null, breakGlass: { status: "ACTIVE", patientId: "P001", resource: "ClinicalRecord", expiresAt: new Date(Date.now() + 60_000) } });
  assert.equal(result.decision, "ALLOW");
  assert.equal(result.emergency, true);
});

