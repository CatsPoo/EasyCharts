import z from "zod";
import { LockState } from "../enums/chartsLocks.enums.js";

export const LockStateSchema = z.enum(Object.values(LockState));

export const ChartLockSchema = z.object({
  chartId: z.string(),
  state: LockStateSchema,
  lockedById: z.string(),
  lockedByName: z.string(),
  lockedAt: Date,
});