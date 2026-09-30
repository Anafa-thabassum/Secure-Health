import { z } from "zod";

export const strictObject = (shape) => z.object(shape).strict();
export const identifier = z.string().trim().min(2).max(128).regex(/^[A-Za-z0-9._:-]+$/);
export const purpose = z.enum(["treatment", "care-coordination", "billing", "operations", "emergency"]);
export const sensitivity = z.enum(["STANDARD", "RESTRICTED", "HIGHLY_RESTRICTED"]);

