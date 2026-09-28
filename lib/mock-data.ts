export const accessSeries = [
  { time: "00:00", allowed: 38, denied: 4, suspicious: 1 }, { time: "04:00", allowed: 24, denied: 6, suspicious: 3 },
  { time: "08:00", allowed: 84, denied: 9, suspicious: 2 }, { time: "12:00", allowed: 132, denied: 13, suspicious: 5 },
  { time: "16:00", allowed: 116, denied: 8, suspicious: 2 }, { time: "20:00", allowed: 72, denied: 7, suspicious: 4 },
  { time: "Now", allowed: 96, denied: 5, suspicious: 1 },
];

export const consentSeries = [
  { day: "Mon", granted: 24, revoked: 3 }, { day: "Tue", granted: 31, revoked: 4 }, { day: "Wed", granted: 28, revoked: 2 },
  { day: "Thu", granted: 38, revoked: 6 }, { day: "Fri", granted: 34, revoked: 3 }, { day: "Sat", granted: 18, revoked: 2 }, { day: "Sun", granted: 22, revoked: 1 },
];

export const mockUsers = [
  { id: "USR-0182", name: "Dr. Maya Chen", role: "Cardiologist", org: "Northstar Medical", status: "Active", risk: "Low" },
  { id: "USR-0219", name: "Dr. Amir Khan", role: "Emergency Physician", org: "Northstar Medical", status: "Active", risk: "Medium" },
  { id: "USR-0107", name: "Lena Ortiz", role: "Care Coordinator", org: "Harbor Clinic", status: "Review", risk: "Medium" },
  { id: "USR-0304", name: "Noah Williams", role: "FHIR Integration", org: "Northstar Medical", status: "Service", risk: "Low" },
];

export const mockPatients = [
  { id: "P001", name: "Avery Morgan", age: 42, mrn: "MRN-2048-771", condition: "Hypertension", consent: "Active", lastAccess: "4 min ago" },
  { id: "P014", name: "Jordan Lee", age: 57, mrn: "MRN-1911-420", condition: "Type 2 diabetes", consent: "Expiring", lastAccess: "26 min ago" },
  { id: "P027", name: "Samira Patel", age: 33, mrn: "MRN-2284-119", condition: "Post-operative review", consent: "Active", lastAccess: "Yesterday" },
  { id: "P038", name: "Theo Brooks", age: 68, mrn: "MRN-1734-885", condition: "Cardiac monitoring", consent: "Revoked", lastAccess: "3 days ago" },
];

export const mockRecords = [
  { id: "REC-7781", type: "Cardiology consultation", patient: "Avery Morgan", clinician: "Dr. Maya Chen", date: "Sep 27, 2026", protection: "Encrypted", sensitivity: "Restricted" },
  { id: "LAB-4419", type: "Metabolic panel", patient: "Jordan Lee", clinician: "Dr. Amir Khan", date: "Sep 26, 2026", protection: "Encrypted", sensitivity: "Clinical" },
  { id: "REC-7620", type: "Discharge summary", patient: "Samira Patel", clinician: "Dr. Maya Chen", date: "Sep 25, 2026", protection: "Encrypted", sensitivity: "Restricted" },
];

export const mockConsents = [
  { id: "CON-7021", org: "Northstar Medical", resource: "Clinical records", purpose: "Continuity of care", created: "Aug 14, 2026", expiry: "Dec 14, 2026", status: "Active" },
  { id: "CON-6894", org: "Harbor Diagnostics", resource: "Laboratory results", purpose: "Diagnostic review", created: "Jun 02, 2026", expiry: "Oct 02, 2026", status: "Expiring" },
  { id: "CON-6117", org: "Northstar Research", resource: "De-identified observations", purpose: "Approved research", created: "Jan 10, 2026", expiry: "Jul 10, 2026", status: "Expired" },
  { id: "CON-5840", org: "Lakeside Orthopedics", resource: "Imaging reports", purpose: "Specialist consultation", created: "Feb 21, 2026", expiry: "Aug 21, 2026", status: "Revoked" },
];

