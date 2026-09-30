import crypto from "node:crypto";
import { AuditEvent } from "../models/AuditEvent.js";
import { getRedis } from "../config/redis.js";
import { getConfig } from "../config/env.js";
import { calculateAuditHash, GENESIS_HASH } from "../utils/hash.js";
import { ids } from "../utils/ids.js";
import { createCheckpoint, signCheckpointHash, verifyCheckpointSignature } from "./checkpointService.js";
import { verifyAuditChain } from "./auditIntegrityService.js";

let localQueue = Promise.resolve();

const withLocalLock = async (work) => {
  const previous = localQueue;
  let release;
  localQueue = new Promise((resolve) => { release = resolve; });
  await previous;
  try { return await work(); } finally { release(); }
};

const withAuditLock = async (work) => {
  const redis = getRedis();
  if (!redis?.isReady) return withLocalLock(work);
  const key = "securehealth:audit:append-lock";
  const token = crypto.randomUUID();
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline) {
    if (await redis.set(key, token, { NX: true, PX: 10_000 })) {
      try { return await work(); } finally {
        await redis.eval("if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end", { keys: [key], arguments: [token] }).catch(() => {});
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error("Audit append lock could not be acquired");
};

export const appendAuditEvent = async (input) => withAuditLock(async () => {
  const previous = await AuditEvent.findOne().sort({ chainPosition: -1 }).lean();
  const chainPosition = (previous?.chainPosition || 0) + 1;
  const timestamp = input.timestamp || new Date();
  const eventId = input.eventId || ids.event();
  const immutable = { ...input, eventId, chainPosition, timestamp };
  const previousHash = previous?.currentHash || GENESIS_HASH;
  const currentHash = calculateAuditHash(immutable, previousHash);
  const event = await AuditEvent.create({ ...immutable, previousHash, currentHash });

  const interval = getConfig().audit.checkpointInterval;
  if (chainPosition === 1 || chainPosition % interval === 0) {
    await createCheckpoint({ chainPosition, eventId, hash: currentHash, timestamp });
  }
  return event.toJSON();
});

export { calculateAuditHash, signCheckpointHash, verifyAuditChain, verifyCheckpointSignature };
