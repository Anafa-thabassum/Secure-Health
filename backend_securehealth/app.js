import express from "express";
import cors from "cors";
import helmet from "helmet";
import { getConfig } from "./config/env.js";
import { securityConfig } from "./config/security.js";
import { apiRateLimiter } from "./middleware/rateLimiter.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { databaseHealth } from "./config/database.js";
import { redisHealth } from "./config/redis.js";
import { ids } from "./utils/ids.js";
import authRoutes from "./routes/authRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import consentRoutes from "./routes/consentRoutes.js";
import accessRoutes from "./routes/accessRoutes.js";
import securityRoutes from "./routes/securityRoutes.js";
import auditRoutes from "./routes/auditRoutes.js";
import integrityRoutes from "./routes/integrityRoutes.js";
import breakGlassRoutes from "./routes/breakGlassRoutes.js";
import sentinelRoutes from "./routes/sentinelRoutes.js";
import fhirRoutes from "./routes/fhirRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

export const createApp = () => {
  const config = getConfig();
  const app = express();
  if (config.trustProxy) app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use(helmet({ crossOriginResourcePolicy: { policy: "same-site" } }));
  app.use(cors({ credentials: true, origin(origin, callback) { if (!origin || config.corsOrigins.includes(origin)) return callback(null, true); return callback(null, false); } }));
  app.use(express.json({ limit: securityConfig.maxPayloadSize }));
  app.use(express.urlencoded({ extended: false, limit: securityConfig.maxPayloadSize }));
  app.use((req, res, next) => { req.requestId = req.get("x-request-id") || ids.request(); res.set("x-request-id", req.requestId); next(); });
  app.use(apiRateLimiter);

  app.get("/health", (_req, res) => res.json({ status: "ok", service: "SecureHealth API", version: "1.0.0", timestamp: new Date().toISOString() }));
  app.get("/ready", (_req, res) => {
    const database = databaseHealth(); const redis = redisHealth(); const ready = database.connected && redis.connected;
    res.status(ready ? 200 : 503).json({ status: ready ? "ready" : "degraded", dependencies: { database, redis } });
  });

  app.use(`${config.apiPrefix}/auth`, authRoutes);
  app.use(`${config.apiPrefix}/patients`, patientRoutes);
  app.use(`${config.apiPrefix}/consents`, consentRoutes);
  app.use(`${config.apiPrefix}/access`, accessRoutes);
  app.use(`${config.apiPrefix}/security`, securityRoutes);
  app.use(`${config.apiPrefix}/audit`, auditRoutes);
  app.use(`${config.apiPrefix}/integrity`, integrityRoutes);
  app.use(`${config.apiPrefix}/break-glass`, breakGlassRoutes);
  app.use(`${config.apiPrefix}/sentinel`, sentinelRoutes);
  app.use(`${config.apiPrefix}/fhir`, fhirRoutes);
  app.use(`${config.apiPrefix}/admin`, adminRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};

