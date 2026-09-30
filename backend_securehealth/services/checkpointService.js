import crypto from "node:crypto";
import { createAuditCheckpointModel } from "../models/AuditCheckpoint.js";
import { getCheckpointConnection } from "../config/checkpointDatabase.js";
import { getAuditSigningKeys, publicKeyFingerprint } from "./keyService.js";

const model = () => createAuditCheckpointModel(getCheckpointConnection() || undefined);

export const signCheckpointHash = (hash) => {
  const keys = getAuditSigningKeys();
  return {
    signature: crypto.sign(null, Buffer.from(hash), keys.privateKey).toString("base64"),
    publicKeyFingerprint: publicKeyFingerprint(keys.publicKey),
  };
};

export const verifyCheckpointSignature = (hash, signature) => {
  try {
    return crypto.verify(null, Buffer.from(hash), getAuditSigningKeys().publicKey, Buffer.from(signature, "base64"));
  } catch {
    return false;
  }
};

export const createCheckpoint = async ({ chainPosition, eventId, hash, timestamp }) => model().create({
  checkpointId: `CHK-${String(chainPosition).padStart(8, "0")}`,
  chainPosition,
  eventId,
  hash,
  ...signCheckpointHash(hash),
  timestamp,
});

export const listCheckpoints = async () => model().find().sort({ chainPosition: 1 }).lean();

