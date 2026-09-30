import { EventEmitter } from "node:events";

export const eventBus = new EventEmitter();
eventBus.setMaxListeners(50);

export const publishSecurityEvent = (event) => eventBus.emit("security-event", event);

