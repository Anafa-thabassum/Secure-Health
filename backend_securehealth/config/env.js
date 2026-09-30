import crypto from "node:crypto";

const bool = (value, fallback = false) => value == null ? fallback : value === "true";
const int = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;

const developmentSecret = (label) => crypto.createHash("sha256").update(`securehealth-development-${label}`).digest("hex");

export const getConfig = () => {
  const production = process.env.NODE_ENV === "production";
  const required = ["MONGODB_URI", "CHECKPOINT_MONGODB_URI", "REDIS_URL", "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET", "ENCRYPTION_KEY_BASE64", "AUDIT_SIGNING_PRIVATE_KEY_BASE64", "AUDIT_SIGNING_PUBLIC_KEY_BASE64"];
  const missing = production ? required.filter((key) => !process.env[key]) : [];
  if (missing.length) throw new Error(`Missing required production configuration: ${missing.join(", ")}`);

  return {
    environment: process.env.NODE_ENV || "development",
    production,
    port: int(process.env.PORT, 12000),
    apiPrefix: process.env.API_PREFIX || "/api/v1",
    mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/securehealth",
    checkpointMongoUri: process.env.CHECKPOINT_MONGODB_URI || "",
    mongoTls: bool(process.env.MONGODB_TLS, production),
    redisUrl: process.env.REDIS_URL || "redis://127.0.0.1:6379",
    corsOrigins: (process.env.CORS_ORIGINS || "http://localhost:3000").split(",").map((value) => value.trim()).filter(Boolean),
    trustProxy: bool(process.env.TRUST_PROXY),
    requestTimeoutMs: int(process.env.REQUEST_TIMEOUT_MS, 10_000),
    maxConcurrentRequests: int(process.env.MAX_CONCURRENT_REQUESTS, 100),
    maxConcurrentSessions: int(process.env.MAX_CONCURRENT_SESSIONS, 5),
    jwt: {
      accessSecret: process.env.JWT_ACCESS_SECRET || developmentSecret("access-token"),
      refreshSecret: process.env.JWT_REFRESH_SECRET || developmentSecret("refresh-token"),
      accessTtl: process.env.JWT_ACCESS_TTL || "15m",
      refreshTtl: process.env.JWT_REFRESH_TTL || "7d",
      issuer: "securehealth-api",
      audience: "securehealth-client",
    },
    encryption: {
      keyBase64: process.env.ENCRYPTION_KEY_BASE64 || "",
      keyId: process.env.ENCRYPTION_KEY_ID || "securehealth-development-v1",
    },
    audit: {
      privateKeyBase64: process.env.AUDIT_SIGNING_PRIVATE_KEY_BASE64 || "",
      publicKeyBase64: process.env.AUDIT_SIGNING_PUBLIC_KEY_BASE64 || "",
      checkpointInterval: int(process.env.AUDIT_CHECKPOINT_INTERVAL, 100),
    },
    allowDemoTamper: bool(process.env.ALLOW_DEMO_TAMPER),
    email: {
      from: process.env.EMAIL_FROM || "security@securehealth.invalid",
      verificationTtlMinutes: int(process.env.EMAIL_VERIFICATION_TTL_MINUTES, 30),
    },
  };
};
