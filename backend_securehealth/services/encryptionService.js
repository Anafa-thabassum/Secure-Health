import crypto from "node:crypto";
import { getConfig } from "../config/env.js";
import { AppError } from "../utils/errors.js";

const resolveKey = () => {
  const config = getConfig();
  if (config.encryption.keyBase64) {
    const key = Buffer.from(config.encryption.keyBase64, "base64");
    if (key.length !== 32) throw new Error("ENCRYPTION_KEY_BASE64 must decode to exactly 32 bytes");
    return key;
  }
  if (config.production) throw new Error("Production encryption key is not configured");
  return crypto.createHash("sha256").update("securehealth-development-clinical-data-key").digest();
};

export const encryptClinicalData = (value, associatedData = "") => {
  const config = getConfig();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", resolveKey(), iv);
  if (associatedData) cipher.setAAD(Buffer.from(associatedData));
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return {
    algorithm: "aes-256-gcm",
    keyId: config.encryption.keyId,
    iv: iv.toString("base64"),
    ciphertext: ciphertext.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
  };
};

export const decryptClinicalData = (payload, associatedData = "") => {
  try {
    const decipher = crypto.createDecipheriv("aes-256-gcm", resolveKey(), Buffer.from(payload.iv, "base64"));
    if (associatedData) decipher.setAAD(Buffer.from(associatedData));
    decipher.setAuthTag(Buffer.from(payload.authTag, "base64"));
    const plaintext = Buffer.concat([decipher.update(Buffer.from(payload.ciphertext, "base64")), decipher.final()]);
    return JSON.parse(plaintext.toString("utf8"));
  } catch {
    throw new AppError(500, "DECRYPTION_FAILED", "Protected clinical data could not be verified or decrypted");
  }
};

