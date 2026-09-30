import test from "node:test";
import assert from "node:assert/strict";
import { calculateAuditHash, GENESIS_HASH } from "../../utils/hash.js";
import { verifyAuditEvents, verifyCheckpoints } from "../../services/auditIntegrityService.js";
import { signCheckpointHash } from "../../services/checkpointService.js";

const makeChain = () => {
  let previousHash = GENESIS_HASH;
  return [1, 2, 3].map((chainPosition) => {
    const immutable = { eventId: `AUD-${chainPosition}`, requestId: `REQ-${chainPosition}`, chainPosition, timestamp: new Date(`2026-09-27T00:00:0${chainPosition}Z`), actor: { userId: "U1" }, patientId: "P1", organizationId: "O1", resource: "ClinicalRecord", action: "READ", purpose: "treatment", decision: "ALLOW", reason: "Policy satisfied", severity: "INFO", context: {} };
    const event = { ...immutable, previousHash, currentHash: calculateAuditHash(immutable, previousHash) };
    previousHash = event.currentHash;
    return event;
  });
};

test("audit verification detects modified events", () => { const rows = makeChain(); rows[1].reason = "changed"; assert.equal(verifyAuditEvents(rows).valid, false); });
test("audit verification detects deleted events", () => { const rows = makeChain(); rows.splice(1, 1); assert.equal(verifyAuditEvents(rows).status, "CHAIN_POSITION_INVALID"); });
test("audit verification detects reordered events", () => { const rows = makeChain(); [rows[0], rows[1]] = [rows[1], rows[0]]; assert.equal(verifyAuditEvents(rows).valid, false); });
test("audit verification detects inserted events", () => { const rows = makeChain(); rows.splice(1, 0, { ...rows[0], eventId: "FORGED" }); assert.equal(verifyAuditEvents(rows).valid, false); });
test("checkpoints are cryptographically bound to exact events", () => {
  const rows = makeChain(); const checkpoint = { checkpointId: "CHK-1", chainPosition: 1, eventId: "WRONG", hash: rows[0].currentHash, ...signCheckpointHash(rows[0].currentHash) };
  assert.equal(verifyCheckpoints(rows, [checkpoint]).status, "CHECKPOINT_EVENT_MISMATCH");
});

