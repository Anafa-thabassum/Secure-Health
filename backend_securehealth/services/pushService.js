import crypto from "node:crypto";
import http2 from "node:http2";
import { getConfig } from "../config/env.js";
import { DeviceRegistration } from "../models/DeviceRegistration.js";
import { SecurityEvent } from "../models/SecurityEvent.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/errors.js";
import { ids } from "../utils/ids.js";
import { decryptClinicalData, encryptClinicalData } from "./encryptionService.js";
import { buildPushMessage, isPermanentProviderFailure, retryDelayMs } from "./pushPolicy.js";
import { recordSecurityEvent } from "./securityEventService.js";

const TERMINAL_DELIVERIES = new Set(["ACCEPTED", "PERMANENT_FAILURE"]);
const PROVIDER_TIMEOUT_MS = 8_000;
const MAX_EVENTS_PER_RUN = 25;
const LEASE_MS = 30_000;

let fcmAccessToken;
let fcmAccessTokenExpiresAt = 0;
let apnsProviderToken;
let apnsProviderTokenIssuedAt = 0;

const base64url = (value) => Buffer.from(value).toString("base64url");
const decodePem = (value) => Buffer.from(value, "base64").toString("utf8");
const tokenAad = (registrationId, userId) => `push:${registrationId}:${userId}`;
const tokenHash = (token) => crypto.createHash("sha256").update(token).digest("hex");
const safeProviderMessage = (code) => `Push provider rejected the notification (${code})`;

const publicRegistration = (registration) => {
  const value = registration.toJSON ? registration.toJSON() : { ...registration };
  delete value.tokenHash;
  delete value.tokenEnvelope;
  return value;
};

export const registerDevice = async (user, input) => {
  const token = input.token.trim();
  const hash = tokenHash(token);
  const existing = await DeviceRegistration.findOne({ tokenHash: hash }).select("+tokenHash +tokenEnvelope");
  if (existing?.userId !== user.userId && existing?.status === "ACTIVE") {
    throw new AppError(409, "PUSH_TOKEN_IN_USE", "This device token is already registered");
  }

  const registrationId = existing?.registrationId || ids.device();
  const now = new Date();
  let registration;
  try {
    registration = await DeviceRegistration.findOneAndUpdate(
      { registrationId },
      {
        $set: {
          userId: user.userId,
          organizationId: user.organizationId,
          platform: input.platform,
          tokenHash: hash,
          tokenEnvelope: encryptClinicalData(token, tokenAad(registrationId, user.userId)),
          deviceId: input.deviceId || null,
          label: input.label || null,
          appId: input.appId || null,
          status: "ACTIVE",
          lastRegisteredAt: now,
          revokedAt: null,
          invalidatedAt: null,
          lastFailureCode: null,
        },
      },
      { new: true, upsert: true, runValidators: true },
    );
  } catch (error) {
    if (error?.code === 11000) throw new AppError(409, "PUSH_TOKEN_IN_USE", "This device token is already registered");
    throw error;
  }

  await recordSecurityEvent({
    requestId: input.requestId,
    type: "PUSH_DEVICE_REGISTERED",
    title: "Push notification device registered",
    detail: `A ${input.platform} push device was registered for a security operator`,
    severity: "INFO",
    actorUserId: user.userId,
    organizationId: user.organizationId,
    metadata: { registrationId, platform: input.platform },
  });
  return publicRegistration(registration);
};

export const listDevices = async (user) => (
  DeviceRegistration.find({ userId: user.userId }).sort({ updatedAt: -1 }).lean()
);

export const revokeDevice = async (user, registrationId, requestId) => {
  const registration = await DeviceRegistration.findOneAndUpdate(
    { registrationId, userId: user.userId },
    { $set: { status: "REVOKED", revokedAt: new Date() } },
    { new: true },
  );
  if (!registration) throw new AppError(404, "NOT_FOUND", "Push device registration not found");
  await recordSecurityEvent({
    requestId,
    type: "PUSH_DEVICE_REVOKED",
    title: "Push notification device revoked",
    detail: "A security operator revoked a push notification device",
    severity: "INFO",
    actorUserId: user.userId,
    organizationId: user.organizationId,
    metadata: { registrationId },
  });
  return publicRegistration(registration);
};

const getFcmAccessToken = async (config) => {
  if (fcmAccessToken && Date.now() < fcmAccessTokenExpiresAt - 60_000) return fcmAccessToken;
  const issuedAt = Math.floor(Date.now() / 1_000);
  const encodedHeader = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const encodedClaim = base64url(JSON.stringify({
    iss: config.clientEmail,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: issuedAt,
    exp: issuedAt + 3_600,
  }));
  const unsigned = `${encodedHeader}.${encodedClaim}`;
  const assertion = `${unsigned}.${crypto.sign("RSA-SHA256", Buffer.from(unsigned), decodePem(config.privateKeyBase64)).toString("base64url")}`;
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
    signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`FCM authentication failed with HTTP ${response.status}`);
  const body = await response.json();
  fcmAccessToken = body.access_token;
  fcmAccessTokenExpiresAt = Date.now() + (Number(body.expires_in) || 3_600) * 1_000;
  return fcmAccessToken;
};

