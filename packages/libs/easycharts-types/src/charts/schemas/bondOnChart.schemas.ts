import z from "zod";
import { BondSchema } from "../../lines/index.js";

export const BondOnChartSchema = z.object({
  chartId: z.string().uuid(),
  bond: BondSchema,
});