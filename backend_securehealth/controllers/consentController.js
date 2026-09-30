import { grantConsent, listConsents, revokeConsent } from "../services/consentService.js";

const context = (req) => ({ requestId: req.requestId, ip: req.ip, userAgent: req.get("user-agent") });
export const list = async (req, res) => res.json({ data: await listConsents(req.user, req.query) });
export const grant = async (req, res) => res.status(201).json({ data: await grantConsent(req.body, req.user, context(req)) });
export const revoke = async (req, res) => res.json({ data: await revokeConsent(req.params.consentId, req.user, context(req)) });

