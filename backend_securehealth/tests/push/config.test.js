import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { getConfig } from "../../config/env.js";

test("FCM credentials load from a service-account file", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "securehealth-fcm-"));
  const file = path.join(directory, "account.json");
  fs.writeFileSync(file, JSON.stringify({ project_id: "test-project", client_email: "push@example.invalid", private_key: "test-private-key" }));
  const previous = process.env.FCM_SERVICE_ACCOUNT_PATH;
  process.env.FCM_SERVICE_ACCOUNT_PATH = file;

  try {
    const config = getConfig().push.fcm;
    assert.equal(config.projectId, "test-project");
    assert.equal(config.clientEmail, "push@example.invalid");
    assert.equal(Buffer.from(config.privateKeyBase64, "base64").toString("utf8"), "test-private-key");
  } finally {
    if (previous == null) delete process.env.FCM_SERVICE_ACCOUNT_PATH;
    else process.env.FCM_SERVICE_ACCOUNT_PATH = previous;
    fs.rmSync(directory, { recursive: true });
  }
});

test("an unreadable FCM service-account path fails closed", () => {
  const previous = process.env.FCM_SERVICE_ACCOUNT_PATH;
  process.env.FCM_SERVICE_ACCOUNT_PATH = path.join(os.tmpdir(), "securehealth-missing-service-account.json");

  try {
    assert.throws(() => getConfig(), /FCM_SERVICE_ACCOUNT_PATH/);
  } finally {
    if (previous == null) delete process.env.FCM_SERVICE_ACCOUNT_PATH;
    else process.env.FCM_SERVICE_ACCOUNT_PATH = previous;
  }
});
