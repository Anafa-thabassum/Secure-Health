const ELIGIBLE_SEVERITIES = new Set(["HIGH", "CRITICAL"]);
const PERMANENT_FCM_CODES = new Set(["UNREGISTERED", "SENDER_ID_MISMATCH", "INVALID_ARGUMENT"]);
const PERMANENT_APNS_CODES = new Set(["BadDeviceToken", "DeviceTokenNotForTopic", "Unregistered"]);
const MAX_RETRY_MS = 10 * 60_000;

export const isPushSeverity = (severity) => ELIGIBLE_SEVERITIES.has(severity);

export const buildPushMessage = (event) => {
  const incidentId = event.securityEventId;
  const tampering = event.type === "TAMPERING_DETECTED" || event.type === "AUDIT_INTEGRITY_FAILURE";
  return {
    notification: {
      title: `SecureHealth ${event.severity}: ${tampering ? "integrity alert" : "security alert"}`,
      body: `${tampering ? "Audit integrity violation" : "Security incident"} detected. Incident: ${incidentId}. Open SecureHealth securely to investigate.`,
    },
    data: {
      incidentId,
      severity: event.severity,
    },
  };
};

export const retryDelayMs = (attempt, baseMs, random = Math.random) => {
  const ceiling = Math.min(MAX_RETRY_MS, baseMs * (2 ** Math.max(0, attempt - 1)));
  return Math.max(1, Math.floor(random() * ceiling));
};

export const isPermanentProviderFailure = (platform, code) => (
  platform === "ANDROID" ? PERMANENT_FCM_CODES.has(code) : PERMANENT_APNS_CODES.has(code)
);