export const mockAuditEvents = [
  { id: "AUD-849205", request: "REQ-7A91F2", time: "2026-09-27 14:42:18.921", user: "Dr. Maya Chen", role: "Cardiologist", org: "Northstar Medical", patient: "P001", resource: "Observation/OB-4471", action: "READ", decision: "Allowed", reason: "Active consent; care relationship verified", severity: "Info", ip: "10.42.18.71" },
  { id: "AUD-849204", request: "REQ-62CC18", time: "2026-09-27 14:41:52.114", user: "Dr. Amir Khan", role: "Emergency Physician", org: "Northstar Medical", patient: "P038", resource: "DocumentReference/DR-992", action: "READ", decision: "Denied", reason: "No active consent for resource", severity: "Medium", ip: "10.42.19.08" },
  { id: "AUD-849203", request: "REQ-B83E06", time: "2026-09-27 14:40:17.663", user: "svc-fhir-gateway", role: "Service", org: "Northstar Medical", patient: "P014", resource: "Patient/P014", action: "READ", decision: "Allowed", reason: "System-to-system policy satisfied", severity: "Info", ip: "10.40.2.15" },
  { id: "AUD-849202", request: "REQ-990D31", time: "2026-09-27 14:37:09.402", user: "Lena Ortiz", role: "Care Coordinator", org: "Harbor Clinic", patient: "P027", resource: "MedicationRequest/MR-220", action: "READ", decision: "Denied", reason: "Organization mismatch", severity: "High", ip: "172.21.14.6" },
  { id: "AUD-849201", request: "REQ-AC8914", time: "2026-09-27 14:35:41.008", user: "Dr. Maya Chen", role: "Cardiologist", org: "Northstar Medical", patient: "P001", resource: "DiagnosticReport/DX-114", action: "READ", decision: "Allowed", reason: "Policy and consent satisfied", severity: "Info", ip: "10.42.18.71" },
];

export const mockSecurityEvents = [
  { type: "ACCESS GRANTED", title: "Clinical observation released", detail: "Dr. Maya Chen · P001 · Continuity of care", time: "14:42:18", tone: "success" },
  { type: "ACCESS DENIED", title: "Consent requirement not satisfied", detail: "Dr. Amir Khan · P038 · DocumentReference", time: "14:41:52", tone: "critical" },
  { type: "CONSENT REVOKED", title: "Imaging scope withdrawn", detail: "Lakeside Orthopedics · P001", time: "14:39:06", tone: "warning" },
  { type: "SENTINEL ALERT", title: "Off-hours volume anomaly", detail: "Lena Ortiz · 18 records / 9 minutes", time: "14:37:09", tone: "critical" },
  { type: "CHECKPOINT VERIFIED", title: "Audit chain checkpoint signed", detail: "Position 849,200 · signature verified", time: "14:35:00", tone: "info" },
];

export const mockSentinelAlerts = [
  { id: "SNT-2194", severity: "Critical", title: "Suspicious access volume", actor: "Lena Ortiz", org: "Harbor Clinic", signal: "18 patients accessed", time: "02:14–02:23", reason: "Unusual access volume during off-hours.", state: "Investigate" },
  { id: "SNT-2191", severity: "High", title: "Cross-organization activity", actor: "Dr. Ellis Ward", org: "Lakeside Orthopedics", signal: "3 denied requests", time: "13:48–13:51", reason: "Repeated attempts outside the assigned organization.", state: "Open" },
  { id: "SNT-2188", severity: "Medium", title: "Bulk export pattern", actor: "svc-analytics-04", org: "Northstar Medical", signal: "240 observations", time: "11:03–11:05", reason: "Rate exceeded the service account baseline.", state: "Acknowledged" },
];

export const mockFHIRRequests = [
  { id: "FHIR-40018", method: "GET", endpoint: "/fhir/Patient/P001", requester: "svc-care-portal", org: "Northstar Medical", resource: "Patient", decision: "Allow", latency: "41 ms", time: "14:42:18" },
  { id: "FHIR-40017", method: "GET", endpoint: "/fhir/Observation?patient=P038", requester: "svc-partner-exchange", org: "Lakeside Orthopedics", resource: "Observation", decision: "Deny", latency: "18 ms", time: "14:41:52" },
  { id: "FHIR-40016", method: "POST", endpoint: "/fhir/Consent", requester: "patient-portal", org: "Northstar Medical", resource: "Consent", decision: "Allow", latency: "62 ms", time: "14:39:06" },
];

export const serviceHealth = [
  ["Authorization Engine", "Operational", "18 ms"], ["Consent Service", "Operational", "24 ms"], ["Encryption Service", "Operational", "11 ms"],
  ["Audit Integrity", "Verified", "0 drift"], ["Sentinel", "Monitoring", "1 alert"], ["FHIR Gateway", "Operational", "41 ms"],
] as const;
