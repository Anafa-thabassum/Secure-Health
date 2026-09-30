import { Router } from "express";
import { SentinelAlert } from "../models/SentinelAlert.js";
import { authenticate, authorizeRoles } from "../middleware/authenticate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { acknowledgeAlert, detectionRules } from "../services/sentinelService.js";
import { notFound } from "../utils/errors.js";

const router = Router();
router.use(authenticate, authorizeRoles("ADMIN", "AUDITOR"));
router.get("/rules", (_req, res) => res.json({ data: detectionRules }));
router.get("/alerts", asyncHandler(async (req, res) => {
  const query = req.query.status ? { status: req.query.status } : {};
  res.json({ data: await SentinelAlert.find(query).sort({ createdAt: -1 }).limit(200).lean() });
}));
router.post("/alerts/:alertId/acknowledge", asyncHandler(async (req, res) => {
  const alert = await acknowledgeAlert(req.params.alertId, req.user);
  if (!alert) throw notFound("Sentinel alert");
  res.json({ data: alert });
}));

export default router;
