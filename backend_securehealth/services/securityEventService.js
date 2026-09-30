import { SecurityEvent } from "../models/SecurityEvent.js";
import { ids } from "../utils/ids.js";
import { publishSecurityEvent } from "./eventBus.js";

export const recordSecurityEvent = async (input) => {
  const event = await SecurityEvent.create({ securityEventId: ids.security(), ...input });
  const payload = event.toJSON();
  publishSecurityEvent(payload);
  return payload;
};

