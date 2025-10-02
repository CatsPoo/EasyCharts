import z from "zod";
import { BondSchema } from "../../lines/index.js";
import { PositionSchema } from "./position.schema.js";

export const BondOnChartSchema = z.object({
  chartId: z.string().uuid(),
  bond: BondSchema,
  position: PositionSchema,
  autoPosition:z.boolean,
});