const sendFcm = async (token, message, config) => {
  if (!config.projectId || !config.clientEmail || !config.privateKeyBase64) {
    return { accepted: false, permanent: false, code: "PROVIDER_NOT_CONFIGURED", message: "FCM is not configured" };
  }
  const accessToken = await getFcmAccessToken(config);
  const response = await fetch(`https://fcm.googleapis.com/v1/projects/${encodeURIComponent(config.projectId)}/messages:send`, {
    method: "POST",
    headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json" },
    body: JSON.stringify({
      message: {
        token,
        notification: message.notification,
        data: message.data,
        android: { priority: "high", ttl: "300s" },
      },
    }),
    signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
  });
  const body = await response.json().catch(() => ({}));
  if (response.ok) return { accepted: true, permanent: false, providerMessageId: body.name || null, code: null, message: null };
  const code = body.error?.details?.find((detail) => detail.errorCode)?.errorCode || body.error?.status || `HTTP_${response.status}`;
  return { accepted: false, permanent: isPermanentProviderFailure("ANDROID", code), code, message: safeProviderMessage(code) };
};

const getApnsProviderToken = (config) => {
  const issuedAt = Math.floor(Date.now() / 1_000);
  if (apnsProviderToken && issuedAt - apnsProviderTokenIssuedAt < 50 * 60) return apnsProviderToken;
  const encodedHeader = base64url(JSON.stringify({ alg: "ES256", kid: config.keyId }));
  const encodedClaim = base64url(JSON.stringify({ iss: config.teamId, iat: issuedAt }));
  const unsigned = `${encodedHeader}.${encodedClaim}`;
  const signature = crypto.sign("SHA256", Buffer.from(unsigned), {
    key: decodePem(config.privateKeyBase64),
    dsaEncoding: "ieee-p1363",
  });
  apnsProviderToken = `${unsigned}.${signature.toString("base64url")}`;
  apnsProviderTokenIssuedAt = issuedAt;
  return apnsProviderToken;
};

const sendApns = async (token, message, config) => {
  if (!config.teamId || !config.keyId || !config.bundleId || !config.privateKeyBase64) {
    return { accepted: false, permanent: false, code: "PROVIDER_NOT_CONFIGURED", message: "APNs is not configured" };
  }
  const host = config.production ? "https://api.push.apple.com" : "https://api.sandbox.push.apple.com";
  const providerToken = getApnsProviderToken(config);
  const apnsId = crypto.randomUUID();
  return new Promise((resolve, reject) => {
    const client = http2.connect(host);
    const timer = setTimeout(() => client.destroy(new Error("APNs request timed out")), PROVIDER_TIMEOUT_MS);
    client.once("error", reject);
    const request = client.request({
      ":method": "POST",
      ":path": `/3/device/${token}`,
      authorization: `bearer ${providerToken}`,
      "apns-topic": config.bundleId,
      "apns-push-type": "alert",
      "apns-priority": "10",
      "apns-expiration": String(Math.floor(Date.now() / 1_000) + 300),
      "apns-id": apnsId,
      "content-type": "application/json",
    });
    let responseHeaders;
    let responseBody = "";
    request.setEncoding("utf8");
    request.on("response", (headers) => { responseHeaders = headers; });
    request.on("data", (chunk) => { responseBody += chunk; });
    request.on("end", () => {
      clearTimeout(timer);
      client.close();
      const status = Number(responseHeaders?.[":status"] || 500);
      if (status === 200) {
        resolve({ accepted: true, permanent: false, providerMessageId: responseHeaders?.["apns-id"] || apnsId, code: null, message: null });
        return;
      }
      let reason = `HTTP_${status}`;
      try { reason = JSON.parse(responseBody).reason || reason; } catch {}
      resolve({ accepted: false, permanent: isPermanentProviderFailure("IOS", reason), code: reason, message: safeProviderMessage(reason) });
    });
    request.once("error", (error) => {
      clearTimeout(timer);
      client.close();
      reject(error);
    });
    request.end(JSON.stringify({
      aps: {
        alert: message.notification,
        sound: "default",
        "thread-id": "securehealth-security",
      },
      ...message.data,
    }));
  });
};

