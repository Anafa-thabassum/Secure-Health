import test from "node:test";
import assert from "node:assert/strict";
import { buildPushMessage, isPermanentProviderFailure, isPushSeverity, retryDelayMs } from "../../services/pushPolicy.js";

test("only high and critical security events require mobile push", () => {
  assert.equal(isPushSeverity("CRITICAL"), true);
  assert.equal(isPushSeverity("HIGH"), true);
  assert.equal(isPushSeverity("MEDIUM"), false);
});

test("push payload contains only an incident reference and routing-safe fields", () => {
  const event = {
    securityEventId: "SEC-1234",
    type: "TAMPERING_DETECTED",
    severity: "CRITICAL",
    detail: "Diagnosis: secret",
    patientId: "PAT-PRIVATE",
    actorUserId: "USR-PRIVATE",
    metadata: { token: "never-send-this" },
  };
  const payload = buildPushMessage(event);
  const serialized = JSON.stringify(payload);
  assert.match(payload.notification.body, /SEC-1234/);
  assert.deepEqual(Object.keys(payload.data).sort(), ["incidentId", "severity"]);
  for (const secret of ["Diagnosis", "PAT-PRIVATE", "USR-PRIVATE", "never-send-this"]) {
    assert.equal(serialized.includes(secret), false);
  }
});

test("retry delay uses bounded exponential full jitter", () => {
  assert.equal(retryDelayMs(1, 5_000, () => 0.5), 2_500);
  assert.equal(retryDelayMs(3, 5_000, () => 0.5), 10_000);
  assert.equal(retryDelayMs(99, 5_000, () => 1), 600_000);
});

test("provider invalid-token responses are permanent", () => {
  assert.equal(isPermanentProviderFailure("ANDROID", "UNREGISTERED"), true);
  assert.equal(isPermanentProviderFailure("IOS", "BadDeviceToken"), true);
  assert.equal(isPermanentProviderFailure("ANDROID", "UNAVAILABLE"), false);
  assert.equal(isPermanentProviderFailure("IOS", "TooManyRequests"), false);
});
