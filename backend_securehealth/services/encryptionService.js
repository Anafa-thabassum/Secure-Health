import crypto from "node:crypto";
import { AppError } from "../utils/errors.js";
import { getEncryptionKey } from "./keyService.js";

export const encryptClinicalData = (value, associatedData = "") => {
  const { key, keyId } = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  if (associatedData) cipher.setAAD(Buffer.from(associatedData));
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return {
    algorithm: "aes-256-gcm",
    keyId,
    iv: iv.toString("base64"),
    ciphertext: ciphertext.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
  };
};

export const decryptClinicalData = (payload, associatedData = "") => {
  try {
    const { key, keyId } = getEncryptionKey();
    if (payload.algorithm !== "aes-256-gcm" || payload.keyId !== keyId) throw new Error("Unsupported encryption envelope");
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(payload.iv, "base64"));
    if (associatedData) decipher.setAAD(Buffer.from(associatedData));
    decipher.setAuthTag(Buffer.from(payload.authTag, "base64"));
    const plaintext = Buffer.concat([decipher.update(Buffer.from(payload.ciphertext, "base64")), decipher.final()]);
    return JSON.parse(plaintext.toString("utf8"));
  } catch {
    throw new AppError(500, "DECRYPTION_FAILED", "Protected clinical data could not be verified or decrypted");
  }
};
