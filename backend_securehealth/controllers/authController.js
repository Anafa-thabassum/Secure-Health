import * as authService from "../services/authService.js";

const context = (req) => ({ requestId: req.requestId, ip: req.ip, userAgent: req.get("user-agent") || "unknown" });

export const register = async (req, res) => res.status(201).json({ data: await authService.register(req.body, context(req)) });
export const login = async (req, res) => res.json({ data: await authService.login(req.body.email, req.body.password, context(req)) });
export const refresh = async (req, res) => res.json({ data: await authService.refresh(req.body.refreshToken, context(req)) });
export const logout = async (req, res) => { await authService.logout(req.body.refreshToken); res.status(204).end(); };
export const me = async (req, res) => res.json({ data: authService.sanitizeUser(req.user) });
export const forgotPassword = async (req, res) => res.json({ data: await authService.requestPasswordReset(req.body.email) });
export const resetPassword = async (req, res) => res.json({ data: await authService.resetPassword(req.body.token, req.body.password, context(req)) });
