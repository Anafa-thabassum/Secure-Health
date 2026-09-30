import { rateLimit } from "express-rate-limit";
import { securityConfig } from "../config/security.js";

const response = { error: { code: "RATE_LIMITED", message: "Too many requests. Try again shortly." } };
export const apiRateLimiter = rateLimit({ ...securityConfig.rateLimit, standardHeaders: true, legacyHeaders: false, message: response });
export const authRateLimiter = rateLimit({ ...securityConfig.authRateLimit, standardHeaders: true, legacyHeaders: false, message: response });
