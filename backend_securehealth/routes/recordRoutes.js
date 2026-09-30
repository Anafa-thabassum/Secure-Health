import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { get } from "../controllers/recordController.js";

const router = Router();
router.use(authenticate);
router.get("/:recordId", asyncHandler(get));
export default router;

