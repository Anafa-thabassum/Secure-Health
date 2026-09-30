import { getConfig } from "../config/env.js";
import { MailOutbox } from "../models/MailOutbox.js";
import { ids } from "../utils/ids.js";

export const queueEmail = async ({ to, template, data }) => MailOutbox.create({
  messageId: `MAIL-${ids.session().slice(0, 12).toUpperCase()}`,
  to,
  from: getConfig().email.from,
  template,
  data,
});

// Provider-neutral outbox worker. A production adapter can replace this function
// without changing controllers or authentication flows.
export const processMailOutbox = async (send = async () => {}) => {
  const rows = await MailOutbox.find({ status: "PENDING", attempts: { $lt: 5 } }).sort({ createdAt: 1 }).limit(25);
  for (const row of rows) {
    try {
      await send({ to: row.to, from: row.from, template: row.template, data: row.data });
      row.status = "SENT"; row.sentAt = new Date(); row.attempts += 1;
    } catch (error) {
      row.status = row.attempts >= 4 ? "FAILED" : "PENDING"; row.attempts += 1; row.lastError = error.message;
    }
    await row.save();
  }
  return rows.length;
};

