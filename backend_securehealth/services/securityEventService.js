import { SecurityEvent } from "../models/SecurityEvent.js";
import { ids } from "../utils/ids.js";
import { publishSecurityEvent } from "./eventBus.js";
import { isPushSeverity } from "./pushPolicy.js";

export const recordSecurityEvent = async (input) => {
  const shouldPush = isPushSeverity(input.severity);
  const event = await SecurityEvent.create({
    securityEventId: ids.security(),
    ...input,
    notification: {
      status: shouldPush ? "PENDING" : "NOT_REQUIRED",
      attempts: 0,
      nextAttemptAt: shouldPush ? new Date() : null,
      deliveries: [],
    },
  });
  const payload = event.toJSON();
  publishSecurityEvent(payload);
  return payload;
};

