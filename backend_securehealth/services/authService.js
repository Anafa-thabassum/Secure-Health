import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { User } from "../models/User.js";
import { RefreshSession } from "../models/RefreshSession.js";
import { PasswordResetToken } from "../models/PasswordResetToken.js";
import { EmailVerificationToken } from "../models/EmailVerificationToken.js";
import { getConfig } from "../config/env.js";
import { securityConfig } from "../config/security.js";
import { AppError } from "../utils/errors.js";
import { ids } from "../utils/ids.js";
import { createAccessToken, createRefreshToken, decodeExpiry, hashToken, verifyRefreshToken } from "./tokenService.js";
import { appendAuditEvent } from "./auditService.js";
import { queueEmail } from "./emailService.js";
import { createRefreshSession, listSessions, revokeAccessToken, revokeAllRefreshSessions, revokeRefreshToken, revokeSession } from "./sessionService.js";

const publicUser = (user) => ({ userId: user.userId, email: user.email, name: user.name, role: user.role, organizationId: user.organizationId, patientId: user.patientId, status: user.status });

const createSession = async (user, context) => {
  const sessionId = ids.session();
  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken(user, sessionId);
  await createRefreshSession({ sessionId, userId: user.userId, refreshToken, context });
  return { accessToken, refreshToken, expiresIn: 900 };
};

export const register = async (input, context) => {
  if (await User.exists({ email: input.email.toLowerCase() })) throw new AppError(409, "EMAIL_EXISTS", "An account with this email already exists");
  const passwordHash = await bcrypt.hash(input.password, securityConfig.password.bcryptRounds);
  const user = await User.create({
    userId: `USR-${ids.session().slice(0, 8).toUpperCase()}`,
    email: input.email.toLowerCase(), passwordHash, name: input.name,
    role: input.role || "PATIENT", organizationId: input.organizationId,
    patientId: input.patientId || null, status: "INVITED", passwordChangedAt: new Date(), sessionVersion: 1,
  });
  const verificationToken = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + getConfig().email.verificationTtlMinutes * 60_000);
  await EmailVerificationToken.create({ userId: user.userId, tokenHash: hashToken(verificationToken), expiresAt });
  await queueEmail({ to: user.email, template: "VERIFY_EMAIL", data: { userId: user.userId, verificationToken } });
  await appendAuditEvent({ requestId: context.requestId, actor: publicUser(user), patientId: user.patientId, organizationId: user.organizationId, resource: "User", action: "REGISTER", decision: "INFO", reason: "Account registered; email verification required", severity: "INFO", context });
  return { user: publicUser(user), verificationRequired: true, ...(getConfig().production ? {} : { developmentVerificationToken: verificationToken }) };
};

export const login = async (email, password, context) => {
  const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
  const valid = user && await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    await appendAuditEvent({ requestId: context.requestId, actor: { userId: "ANONYMOUS", email: String(email).toLowerCase() }, resource: "Authentication", action: "LOGIN", decision: "DENY", reason: "Invalid credentials", severity: "MEDIUM", context });
    throw new AppError(401, "INVALID_CREDENTIALS", "Email or password is incorrect");
  }
  if (user.status !== "ACTIVE") throw new AppError(403, "ACCOUNT_UNAVAILABLE", "This account is not active");
  if (!user.emailVerifiedAt) throw new AppError(403, "EMAIL_NOT_VERIFIED", "Verify your email before signing in");
  user.lastLoginAt = new Date();
  await user.save();
  const tokens = await createSession(user, context);
  await appendAuditEvent({ requestId: context.requestId, actor: publicUser(user), patientId: user.patientId, organizationId: user.organizationId, resource: "Authentication", action: "LOGIN", decision: "ALLOW", reason: "Credentials verified", severity: "INFO", context });
  return { user: publicUser(user), tokens };
};

export const refresh = async (token, context) => {
  let payload;
  try { payload = verifyRefreshToken(token); } catch { throw new AppError(401, "INVALID_REFRESH_TOKEN", "Refresh token is invalid or expired"); }
  const session = await RefreshSession.findOne({ sessionId: payload.sid, userId: payload.sub });
  if (!session || session.revokedAt || session.tokenHash !== hashToken(token)) throw new AppError(401, "REVOKED_REFRESH_TOKEN", "Refresh session is no longer valid");
  const user = await User.findOne({ userId: payload.sub });
  if (!user || user.status !== "ACTIVE" || payload.sv !== (user.sessionVersion || 1)) throw new AppError(401, "ACCOUNT_UNAVAILABLE", "Account or session is unavailable");
  session.revokedAt = new Date();
  const next = await createSession(user, context);
  const nextPayload = verifyRefreshToken(next.refreshToken);
  session.replacedBySessionId = nextPayload.sid;
  await session.save();
  return { user: publicUser(user), tokens: next };
};

