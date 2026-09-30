import { AuditEvent } from "../models/AuditEvent.js";
import { calculateAuditHash, GENESIS_HASH } from "../utils/hash.js";
import { listCheckpoints, verifyCheckpointSignature } from "./checkpointService.js";

export const verifyAuditEvents = (events) => {
  let previousHash = GENESIS_HASH;
  let expectedPosition = 1;
  for (const event of events) {
    const { _id, __v, previousHash: storedPrevious, currentHash, ...immutable } = event;
    if (event.chainPosition !== expectedPosition) {
      return { valid: false, status: "CHAIN_POSITION_INVALID", chainPosition: event.chainPosition, expectedPosition, checkpointVerified: false };
    }
    const expectedHash = calculateAuditHash(immutable, previousHash);
    if (storedPrevious !== previousHash || currentHash !== expectedHash) {
      return { valid: false, status: "INTEGRITY_COMPROMISED", chainPosition: event.chainPosition, eventId: event.eventId, expectedHash, actualHash: currentHash, checkpointVerified: false };
    }
    previousHash = currentHash;
    expectedPosition += 1;
  }
  return { valid: true, status: "CHAIN_VALID", eventsVerified: events.length, chainPosition: events.at(-1)?.chainPosition || 0, currentHash: previousHash };
};

export const verifyCheckpoints = (events, checkpoints) => {
  const byPosition = new Map(events.map((event) => [event.chainPosition, event]));
  for (const checkpoint of checkpoints) {
    const event = byPosition.get(checkpoint.chainPosition);
    const bound = event && event.eventId === checkpoint.eventId && event.currentHash === checkpoint.hash;
    const signatureValid = verifyCheckpointSignature(checkpoint.hash, checkpoint.signature);
    if (!bound || !signatureValid) {
      return { valid: false, status: bound ? "CHECKPOINT_SIGNATURE_INVALID" : "CHECKPOINT_EVENT_MISMATCH", chainPosition: checkpoint.chainPosition, checkpointId: checkpoint.checkpointId, checkpointVerified: false };
    }
  }
  return { valid: true, checkpointsVerified: checkpoints.length, checkpointVerified: true };
};

export const verifyAuditChain = async () => {
  const [events, checkpoints] = await Promise.all([
    AuditEvent.find().sort({ chainPosition: 1 }).lean(),
    listCheckpoints(),
  ]);
  const chain = verifyAuditEvents(events);
  if (!chain.valid) return chain;
  const checkpoint = verifyCheckpoints(events, checkpoints);
  if (!checkpoint.valid) return checkpoint;
  return { ...chain, ...checkpoint };
};

