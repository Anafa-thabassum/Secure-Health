import { verifyAuditChain } from "./auditIntegrityService.js";
import { recordSecurityEvent } from "./securityEventService.js";

let lastFailureFingerprint = null;
let running = false;

const fingerprint = (result) => JSON.stringify({
  status: result.status,
  chainPosition: result.chainPosition,
  eventId: result.eventId,
  checkpointId: result.checkpointId,
  expectedHash: result.expectedHash,
  actualHash: result.actualHash,
});

export const checkAuditIntegrity = async () => {
  if (running) return null;
  running = true;
  try {
    const result = await verifyAuditChain();
    if (result.valid) {
      lastFailureFingerprint = null;
      return result;
    }

    const currentFingerprint = fingerprint(result);
    if (currentFingerprint !== lastFailureFingerprint) {
      lastFailureFingerprint = currentFingerprint;
      await recordSecurityEvent({
        type: "AUDIT_INTEGRITY_FAILURE",
        title: "Audit integrity verification failed",
        detail: `Automated verification detected ${result.status}`,
        severity: "CRITICAL",
        metadata: { automated: true, globalAlert: true, integrity: result },
      });
    }
    return result;
  } finally {
    running = false;
  }
};
