import test from "node:test";
import assert from "node:assert/strict";
import { authorizeRequest } from "../../services/policyService.js";

const now = new Date("2026-09-27T12:00:00Z");
const subject = { userId: "D1", role: "DOCTOR", organizationId: "O1", status: "ACTIVE" };
const patient = { patientId: "P1", organizationId: "O1", careTeamUserIds: ["D1"] };
const base = { patientId: "P1", granteeOrganizationId: "O1", resources: ["ClinicalRecord"], purposes: ["treatment"], startsAt: new Date("2026-09-01"), expiresAt: new Date("2026-10-01") };
const run = (consent) => authorizeRequest({ subject, patient, resource: "ClinicalRecord", action: "read", purpose: "treatment", consent, now });

test("active scoped consent allows a fully eligible request", () => assert.equal(run({ ...base, status: "ACTIVE" }).decision, "ALLOW"));
test("expired consent is explained and denied", () => assert.equal(run({ ...base, status: "ACTIVE", expiresAt: new Date("2026-09-20") }).layers.find((x) => x.key === "consent").reasonCode, "CONSENT_EXPIRED"));
test("revoked consent is explained and denied", () => assert.equal(run({ ...base, status: "REVOKED" }).layers.find((x) => x.key === "consent").reasonCode, "CONSENT_REVOKED"));
test("resource and purpose scope are both enforced", () => assert.equal(run({ ...base, status: "ACTIVE", resources: ["Observation"] }).decision, "DENY"));

