import test from "node:test";
import assert from "node:assert/strict";
import { authorizeRequest } from "../../services/policyService.js";

const subject = { userId: "D1", role: "DOCTOR", organizationId: "O1", status: "ACTIVE" };
const patient = { patientId: "P1", organizationId: "O1", careTeamUserIds: [] };
const run = (breakGlass) => authorizeRequest({ subject, patient, resource: "ClinicalRecord", action: "read", purpose: "emergency", breakGlass, now: new Date("2026-09-27T12:00:00Z") });
test("active exact-scope break-glass authorization is allowed", () => assert.equal(run({ status: "ACTIVE", patientId: "P1", resource: "ClinicalRecord", expiresAt: new Date("2026-09-27T12:05:00Z") }).reasonCode, "BREAK_GLASS_GRANTED"));
test("expired break-glass authorization cannot bypass consent", () => assert.equal(run({ status: "ACTIVE", patientId: "P1", resource: "ClinicalRecord", expiresAt: new Date("2026-09-27T11:59:00Z") }).decision, "DENY"));
test("break-glass authorization cannot cross patient scope", () => assert.equal(run({ status: "ACTIVE", patientId: "P2", resource: "ClinicalRecord", expiresAt: new Date("2026-09-27T12:05:00Z") }).decision, "DENY"));

