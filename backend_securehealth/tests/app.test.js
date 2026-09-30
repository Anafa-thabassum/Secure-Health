import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("health endpoint responds without exposing infrastructure details", async () => {
  const server = createApp().listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/health`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.service, "SecureHealth API");
  await new Promise((resolve) => server.close(resolve));
});
