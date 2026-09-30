import { Router } from "express";
import { authenticate, authorizeRoles } from "../middleware/authenticate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as controller from "../controllers/auditController.js";

const router = Router();
router.use(authenticate, authorizeRoles("ADMINISTRATOR", "AUDITOR"));
router.get("/", asyncHandler(controller.list));
router.get("/integrity", asyncHandler(controller.integrity));
router.get("/:eventId", asyncHandler(controller.get));
export default router;

