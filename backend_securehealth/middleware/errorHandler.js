import { AppError } from "../utils/errors.js";

export const notFoundHandler = (req, _res, next) => next(new AppError(404, "ROUTE_NOT_FOUND", `Route ${req.method} ${req.originalUrl} was not found`));

export const errorHandler = (error, req, res, _next) => {
  const status = error.status || (error.name === "ValidationError" ? 400 : error.code === 11000 ? 409 : 500);
  const code = error.code === 11000 ? "DUPLICATE_RESOURCE" : error.code || "INTERNAL_ERROR";
  if (status >= 500) console.error(`[${req.requestId || "no-request-id"}]`, error);
  res.status(status).json({ error: { code, message: status >= 500 ? "The service could not complete the request" : error.message, details: error.details, requestId: req.requestId } });
};
