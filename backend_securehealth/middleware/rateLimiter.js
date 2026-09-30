import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { securityConfig } from "../config/security.js";
import { getRedis } from "../config/redis.js";

const response = { error: { code: "RATE_LIMITED", message: "Too many requests. Try again shortly." } };
const createLimiter = (options, prefix) => {
  const client = getRedis();
  return rateLimit({ ...options, standardHeaders: true, legacyHeaders: false, message: response,
    ...(client?.isReady ? { store: new RedisStore({ prefix: `rl:${prefix}:`, sendCommand: (...args) => client.sendCommand(args) }) } : {}),
  });
};
export const apiRateLimiter = createLimiter(securityConfig.rateLimit, "api");
export const authRateLimiter = createLimiter(securityConfig.authRateLimit, "auth");
export const fhirRateLimiter = createLimiter(securityConfig.fhirRateLimit, "fhir");
export const searchRateLimiter = createLimiter(securityConfig.searchRateLimit, "search");
export const bulkRateLimiter = createLimiter(securityConfig.bulkRateLimit, "bulk");