export const sendPushNotification = async (platform, token, message) => {
  const config = getConfig().push;
  try {
    return platform === "ANDROID"
      ? await sendFcm(token, message, config.fcm)
      : await sendApns(token, message, config.apns);
  } catch {
    return { accepted: false, permanent: false, code: "PROVIDER_ERROR", message: "Push provider request failed" };
  }
};

const claimNextEvent = async () => {
  const config = getConfig().push;
  const now = new Date();
  return SecurityEvent.findOneAndUpdate(
    {
      "notification.attempts": { $lt: config.maxAttempts },
      $or: [
        { "notification.status": "PENDING" },
        { "notification.status": "RETRY", "notification.nextAttemptAt": { $lte: now } },
        { "notification.status": "PROCESSING", "notification.leaseUntil": { $lte: now } },
      ],
    },
    { $set: { "notification.status": "PROCESSING", "notification.leaseUntil": new Date(now.getTime() + LEASE_MS) } },
    { new: true, sort: { createdAt: 1 } },
  );
};

const deliverEvent = async (event) => {
  const config = getConfig().push;
  const attemptedAt = new Date();
  let organizationId = event.organizationId;
  if (!organizationId && event.actorUserId) {
    const actor = await User.findOne({ userId: event.actorUserId }).select("organizationId").lean();
    organizationId = actor?.organizationId;
  }
  const registrations = organizationId
    ? await DeviceRegistration.find({ status: "ACTIVE", organizationId }).select("+tokenEnvelope").lean()
    : [];
  const authorizedUsers = await User.find({
    userId: { $in: registrations.map((registration) => registration.userId) },
    organizationId,
    status: "ACTIVE",
    role: { $in: ["ADMINISTRATOR", "AUDITOR"] },
  }).select("userId").lean();
  const allowed = new Set(authorizedUsers.map((user) => user.userId));
  const recipients = registrations.filter((registration) => allowed.has(registration.userId));
  const previous = new Map((event.notification.deliveries || []).map((delivery) => {
    const value = delivery.toObject ? delivery.toObject() : delivery;
    return [value.registrationId, value];
  }));
  const message = buildPushMessage(event);

  let accepted = false;
  let transientFailure = false;
  let lastError = null;
  for (const registration of recipients) {
    const prior = previous.get(registration.registrationId);
    if (prior && TERMINAL_DELIVERIES.has(prior.status)) {
      if (prior.status === "ACCEPTED") accepted = true;
      continue;
    }
    let result;
    try {
      const token = decryptClinicalData(registration.tokenEnvelope, tokenAad(registration.registrationId, registration.userId));
      result = await sendPushNotification(registration.platform, token, message);
    } catch {
      result = { accepted: false, permanent: false, code: "TOKEN_DECRYPTION_FAILED", message: "Registered push token could not be decrypted" };
    }
    const status = result.accepted ? "ACCEPTED" : result.permanent ? "PERMANENT_FAILURE" : "TRANSIENT_FAILURE";
    previous.set(registration.registrationId, {
      registrationId: registration.registrationId,
      platform: registration.platform,
      status,
      providerMessageId: result.providerMessageId || null,
      code: result.code || null,
      message: result.message || null,
      attemptedAt,
    });
    if (result.accepted) accepted = true;
    else if (result.permanent) {
      await DeviceRegistration.updateOne(
        { registrationId: registration.registrationId },
        { $set: { status: "INVALID", invalidatedAt: attemptedAt, lastFailureCode: result.code || "PERMANENT_FAILURE" } },
      );
    } else {
      transientFailure = true;
      lastError = result.message || "Push provider request failed";
    }
  }

  const attempts = (event.notification.attempts || 0) + 1;
  if (!recipients.length) {
    transientFailure = true;
    lastError = "No active authorized push devices are registered";
  }
  event.notification.attempts = attempts;
  event.notification.lastAttemptAt = attemptedAt;
  event.notification.leaseUntil = null;
  event.notification.deliveries = [...previous.values()];
  event.notification.lastError = lastError;
  if (transientFailure && attempts < config.maxAttempts) {
    event.notification.status = "RETRY";
    event.notification.nextAttemptAt = new Date(Date.now() + retryDelayMs(attempts, config.retryBaseMs));
  } else if (accepted) {
    event.notification.status = "ACCEPTED";
    event.notification.acceptedAt = attemptedAt;
    event.notification.nextAttemptAt = null;
  } else {
    event.notification.status = "FAILED";
    event.notification.nextAttemptAt = null;
  }
  await event.save();
};

export const processPushOutbox = async () => {
  if (!getConfig().push.enabled) return 0;
  let processed = 0;
  while (processed < MAX_EVENTS_PER_RUN) {
    const event = await claimNextEvent();
    if (!event) break;
    await deliverEvent(event);
    processed += 1;
  }
  return processed;
};
