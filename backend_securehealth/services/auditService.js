import crypto from "node:crypto";
import { AuditCheckpoint } from "../models/AuditCheckpoint.js";
import { AuditEvent } from "../models/AuditEvent.js";
import { getConfig } from "../config/env.js";
import { ids } from "../utils/ids.js";

const GENESIS = "0".repeat(64);
let developmentKeys;

const canonical = (value) => {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object" && !(value instanceof Date)) return Object.keys(value).sort().reduce((out, key) => ({ ...out, [key]: canonical(value[key]) }), {});
  return value instanceof Date ? value.toISOString() : value;
};

export const calculateAuditHash = (event, previousHash) => crypto.createHash("sha256").update(JSON.stringify(canonical({ ...event, previousHash }))).digest("hex");

const signingKeys = () => {
  const config = getConfig();
  if (config.audit.privateKeyBase64 && config.audit.publicKeyBase64) {
    return {
      privateKey: crypto.createPrivateKey(Buffer.from(config.audit.privateKeyBase64, "base64").toString("utf8")),
      publicKey: crypto.createPublicKey(Buffer.from(config.audit.publicKeyBase64, "base64").toString("utf8")),
    };
  }
  if (config.production) throw new Error("Audit signing keys are not configured");
  developmentKeys ||= crypto.generateKeyPairSync("ed25519");
  return developmentKeys;
};

const fingerprint = (key) => crypto.createHash("sha256").update(key.export({ type: "spki", format: "der" })).digest("hex");

export const signCheckpointHash = (hash) => {
  const keys = signingKeys();
  return {
    signature: crypto.sign(null, Buffer.from(hash), keys.privateKey).toString("base64"),
    publicKeyFingerprint: fingerprint(keys.publicKey),
  };
};

export const verifyCheckpointSignature = (hash, signature) => crypto.verify(null, Buffer.from(hash), signingKeys().publicKey, Buffer.from(signature, "base64"));

export const appendAuditEvent = async (input) => {
  const previous = await AuditEvent.findOne().sort({ chainPosition: -1 }).lean();
  const chainPosition = (previous?.chainPosition || 0) + 1;
  const timestamp = input.timestamp || new Date();
  const eventId = input.eventId || ids.event();
  const immutable = { ...input, eventId, chainPosition, timestamp };
  const previousHash = previous?.currentHash || GENESIS;
  const currentHash = calculateAuditHash(immutable, previousHash);
  const event = await AuditEvent.create({ ...immutable, previousHash, currentHash });

  const interval = getConfig().audit.checkpointInterval;
  if (chainPosition === 1 || chainPosition % interval === 0) {
    const signed = signCheckpointHash(currentHash);
    await AuditCheckpoint.create({ checkpointId: `CHK-${String(chainPosition).padStart(8, "0")}`, chainPosition, eventId, hash: currentHash, ...signed, timestamp });
  }
  return event.toJSON();
};

export const verifyAuditChain = async () => {
  const events = await AuditEvent.find().sort({ chainPosition: 1 }).lean();
  let previousHash = GENESIS;
  for (const event of events) {
    const { _id, __v, previousHash: storedPrevious, currentHash, ...immutable } = event;
    const expected = calculateAuditHash(immutable, previousHash);
    if (storedPrevious !== previousHash || currentHash !== expected) {
      return { valid: false, status: "INTEGRITY_COMPROMISED", chainPosition: event.chainPosition, eventId: event.eventId, expectedHash: expected, actualHash: currentHash, checkpointVerified: false };
    }
    previousHash = currentHash;
  }
  const checkpoints = await AuditCheckpoint.find().sort({ chainPosition: 1 }).lean();
  const failedCheckpoint = checkpoints.find((item) => !verifyCheckpointSignature(item.hash, item.signature));
  if (failedCheckpoint) return { valid: false, status: "CHECKPOINT_FAILED", chainPosition: failedCheckpoint.chainPosition, checkpointVerified: false };
  return { valid: true, status: "CHAIN_VALID", eventsVerified: events.length, chainPosition: events.at(-1)?.chainPosition || 0, currentHash: previousHash, checkpointsVerified: checkpoints.length, checkpointVerified: true };
};

