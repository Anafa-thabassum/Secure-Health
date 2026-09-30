import * as authService from "../services/authService.js";

const context = (req) => ({ requestId: req.requestId, ip: req.ip, userAgent: req.get("user-agent") || "unknown" });

export const register = async (req, res) => res.status(201).json({ data: await authService.register(req.body, context(req)) });
export const login = async (req, res) => res.json({ data: await authService.login(req.body.email, req.body.password, context(req)) });
export const refresh = async (req, res) => res.json({ data: await authService.refresh(req.body.refreshToken, context(req)) });
export const logout = async (req, res) => { await authService.logout({ refreshToken: req.body.refreshToken, accessPayload: req.auth?.payload, user: req.user, context: context(req) }); res.status(204).end(); };
export const logoutAll = async (req, res) => res.json({ data: await authService.logoutAll(req.user, req.auth.payload, context(req)) });
export const verifyEmail = async (req, res) => res.json({ data: await authService.verifyEmail(req.body.token, context(req)) });
export const sessions = async (req, res) => res.json({ data: await authService.getSessions(req.user.userId) });
export const revokeSession = async (req, res) => res.json({ data: await authService.removeSession(req.user.userId, req.params.sessionId) });
export const me = async (req, res) => res.json({ data: authService.sanitizeUser(req.user) });
export const forgotPassword = async (req, res) => res.json({ data: await authService.requestPasswordReset(req.body.email) });
export const resetPassword = async (req, res) => res.json({ data: await authService.resetPassword(req.body.token, req.body.password, context(req)) });
