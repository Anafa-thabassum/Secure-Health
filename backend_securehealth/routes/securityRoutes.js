import { Router } from "express";
import { authenticate, authorizeRoles } from "../middleware/authenticate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as controller from "../controllers/securityController.js";

const router = Router();
router.use(authenticate, authorizeRoles("ADMINISTRATOR", "AUDITOR"));
router.get("/events", asyncHandler(controller.events));
router.get("/metrics", asyncHandler(controller.metrics));
export default router;