export const logout = async ({ refreshToken, accessPayload, user, context }) => {
  await Promise.all([revokeRefreshToken(refreshToken), revokeAccessToken(accessPayload, "LOGOUT")]);
  if (user) await appendAuditEvent({ requestId: context.requestId, actor: publicUser(user), patientId: user.patientId, organizationId: user.organizationId, resource: "Authentication", action: "LOGOUT", decision: "INFO", reason: "Session revoked", severity: "INFO", context });
};

export const logoutAll = async (user, accessPayload, context) => {
  user.sessionVersion = (user.sessionVersion || 1) + 1;
  await Promise.all([user.save(), revokeAllRefreshSessions(user.userId), revokeAccessToken(accessPayload, "LOGOUT_ALL")]);
  await appendAuditEvent({ requestId: context.requestId, actor: publicUser(user), patientId: user.patientId, organizationId: user.organizationId, resource: "Authentication", action: "LOGOUT_ALL", decision: "INFO", reason: "All sessions revoked", severity: "MEDIUM", context });
  return { revoked: true };
};

export const verifyEmail = async (token, context) => {
  const row = await EmailVerificationToken.findOne({ tokenHash: hashToken(token), usedAt: null, expiresAt: { $gt: new Date() } });
  if (!row) throw new AppError(400, "VERIFICATION_TOKEN_INVALID", "Email verification token is invalid or expired");
  const user = await User.findOne({ userId: row.userId });
  if (!user) throw new AppError(400, "VERIFICATION_TOKEN_INVALID", "Email verification token is invalid or expired");
  row.usedAt = new Date(); user.emailVerifiedAt = new Date(); user.status = "ACTIVE";
  await Promise.all([row.save(), user.save()]);
  await appendAuditEvent({ requestId: context.requestId, actor: publicUser(user), patientId: user.patientId, organizationId: user.organizationId, resource: "Authentication", action: "EMAIL_VERIFIED", decision: "INFO", reason: "Email ownership verified", severity: "INFO", context });
  return { verified: true };
};

export const getSessions = (userId) => listSessions(userId);
export const removeSession = (userId, sessionId) => revokeSession(userId, sessionId);

export const requestPasswordReset = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase() }).lean();
  if (!user) return { accepted: true };
  const resetToken = crypto.randomBytes(32).toString("base64url");
  await PasswordResetToken.deleteMany({ userId: user.userId, usedAt: null });
  await PasswordResetToken.create({ userId: user.userId, tokenHash: hashToken(resetToken), expiresAt: new Date(Date.now() + 15 * 60_000) });
  return { accepted: true, ...(getConfig().production ? {} : { developmentResetToken: resetToken }) };
};

export const resetPassword = async (token, password, context) => {
  const row = await PasswordResetToken.findOne({ tokenHash: hashToken(token), usedAt: null, expiresAt: { $gt: new Date() } });
  if (!row) throw new AppError(400, "RESET_TOKEN_INVALID", "Password reset token is invalid or expired");
  const user = await User.findOne({ userId: row.userId });
  if (!user) throw new AppError(400, "RESET_TOKEN_INVALID", "Password reset token is invalid or expired");
  user.passwordHash = await bcrypt.hash(password, securityConfig.password.bcryptRounds); user.passwordChangedAt = new Date(); user.sessionVersion = (user.sessionVersion || 1) + 1;
  row.usedAt = new Date();
  await Promise.all([user.save(), row.save(), RefreshSession.updateMany({ userId: user.userId, revokedAt: null }, { $set: { revokedAt: new Date() } })]);
  await appendAuditEvent({ requestId: context.requestId, actor: publicUser(user), patientId: user.patientId, organizationId: user.organizationId, resource: "Authentication", action: "PASSWORD_RESET", decision: "INFO", reason: "Password changed and active refresh sessions revoked", severity: "MEDIUM", context });
  return { changed: true };
};

export const sanitizeUser = publicUser;
