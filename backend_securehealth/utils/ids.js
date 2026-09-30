import crypto from "node:crypto";

const short = () => crypto.randomBytes(4).toString("hex").toUpperCase();
export const ids = {
  request: () => `REQ-${short()}`,
  event: () => `AUD-${short()}`,
  security: () => `SEC-${short()}`,
  consent: () => `CON-${short()}`,
  breakGlass: () => `BRK-${short()}`,
  alert: () => `SEN-${short()}`,
  fhir: () => `FHIR-${short()}`,
  session: () => crypto.randomUUID(),
};

