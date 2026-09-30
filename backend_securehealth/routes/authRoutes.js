import { Router } from "express";
import { z } from "zod";
import * as controller from "../controllers/authController.js";
import { authenticate } from "../middleware/authenticate.js";
import { authRateLimiter } from "../middleware/rateLimiter.js";
import { validate } from "../middleware/validateRequest.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
const password = z.string().min(12).max(128);
router.post("/register", authRateLimiter, validate(z.object({ name: z.string().min(2).max(100), email: z.string().email(), password, role: z.literal("PATIENT").default("PATIENT"), organizationId: z.string().min(2).max(64), patientId: z.string().max(64).optional() })), asyncHandler(controller.register));
router.post("/login", authRateLimiter, validate(z.object({ email: z.string().email(), password })), asyncHandler(controller.login));
router.post("/refresh", authRateLimiter, validate(z.object({ refreshToken: z.string().min(20) })), asyncHandler(controller.refresh));
router.post("/logout", validate(z.object({ refreshToken: z.string().optional() })), asyncHandler(controller.logout));
router.post("/forgot-password", authRateLimiter, validate(z.object({ email: z.string().email() })), asyncHandler(controller.forgotPassword));
router.post("/reset-password", authRateLimiter, validate(z.object({ token: z.string().min(20), password })), asyncHandler(controller.resetPassword));
router.get("/me", authenticate, asyncHandler(controller.me));

export default router;
