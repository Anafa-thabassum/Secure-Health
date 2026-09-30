import { getConfig } from "../config/env.js";
import { getRedis } from "../config/redis.js";
import { RefreshSession } from "../models/RefreshSession.js";
import { RevokedAccessToken } from "../models/RevokedAccessToken.js";
import { decodeExpiry, hashToken, verifyRefreshToken } from "./tokenService.js";

const revocationKey = (jti) => `auth:revoked:${jti}`;

export const enforceSessionLimit = async (userId) => {
  const max = getConfig().maxConcurrentSessions;
  const active = await RefreshSession.find({ userId, revokedAt: null, expiresAt: { $gt: new Date() } }).sort({ createdAt: 1 });
  const excess = Math.max(0, active.length - max + 1);
  if (excess) await RefreshSession.updateMany({ _id: { $in: active.slice(0, excess).map((row) => row._id) } }, { $set: { revokedAt: new Date() } });
};

export const createRefreshSession = async ({ sessionId, userId, refreshToken, context }) => {
  await enforceSessionLimit(userId);
  return RefreshSession.create({ sessionId, userId, tokenHash: hashToken(refreshToken), expiresAt: decodeExpiry(refreshToken), ip: context.ip, userAgent: context.userAgent });
};

export const revokeRefreshToken = async (refreshToken) => {
  if (!refreshToken) return null;
  try {
    const payload = verifyRefreshToken(refreshToken);
    await RefreshSession.updateOne({ sessionId: payload.sid, userId: payload.sub }, { $set: { revokedAt: new Date() } });
    return payload;
  } catch { return null; }
};

export const revokeAllRefreshSessions = async (userId) => RefreshSession.updateMany({ userId, revokedAt: null }, { $set: { revokedAt: new Date() } });

export const listSessions = async (userId) => RefreshSession.find({ userId, expiresAt: { $gt: new Date() } }).select("-tokenHash").sort({ createdAt: -1 }).lean();

export const revokeSession = async (userId, sessionId) => RefreshSession.findOneAndUpdate({ userId, sessionId }, { $set: { revokedAt: new Date() } }, { new: true }).select("-tokenHash").lean();

export const revokeAccessToken = async (payload, reason = "LOGOUT") => {
  if (!payload?.jti || !payload?.exp) return;
  const expiresAt = new Date(payload.exp * 1000);
  const ttl = Math.max(1, payload.exp - Math.floor(Date.now() / 1000));
  const redis = getRedis();
  if (redis?.isReady) await redis.set(revocationKey(payload.jti), reason, { EX: ttl }).catch(() => {});
  await RevokedAccessToken.updateOne({ tokenId: payload.jti }, { $setOnInsert: { userId: payload.sub, expiresAt, reason } }, { upsert: true });
};

export const isAccessTokenRevoked = async (payload) => {
  if (!payload?.jti) return true;
  const redis = getRedis();
  if (redis?.isReady && await redis.exists(revocationKey(payload.jti))) return true;
  return Boolean(await RevokedAccessToken.exists({ tokenId: payload.jti, expiresAt: { $gt: new Date() } }));
};

