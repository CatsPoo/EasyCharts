import z from "zod";
import {ChartLockSchema } from "../schemas/chartsLocks.schema.js";

export type ChartLock = z.infer<typeof ChartLockSchema>;