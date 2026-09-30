import { mockAuditEvents, mockConsents, mockFHIRRequests, mockPatients, mockRecords, mockSecurityEvents, mockSentinelAlerts, mockUsers } from "./mock-data";

const API_BASE = process.env.NEXT_PUBLIC_SECUREHEALTH_API_URL?.replace(/\/$/, "");
const delay = <T,>(value: T, ms = 240) => new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));
let accessToken = "";
let refreshToken = "";

type ApiOptions = RequestInit & { anonymous?: boolean };
async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  if (!API_BASE) throw new Error("SECUREHEALTH_DEMO_MODE");
  const headers = new Headers(options.headers);
  headers.set("content-type", "application/json");
  if (!options.anonymous && accessToken) headers.set("authorization", `Bearer ${accessToken}`);
  const response = await fetch(`${API_BASE}/api/v1${path}`, { ...options, headers });
  const body = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(body?.error?.message || "SecureHealth service request failed");
  return body?.data ?? body;
}

const backendOr = async <T,>(request: () => Promise<T>, fallback: () => Promise<T>) => API_BASE ? request() : fallback();

export const authService = {
  async login(email: string, password = "") {
    return backendOr(async () => {
      const result = await api<any>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }), anonymous: true });
      accessToken = result.tokens.accessToken; refreshToken = result.tokens.refreshToken;
      return { user: result.user, session: "authenticated" };
    }, () => delay({ user: mockUsers[0], session: `demo-${email.length}` }, 520));
  },
  async logout() {
    if (API_BASE && refreshToken) await api("/auth/logout", { method: "POST", body: JSON.stringify({ refreshToken }), anonymous: true });
    accessToken = ""; refreshToken = ""; return true;
  },
  forgotPassword: (email: string) => backendOr(() => api("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }), anonymous: true }), () => delay({ accepted: true })),
};

export const patientService = {
  list: () => backendOr(() => api<any[]>("/patients"), () => delay(mockPatients)),
  records: (patientId?: string) => backendOr(() => api<any[]>(`/patients/${patientId}/records`), () => delay(mockRecords)),
  get: (id: string) => backendOr(() => api(`/patients/${id}`), () => delay(mockPatients.find((patient) => patient.id === id))),
};
export const consentService = {
  list: () => backendOr(() => api<any[]>("/consents"), () => delay(mockConsents)),
  grant: (payload: object) => backendOr(() => api("/consents", { method: "POST", body: JSON.stringify(payload) }), () => delay({ id: "CON-NEW", ...payload, status: "Active" })),
  revoke: (id: string) => backendOr(() => api(`/consents/${id}/revoke`, { method: "POST" }), () => delay({ id, status: "Revoked", cacheInvalidated: true })),
};
export const securityService = {
  events: () => backendOr(() => api<any[]>("/security/events"), () => delay(mockSecurityEvents)),
  evaluate: (input: string | object) => backendOr(() => api("/access/evaluate", { method: "POST", body: JSON.stringify(input) }), () => delay({ requestId: "REQ-7A91F2", decision: input === "authorized" ? "ALLOW" : "DENY" }, 760)),
};
export const auditService = {
  list: () => backendOr(() => api<any[]>("/audit"), () => delay(mockAuditEvents)),
  get: (id: string) => backendOr(() => api(`/audit/${id}`), () => delay(mockAuditEvents.find((event) => event.id === id))),
  verify: (tampered = false) => backendOr(() => api("/integrity/verify"), () => delay({ valid: !tampered, position: 849205 }, 900)),
};
export const sentinelService = {
  alerts: () => backendOr(() => api<any[]>("/sentinel/alerts"), () => delay(mockSentinelAlerts)),
  acknowledge: (id: string) => backendOr(() => api(`/sentinel/alerts/${id}/acknowledge`, { method: "POST" }), () => delay({ id, state: "Acknowledged" })),
};
export const fhirService = {
  requests: () => backendOr(() => api<any[]>("/fhir/requests"), () => delay(mockFHIRRequests)),
  get: (id: string) => delay(mockFHIRRequests.find((request) => request.id === id)),
};
