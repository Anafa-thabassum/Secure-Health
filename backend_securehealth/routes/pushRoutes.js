import { Router } from "express";
import { z } from "zod";
import { authenticate, authorizeRoles } from "../middleware/authenticate.js";
import { validate } from "../middleware/validateRequest.js";
import { listDevices, registerDevice, revokeDevice } from "../services/pushService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
const registration = z.object({
  platform: z.enum(["ANDROID", "IOS"]),
  token: z.string().trim().min(20).max(4_096),
  deviceId: z.string().trim().min(1).max(200).optional(),
  label: z.string().trim().min(1).max(100).optional(),
  appId: z.string().trim().min(1).max(200).optional(),
}).strict();

router.use(authenticate, authorizeRoles("ADMINISTRATOR", "AUDITOR"));
router.get("/devices", asyncHandler(async (req, res) => {
  res.json({ data: await listDevices(req.user) });
}));
router.post("/devices", validate(registration), asyncHandler(async (req, res) => {
  res.status(201).json({ data: await registerDevice(req.user, { ...req.body, requestId: req.requestId }) });
}));
router.delete("/devices/:registrationId", asyncHandler(async (req, res) => {
  res.json({ data: await revokeDevice(req.user, req.params.registrationId, req.requestId) });
}));

export default router;
