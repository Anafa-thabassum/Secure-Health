import crypto from "node:crypto";
import fs from "node:fs";

const bool = (value, fallback = false) => value == null ? fallback : value === "true";
const int = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;

const developmentSecret = (label) => crypto.createHash("sha256").update(`securehealth-development-${label}`).digest("hex");

const readFcmServiceAccount = () => {
  const file = process.env.FCM_SERVICE_ACCOUNT_PATH;
  if (!file) return {};

  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    throw new Error("FCM_SERVICE_ACCOUNT_PATH must reference a readable Firebase service-account JSON file");
  }
};

export const getConfig = () => {
  const production = process.env.NODE_ENV === "production";
  const pushEnabled = bool(process.env.PUSH_ENABLED);
  const fcmServiceAccount = readFcmServiceAccount();
  const fcmProjectId = process.env.FCM_PROJECT_ID || fcmServiceAccount.project_id || "";
  const fcmClientEmail = process.env.FCM_CLIENT_EMAIL || fcmServiceAccount.client_email || "";
  const fcmPrivateKeyBase64 = process.env.FCM_PRIVATE_KEY_BASE64
    || (fcmServiceAccount.private_key ? Buffer.from(fcmServiceAccount.private_key).toString("base64") : "");
  const fcmConfigured = Boolean(fcmProjectId && fcmClientEmail && fcmPrivateKeyBase64);
  const apnsConfigured = Boolean(
    process.env.APNS_TEAM_ID
    && process.env.APNS_KEY_ID
    && process.env.APNS_BUNDLE_ID
    && process.env.APNS_PRIVATE_KEY_BASE64,
  );
  const required = ["MONGODB_URI", "CHECKPOINT_MONGODB_URI", "REDIS_URL", "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET", "ENCRYPTION_KEY_BASE64", "AUDIT_SIGNING_PRIVATE_KEY_BASE64", "AUDIT_SIGNING_PUBLIC_KEY_BASE64"];
  const missing = production ? required.filter((key) => !process.env[key]) : [];
  if (missing.length) throw new Error(`Missing required production configuration: ${missing.join(", ")}`);
  if (production && pushEnabled && !fcmConfigured && !apnsConfigured) {
    throw new Error("Missing required production configuration: FCM or APNs provider credentials");
  }

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
    push: {
      enabled: pushEnabled,
      pollIntervalMs: Math.max(1_000, int(process.env.PUSH_POLL_INTERVAL_MS, 5_000)),
      maxAttempts: Math.max(1, int(process.env.PUSH_MAX_ATTEMPTS, 5)),
      retryBaseMs: Math.max(1_000, int(process.env.PUSH_RETRY_BASE_MS, 5_000)),
      fcm: {
        projectId: fcmProjectId,
        clientEmail: fcmClientEmail,
        privateKeyBase64: fcmPrivateKeyBase64,
      },
      apns: {
        teamId: process.env.APNS_TEAM_ID || "",
        keyId: process.env.APNS_KEY_ID || "",
        bundleId: process.env.APNS_BUNDLE_ID || "",
        privateKeyBase64: process.env.APNS_PRIVATE_KEY_BASE64 || "",
        production: bool(process.env.APNS_PRODUCTION, production),
      },
    },
  };
};
