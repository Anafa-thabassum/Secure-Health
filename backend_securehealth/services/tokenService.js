import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { getConfig } from "../config/env.js";
import { ids } from "../utils/ids.js";

export const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

export const createAccessToken = (user) => {
  const { jwt: config } = getConfig();
  return jwt.sign({ role: user.role, organizationId: user.organizationId, patientId: user.patientId || undefined }, config.accessSecret, {
    subject: user.userId,
    issuer: config.issuer,
    audience: config.audience,
    expiresIn: config.accessTtl,
    jwtid: ids.session(),
  });
};

export const createRefreshToken = (user, sessionId) => {
  const { jwt: config } = getConfig();
  return jwt.sign({ type: "refresh", sid: sessionId }, config.refreshSecret, {
    subject: user.userId,
    issuer: config.issuer,
    audience: config.audience,
    expiresIn: config.refreshTtl,
    jwtid: ids.session(),
  });
};

export const verifyAccessToken = (token) => {
  const { jwt: config } = getConfig();
  return jwt.verify(token, config.accessSecret, { issuer: config.issuer, audience: config.audience });
};

export const verifyRefreshToken = (token) => {
  const { jwt: config } = getConfig();
  const payload = jwt.verify(token, config.refreshSecret, { issuer: config.issuer, audience: config.audience });
  if (payload.type !== "refresh" || !payload.sid) throw new Error("Invalid refresh token type");
  return payload;
};

export const decodeExpiry = (token) => new Date(jwt.decode(token).exp * 1000);

