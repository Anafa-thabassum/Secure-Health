# SecureHealth backend verification

Verified on 2026-09-30 with Node.js 26.10.0.

## Automated results

- Security tests: 39 passed, 0 failed
- Source line coverage: 74.65%
- Branch coverage: 81.05%
- Backend production dependency audit: 0 vulnerabilities
- JavaScript syntax verification: passed for every backend source file
- Full SecureHealth production frontend build: passed
- Live MongoDB smoke test: passed against isolated databases for application data and checkpoints; verified encrypted-record persistence, two chained audit events, two signed checkpoints, full integrity validation, and access-token revocation

## Covered adversarial cases

- Forged/tampered JWT rejection and session-generation binding
- Deny-by-default permission behavior for all six roles
- Wrong organization, missing relationship, and restricted sensitivity
- Missing, expired, revoked, resource-mismatched, and purpose-mismatched consent
- AES-256-GCM ciphertext tampering and nonce uniqueness
- Minimum-necessary disclosure by clinical role
- Expired and cross-patient break-glass bypass attempts
- High volume, off-hours, cross-organization, bulk download, and repeated denial detection
- FHIR resource authorization failures
- Oversized payloads and mass-assignment/unknown-field rejection
- Audit event modification, deletion, insertion, and reorder detection
- Signed checkpoint mismatch against the actual audit event

## Production boundary

The automated suite validates application behavior without external services. A production launch still requires environment-specific integration, failover, backup/restore, concurrency, and load tests against the deployed MongoDB cluster, the separately administered checkpoint database, Redis, mail transport, TLS proxy, monitoring stack, and managed key service.
