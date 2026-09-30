import test from "node:test";
import assert from "node:assert/strict";
import { createAccessToken, createRefreshToken, verifyAccessToken, verifyRefreshToken } from "../../services/tokenService.js";

const user = { userId: "USR-1", role: "DOCTOR", organizationId: "ORG-A", sessionVersion: 7 };

test("access token binds identity, role, organization, and session generation", () => {
  const payload = verifyAccessToken(createAccessToken(user));
  assert.equal(payload.sub, "USR-1");
  assert.equal(payload.role, "DOCTOR");
  assert.equal(payload.organizationId, "ORG-A");
  assert.equal(payload.sv, 7);
  assert.ok(payload.jti);
});

test("tampered access tokens are rejected", () => {
  const token = createAccessToken(user);
  assert.throws(() => verifyAccessToken(`${token.slice(0, -2)}aa`));
});

test("refresh tokens are typed and session-bound", () => {
  const payload = verifyRefreshToken(createRefreshToken(user, "SES-1"));
  assert.equal(payload.type, "refresh");
  assert.equal(payload.sid, "SES-1");
  assert.equal(payload.sv, 7);
});

