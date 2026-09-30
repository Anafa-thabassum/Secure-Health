import test from "node:test";
import assert from "node:assert/strict";
import { evaluateAttributes } from "../../services/abacService.js";

const patient = { patientId: "P1", organizationId: "ORG-A", careTeamUserIds: ["DOC-1"] };
const doctor = { userId: "DOC-1", role: "DOCTOR", organizationId: "ORG-A" };

test("ABAC rejects cross-organization clinical access", () => assert.equal(evaluateAttributes({ subject: { ...doctor, organizationId: "ORG-B" }, patient, resource: "ClinicalRecord", purpose: "treatment" }).checks.organization.passed, false));
test("ABAC rejects missing patient relationships", () => assert.equal(evaluateAttributes({ subject: { ...doctor, userId: "DOC-2" }, patient, resource: "ClinicalRecord", purpose: "treatment" }).checks.relationship.passed, false));
test("ABAC sensitivity blocks non-doctors from highly restricted data", () => assert.equal(evaluateAttributes({ subject: { ...doctor, role: "NURSE" }, patient, resource: "ClinicalRecord", sensitivity: "HIGHLY_RESTRICTED", purpose: "treatment" }).checks.sensitivity.passed, false));
test("emergency context overrides relationship, sensitivity, and hours but not identity/RBAC", () => {
  const result = evaluateAttributes({ subject: { ...doctor, userId: "DOC-2" }, patient, resource: "ClinicalRecord", sensitivity: "HIGHLY_RESTRICTED", purpose: "emergency", now: new Date("2026-09-27T02:00:00"), emergency: true });
  assert.equal(result.checks.relationship.passed, true);
  assert.equal(result.checks.context.passed, true);
});

