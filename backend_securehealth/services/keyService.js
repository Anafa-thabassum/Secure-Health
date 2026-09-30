import crypto from "node:crypto";
import { getConfig } from "../config/env.js";

let developmentEncryptionKey;
let developmentAuditKeys;

export const getEncryptionKey = () => {
  const config = getConfig();
  if (config.encryption.keyBase64) {
    const key = Buffer.from(config.encryption.keyBase64, "base64");
    if (key.length !== 32) throw new Error("ENCRYPTION_KEY_BASE64 must decode to exactly 32 bytes");
    return { key, keyId: config.encryption.keyId };
  }
  if (config.production) throw new Error("Encryption key is not configured");
  developmentEncryptionKey ||= crypto.createHash("sha256").update("securehealth-development-data-key").digest();
  return { key: developmentEncryptionKey, keyId: config.encryption.keyId };
};

export const getAuditSigningKeys = () => {
  const config = getConfig();
  if (config.audit.privateKeyBase64 && config.audit.publicKeyBase64) {
    return {
      privateKey: crypto.createPrivateKey(Buffer.from(config.audit.privateKeyBase64, "base64").toString("utf8")),
      publicKey: crypto.createPublicKey(Buffer.from(config.audit.publicKeyBase64, "base64").toString("utf8")),
    };
  }
  if (config.production) throw new Error("Audit signing keys are not configured");
  developmentAuditKeys ||= crypto.generateKeyPairSync("ed25519");
  return developmentAuditKeys;
};

export const publicKeyFingerprint = (key) => crypto.createHash("sha256").update(key.export({ type: "spki", format: "der" })).digest("hex");

