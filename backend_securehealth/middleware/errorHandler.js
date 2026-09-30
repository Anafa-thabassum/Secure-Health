import { AppError } from "../utils/errors.js";

export const notFoundHandler = (req, _res, next) => next(new AppError(404, "ROUTE_NOT_FOUND", `Route ${req.method} ${req.originalUrl} was not found`));

export const errorHandler = (error, req, res, _next) => {
  if (res.headersSent) return;
  const dependencyFailure = ["MongoServerSelectionError", "MongoNetworkError", "PoolClearedError", "SocketClosedUnexpectedlyError"].includes(error.name);
  const status = error.type === "entity.too.large" ? 413 : error.status || (error.name === "ValidationError" ? 400 : error.code === 11000 ? 409 : dependencyFailure ? 503 : 500);
  const code = error.type === "entity.too.large" ? "PAYLOAD_TOO_LARGE" : error.code === 11000 ? "DUPLICATE_RESOURCE" : dependencyFailure ? "SERVICE_UNAVAILABLE" : error.code || "INTERNAL_ERROR";
  if (status >= 500) console.error(`[${req.requestId || "no-request-id"}]`, error);
  res.status(status).json({ error: { code, message: status >= 500 ? "The service could not complete the request" : error.message, ...(error.details ? { details: error.details } : {}), requestId: req.requestId } });
};
