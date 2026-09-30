import test from "node:test";
import assert from "node:assert/strict";
import { isRolePermitted, supportedRoles } from "../../services/rbacService.js";

test("all planned roles are represented", () => assert.deepEqual(supportedRoles, ["PATIENT", "DOCTOR", "NURSE", "LAB_TECHNICIAN", "ADMINISTRATOR", "AUDITOR"]));
test("clinical roles receive only explicit permissions", () => {
  assert.equal(isRolePermitted("DOCTOR", "ClinicalRecord", "read"), true);
  assert.equal(isRolePermitted("NURSE", "ClinicalRecord", "create"), false);
  assert.equal(isRolePermitted("LAB_TECHNICIAN", "MedicationRequest", "read"), false);
});
test("security administrators cannot read clinical records by role", () => assert.equal(isRolePermitted("ADMINISTRATOR", "ClinicalRecord", "read"), false));
test("unknown roles are denied by default", () => assert.equal(isRolePermitted("SUPERUSER", "AuditEvent", "read"), false));

