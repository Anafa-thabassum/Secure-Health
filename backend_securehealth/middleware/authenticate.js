import { User } from "../models/User.js";
import { AppError } from "../utils/errors.js";
import { verifyAccessToken } from "../services/tokenService.js";

export const authenticate = async (req, _res, next) => {
  try {
    const [scheme, token] = (req.headers.authorization || "").split(" ");
    if (scheme !== "Bearer" || !token) throw new AppError(401, "INVALID_TOKEN", "A valid bearer token is required");
    let payload;
    try { payload = verifyAccessToken(token); } catch { throw new AppError(401, "INVALID_TOKEN", "Access token is invalid or expired"); }
    const user = await User.findOne({ userId: payload.sub }).lean();
    if (!user || user.status !== "ACTIVE") throw new AppError(401, "INVALID_TOKEN", "Token subject is unavailable");
    req.user = user;
    next();
  } catch (error) { next(error); }
};

export const authorizeRoles = (...roles) => (req, _res, next) => roles.includes(req.user?.role) ? next() : next(new AppError(403, "ROLE_DENIED", "Your role does not permit this action"));
