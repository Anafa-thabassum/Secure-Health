export const securityConfig = {
  maxPayloadSize: "1mb",
  rateLimit: { windowMs: 15 * 60 * 1000, max: 300 },
  authRateLimit: { windowMs: 15 * 60 * 1000, max: 20 },
  password: { minLength: 12, bcryptRounds: 12 },
  breakGlassDurations: [5, 15, 30],
  allowedPurposes: ["treatment", "care-coordination", "billing", "operations", "emergency"],
};
