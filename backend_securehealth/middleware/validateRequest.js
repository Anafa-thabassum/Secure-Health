import { AppError } from "../utils/errors.js";

export const validate = (schema, source = "body") => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) return next(new AppError(400, "VALIDATION_ERROR", "Request validation failed", result.error.flatten()));
  req[source] = result.data;
  next();
};
