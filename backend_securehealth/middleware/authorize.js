import { AppError } from "../utils/errors.js";
import { isRolePermitted } from "../services/rbacService.js";

export const authorize = (resource, action) => (req, _res, next) => isRolePermitted(req.user?.role, resource, action)
  ? next()
  : next(new AppError(403, "ROLE_DENIED", `Your role does not permit ${action} on ${resource}`));

