import { mockAuditEvents, mockConsents, mockFHIRRequests, mockPatients, mockRecords, mockSecurityEvents, mockSentinelAlerts, mockUsers } from "./mock-data";

const delay = <T,>(value: T, ms = 240) => new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));
export const authService = { login: (email: string) => delay({ user: mockUsers[0], session: `demo-${email.length}` }, 520), logout: () => delay(true) };
export const patientService = { list: () => delay(mockPatients), records: () => delay(mockRecords), get: (id: string) => delay(mockPatients.find((p) => p.id === id)) };
export const consentService = { list: () => delay(mockConsents), grant: (payload: object) => delay({ id: "CON-NEW", ...payload, status: "Active" }), revoke: (id: string) => delay({ id, status: "Revoked", cacheInvalidated: true }) };
export const securityService = { events: () => delay(mockSecurityEvents), evaluate: (scenario: string) => delay({ requestId: "REQ-7A91F2", decision: scenario === "authorized" ? "Allowed" : "Denied" }, 760) };
export const auditService = { list: () => delay(mockAuditEvents), get: (id: string) => delay(mockAuditEvents.find((e) => e.id === id)), verify: (tampered = false) => delay({ valid: !tampered, position: 849205 }, 900) };
export const sentinelService = { alerts: () => delay(mockSentinelAlerts), acknowledge: (id: string) => delay({ id, state: "Acknowledged" }) };
export const fhirService = { requests: () => delay(mockFHIRRequests), get: (id: string) => delay(mockFHIRRequests.find((r) => r.id === id)) };
