import { Router } from "express";
import { z } from "zod";
import * as controller from "../controllers/authController.js";
import { authenticate } from "../middleware/authenticate.js";
import { authRateLimiter } from "../middleware/rateLimiter.js";
import { validate } from "../middleware/validateRequest.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
const password = z.string().min(12).max(128);
router.post("/register", authRateLimiter, validate(z.object({ name: z.string().min(2).max(100), email: z.string().email(), password, role: z.literal("PATIENT").default("PATIENT"), organizationId: z.string().min(2).max(64), patientId: z.string().max(64).optional() }).strict()), asyncHandler(controller.register));
router.post("/login", authRateLimiter, validate(z.object({ email: z.string().email(), password }).strict()), asyncHandler(controller.login));
router.post("/refresh", authRateLimiter, validate(z.object({ refreshToken: z.string().min(20) }).strict()), asyncHandler(controller.refresh));
router.post("/logout", authenticate, validate(z.object({ refreshToken: z.string().optional() }).strict()), asyncHandler(controller.logout));
router.post("/logout-all", authenticate, asyncHandler(controller.logoutAll));
router.post("/verify-email", authRateLimiter, validate(z.object({ token: z.string().min(20) }).strict()), asyncHandler(controller.verifyEmail));
router.post("/forgot-password", authRateLimiter, validate(z.object({ email: z.string().email() }).strict()), asyncHandler(controller.forgotPassword));
router.post("/reset-password", authRateLimiter, validate(z.object({ token: z.string().min(20), password }).strict()), asyncHandler(controller.resetPassword));
router.get("/me", authenticate, asyncHandler(controller.me));
router.get("/sessions", authenticate, asyncHandler(controller.sessions));
router.delete("/sessions/:sessionId", authenticate, asyncHandler(controller.revokeSession));

export default router;
