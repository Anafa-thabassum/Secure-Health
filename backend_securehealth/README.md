# SecureHealth API

Node.js/Express backend for the SecureHealth academic zero-trust EHR security prototype. It represents security policy decisions in the UI while enforcing them server-side here.

## Included controls

- JWT access and rotating refresh sessions with server-side revocation
- RBAC, ABAC, care-relationship, purpose, resource, consent, and break-glass evaluation
- AES-256-GCM encryption for protected clinical payloads
- Consent grant/revoke with Redis cache invalidation
- Tamper-evident SHA-256 audit chain and Ed25519-signed checkpoints
- Explainable allow/deny decisions with request IDs
- Break-glass time limits and review workflow
- Sentinel detection rules and real-time Socket.IO security events
- FHIR gateway authorization with sanitized response payloads
- MongoDB persistence and Redis-backed caching/rate state

This is an academic security prototype, not a HIPAA certification claim. Production deployments must use managed secrets, TLS, hardened network policies, key rotation, backups, observability, and an external identity provider appropriate to the organization.

## Run locally

1. Copy `.env.example` to `.env` and replace the development values.
2. Start MongoDB and Redis with `docker compose up -d`.
3. Install dependencies with `npm install`.
4. Load synthetic data with `npm run seed`.
5. Start the API with `npm run dev`.

The API is served at `http://localhost:12000/api/v1`; operational health is available at `/health` and `/ready`.

## Production boundary

The published SecureHealth Site is a Cloudflare-hosted frontend. This Express service needs a Node-capable runtime with MongoDB and Redis. Configure the frontend's public API base URL to that deployed HTTPS origin. Never put JWT secrets, encryption keys, signing keys, or database credentials in frontend code.
