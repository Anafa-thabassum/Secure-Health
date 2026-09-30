import test from "node:test";
import assert from "node:assert/strict";
import { authorizeRequest } from "../../services/policyService.js";

const patient = { patientId: "P1", organizationId: "O1", careTeamUserIds: ["L1"] };
const consent = { patientId: "P1", granteeOrganizationId: "O1", resources: ["Observation"], purposes: ["treatment"], status: "ACTIVE", startsAt: new Date(Date.now() - 1000), expiresAt: new Date(Date.now() + 10000) };
test("FHIR resource authorization permits scoped lab work", () => assert.equal(authorizeRequest({ subject: { userId: "L1", role: "LAB_TECHNICIAN", organizationId: "O1", status: "ACTIVE" }, patient, resource: "Observation", action: "read", purpose: "treatment", consent }).decision, "ALLOW"));
test("FHIR resource authorization denies unsupported resources", () => assert.equal(authorizeRequest({ subject: { userId: "L1", role: "LAB_TECHNICIAN", organizationId: "O1", status: "ACTIVE" }, patient, resource: "MedicationRequest", action: "read", purpose: "treatment", consent }).decision, "DENY"));

