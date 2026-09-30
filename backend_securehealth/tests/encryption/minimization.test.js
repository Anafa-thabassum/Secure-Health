import test from "node:test";
import assert from "node:assert/strict";
import { encryptClinicalData } from "../../services/encryptionService.js";
import { minimizeClinicalData } from "../../services/dataMinimizationService.js";

test("AES-GCM uses a unique IV for every encryption", () => assert.notEqual(encryptClinicalData({ x: 1 }).iv, encryptClinicalData({ x: 1 }).iv));
test("minimum-necessary filtering removes fields outside role scope", () => {
  const result = minimizeClinicalData({ role: "NURSE", resource: "ClinicalRecord", data: { summary: "ok", diagnosis: "restricted", plan: "continue" } });
  assert.deepEqual(result, { summary: "ok", plan: "continue" });
});

