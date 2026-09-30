import { BreakGlassSession } from "../models/BreakGlassSession.js";
import { activateBreakGlass, endBreakGlass, reviewBreakGlass } from "../services/breakGlassService.js";

const context = (req) => ({ requestId: req.requestId, ip: req.ip, userAgent: req.get("user-agent") });
export const list = async (req, res) => {
  const query = req.user.role === "DOCTOR" ? { doctorUserId: req.user.userId } : {};
  res.json({ data: await BreakGlassSession.find(query).sort({ createdAt: -1 }).lean() });
};
export const activate = async (req, res) => res.status(201).json({ data: await activateBreakGlass(req.body, req.user, context(req)) });
export const end = async (req, res) => res.json({ data: await endBreakGlass(req.params.breakGlassId, req.user, context(req)) });
export const review = async (req, res) => res.json({ data: await reviewBreakGlass(req.params.breakGlassId, req.body, req.user, context(req)) });

