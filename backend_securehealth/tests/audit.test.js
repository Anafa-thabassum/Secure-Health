import test from "node:test";
import assert from "node:assert/strict";
import { calculateAuditHash, signCheckpointHash, verifyCheckpointSignature } from "../services/auditService.js";

test("audit hashes are deterministic and chain-sensitive", () => {
  const event = { eventId: "AUD-1", requestId: "REQ-1", chainPosition: 1, timestamp: new Date("2026-09-27T00:00:00Z"), actor: { userId: "USR-1" }, resource: "ClinicalRecord", action: "READ", decision: "ALLOW", reason: "Policy satisfied", severity: "INFO", context: {} };
  const first = calculateAuditHash(event, "0".repeat(64));
  assert.equal(first, calculateAuditHash(event, "0".repeat(64)));
  assert.notEqual(first, calculateAuditHash({ ...event, reason: "Modified" }, "0".repeat(64)));
});

test("checkpoint signatures verify and reject modified hashes", () => {
  const hash = "a".repeat(64);
  const { signature } = signCheckpointHash(hash);
  assert.equal(verifyCheckpointSignature(hash, signature), true);
  assert.equal(verifyCheckpointSignature("b".repeat(64), signature), false);
});

