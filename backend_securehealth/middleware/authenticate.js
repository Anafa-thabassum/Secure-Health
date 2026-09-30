import { User } from "../models/User.js";
import { AppError } from "../utils/errors.js";
import { verifyAccessToken } from "../services/tokenService.js";
import { isAccessTokenRevoked } from "../services/sessionService.js";
import { normalizeRole } from "../services/rbacService.js";
import { bearerToken } from "../utils/token.js";

export const authenticate = async (req, _res, next) => {
  try {
    const token = bearerToken(req.headers.authorization);
    if (!token) throw new AppError(401, "INVALID_TOKEN", "A valid bearer token is required");
    let payload;
    try { payload = verifyAccessToken(token); } catch { throw new AppError(401, "INVALID_TOKEN", "Access token is invalid or expired"); }
    if (await isAccessTokenRevoked(payload)) throw new AppError(401, "INVALID_TOKEN", "Access token has been revoked");
    const user = await User.findOne({ userId: payload.sub });
    if (!user || user.status !== "ACTIVE") throw new AppError(401, "INVALID_TOKEN", "Token subject is unavailable");
    if (payload.sv !== (user.sessionVersion || 1)) throw new AppError(401, "INVALID_TOKEN", "Session generation is no longer valid");
    if (user.passwordChangedAt && payload.iat * 1000 < user.passwordChangedAt.getTime() - 1_000) throw new AppError(401, "INVALID_TOKEN", "Access token predates the latest password change");
    req.user = user;
    req.auth = { token, payload };
    next();
  } catch (error) { next(error); }
};

export const authorizeRoles = (...roles) => (req, _res, next) => roles.map(normalizeRole).includes(normalizeRole(req.user?.role)) ? next() : next(new AppError(403, "ROLE_DENIED", "Your role does not permit this action"));
