import { cache } from "../config/redis.js";
import { SentinelAlert } from "../models/SentinelAlert.js";
import { ids } from "../utils/ids.js";
import { recordSecurityEvent } from "./securityEventService.js";

export const detectionRules = [
  { key: "HIGH_ACCESS_VOLUME", name: "High Access Volume", threshold: 50, windowSeconds: 900 },
  { key: "OFF_HOURS_ACCESS", name: "Off-Hours Access", startHour: 22, endHour: 6 },
  { key: "CROSS_ORGANIZATION_ACTIVITY", name: "Cross-Organization Activity" },
  { key: "BULK_DOWNLOAD", name: "Bulk Download", threshold: 20 },
  { key: "REPEATED_DENIED_REQUESTS", name: "Repeated Denied Requests", threshold: 5, windowSeconds: 900 },
];

const createAlert = async (input) => {
  const existing = await SentinelAlert.findOne({ rule: input.rule, actorUserId: input.actorUserId, status: { $in: ["OPEN", "INVESTIGATING"] }, createdAt: { $gt: new Date(Date.now() - 15 * 60_000) } });
  if (existing) return existing.toJSON();
  const alert = await SentinelAlert.create({ alertId: ids.alert(), status: "OPEN", ...input });
  await recordSecurityEvent({ requestId: input.evidence?.requestId, type: "SENTINEL_ALERT", title: input.title, detail: input.reason, severity: input.severity, actorUserId: input.actorUserId, organizationId: input.organizationId, metadata: { alertId: alert.alertId, rule: input.rule } });
  return alert.toJSON();
};

export const observeDecision = async ({ user, patient, evaluation, requestId, action }) => {
  const suffix = `${user.userId}:${new Date().toISOString().slice(0, 10)}`;
  const count = await cache.increment(`sentinel:access:${suffix}`, 900);
  if (count > 50) await createAlert({ rule: "HIGH_ACCESS_VOLUME", severity: "HIGH", title: "High access volume", reason: "Unusual patient record access volume was detected.", actorUserId: user.userId, organizationId: user.organizationId, evidence: { requestId, count, action } });
  if (evaluation.decision === "DENY") {
    const denied = await cache.increment(`sentinel:denied:${user.userId}`, 900);
    if (denied >= 5) await createAlert({ rule: "REPEATED_DENIED_REQUESTS", severity: "CRITICAL", title: "Repeated authorization denials", reason: "Multiple denied requests occurred inside the detection window.", actorUserId: user.userId, organizationId: user.organizationId, evidence: { requestId, denied, patientId: patient.patientId } });
  }
  const hour = new Date().getHours();
  if (hour >= 22 || hour < 6) await createAlert({ rule: "OFF_HOURS_ACCESS", severity: evaluation.decision === "DENY" ? "HIGH" : "MEDIUM", title: "Off-hours access", reason: "Clinical data activity occurred outside the configured operating window.", actorUserId: user.userId, organizationId: user.organizationId, evidence: { requestId, hour, patientId: patient.patientId } });
  if (evaluation.layers.find((item) => item.key === "abac")?.reason === "Organization mismatch") await createAlert({ rule: "CROSS_ORGANIZATION_ACTIVITY", severity: "CRITICAL", title: "Cross-organization activity", reason: "The requester organization did not match the patient organization.", actorUserId: user.userId, organizationId: user.organizationId, evidence: { requestId, patientOrganizationId: patient.organizationId } });
};

export const acknowledgeAlert = async (alertId, user) => SentinelAlert.findOneAndUpdate({ alertId }, { $set: { status: "ACKNOWLEDGED", acknowledgedAt: new Date(), acknowledgedByUserId: user.userId } }, { new: true }).lean();

