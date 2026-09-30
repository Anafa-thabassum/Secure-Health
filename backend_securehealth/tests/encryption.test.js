import test from "node:test";
import assert from "node:assert/strict";
import { encryptClinicalData, decryptClinicalData } from "../services/encryptionService.js";

test("AES-256-GCM round-trips protected clinical data", () => {
  const input = { diagnosis: "Synthetic finding", value: 42 };
  const encrypted = encryptClinicalData(input, "P001:REC-1");
  assert.equal(encrypted.algorithm, "aes-256-gcm");
  assert.notEqual(encrypted.ciphertext, JSON.stringify(input));
  assert.deepEqual(decryptClinicalData(encrypted, "P001:REC-1"), input);
});

test("authentication tag failure rejects modified ciphertext", () => {
  const encrypted = encryptClinicalData({ value: "original" }, "P001:REC-1");
  encrypted.ciphertext = `${encrypted.ciphertext.slice(0, -4)}AAAA`;
  assert.throws(() => decryptClinicalData(encrypted, "P001:REC-1"), /could not be verified/);
});

