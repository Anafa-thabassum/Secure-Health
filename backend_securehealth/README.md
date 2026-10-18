# SecureHealth API

Node.js/Express backend for the SecureHealth academic zero-trust EHR security prototype. It represents security policy decisions in the UI while enforcing them server-side here.

## Included controls

- JWT access and rotating refresh sessions with per-token revocation, session generations, concurrent-session limits, logout-all, email verification, and password-reset invalidation
- Deny-by-default RBAC for Patient, Doctor, Nurse, Lab Technician, Administrator, and Auditor plus ABAC, care relationship, sensitivity, time, purpose, resource, consent, and break-glass evaluation
- AES-256-GCM encryption for protected clinical payloads
- Consent grant/revoke/expiry with wildcard Redis cache invalidation
- Tamper-evident SHA-256 audit chain with serialized writers and Ed25519-signed checkpoints bound to exact audit events in a separately configurable database
- Explainable allow/deny decisions with request IDs
- Break-glass time limits, accessed-resource tracking, explicit expiry, and review workflow
- Sentinel detection for volume, off-hours, cross-organization, bulk download, and repeated denial activity, plus authenticated real-time Socket.IO events
- Durable mobile alerts for high/critical security events through FCM (Android) and APNs (iOS), with encrypted device tokens, bounded retries, invalid-token cleanup, and metadata-only notification payloads
- FHIR GET/POST authorization with minimum-necessary response filtering
- MongoDB persistence, Redis-backed caching and distributed rate limits, bounded concurrency, request timeouts, strict schemas, and safe dependency failure responses

This is an academic security prototype, not a HIPAA certification claim. Production deployments must use managed secrets, TLS, hardened network policies, key rotation, backups, observability, and an external identity provider appropriate to the organization.

## Run locally

1. Copy `.env.example` to `.env` and replace the development values.
2. Start MongoDB and Redis with `docker compose up -d`.
3. Install dependencies with `npm install`.
4. Load synthetic data with `npm run seed`.
5. Start the API with `npm run dev`.

The API is served at `http://localhost:12000/api/v1`; operational health is available at `/health` and `/ready`.

## Mobile push alerts

Configure at least one provider from `.env.example`, then enable `PUSH_ENABLED`. For FCM, prefer `FCM_SERVICE_ACCOUNT_PATH` pointing to a secret-mounted Firebase service-account JSON file; direct environment fields remain available for managed secret stores. Administrator and Auditor clients register provider tokens with `POST /api/v1/push/devices` and revoke them with `DELETE /api/v1/push/devices/{registrationId}`. Tokens are AES-256-GCM encrypted at rest and never returned by the API.

Every High or Critical security event is created with an embedded outbox record in the same MongoDB write. The worker leases pending events, re-checks the recipient's active account and role, sends a minimal incident-reference payload, retries transient failures with jittered exponential backoff, and invalidates permanently rejected tokens. Provider acceptance is delivery evidence only; human acknowledgement remains a separate Sentinel/security workflow.

## Verification

Run `npm test` for the security suite or `npm run test:coverage` for Node's source coverage report. With a local MongoDB listening on port 27019, `npm run test:integration` verifies encrypted persistence, isolated signed checkpoints, end-to-end chain integrity, and token revocation. The unit suite covers token integrity, all six roles, organization/relationship/sensitivity ABAC, active/expired/revoked consent, AES-GCM integrity and IV uniqueness, minimum-necessary filtering, break-glass scope and expiry, every Sentinel rule, FHIR policy, push payload minimization and retry classification, payload limits, strict input rejection, audit modification/deletion/reordering/insertion, and checkpoint-to-event binding.

The suite is deterministic and does not require live infrastructure. Before production deployment, also execute integration and load tests against the exact managed MongoDB, separate checkpoint MongoDB, Redis, mail provider, reverse proxy, and key-management environment used in production.

## Production boundary

The published SecureHealth Site is a Cloudflare-hosted frontend. This Express service needs a Node-capable runtime with MongoDB and Redis. Configure the frontend's public API base URL to that deployed HTTPS origin. Never put JWT secrets, encryption keys, signing keys, or database credentials in frontend code.
