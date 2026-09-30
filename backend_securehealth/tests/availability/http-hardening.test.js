import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../../app.js";

const withServer = async (run) => {
  const server = createApp().listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  try { await run(`http://127.0.0.1:${server.address().port}`); } finally { await new Promise((resolve) => server.close(resolve)); }
};

test("oversized JSON payloads are rejected with a safe 413 response", () => withServer(async (base) => {
  const response = await fetch(`${base}/api/v1/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: "a@example.com", password: "x".repeat(1_100_000) }) });
  const body = await response.json();
  assert.equal(response.status, 413);
  assert.equal(body.error.code, "PAYLOAD_TOO_LARGE");
  assert.ok(body.error.requestId);
}));

test("strict request schemas reject unknown fields before data access", () => withServer(async (base) => {
  const response = await fetch(`${base}/api/v1/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: "a@example.com", password: "valid-password", injectedRole: "ADMINISTRATOR" }) });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, "VALIDATION_ERROR");
}));

