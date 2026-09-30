import crypto from "node:crypto";

export const GENESIS_HASH = "0".repeat(64);

export const canonicalize = (value) => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value instanceof Date) return value.toISOString();
  if (value && typeof value === "object") {
    return Object.keys(value).sort().reduce((output, key) => {
      output[key] = canonicalize(value[key]);
      return output;
    }, {});
  }
  return value;
};

export const sha256 = (value) => crypto.createHash("sha256").update(String(value)).digest("hex");

export const calculateAuditHash = (event, previousHash) => sha256(JSON.stringify(canonicalize({ ...event, previousHash })));

