import z from "zod";
import { PositionSchema } from "../../charts/schemas/position.schema.js";
import { CustomElementSchema } from "./customElement.schemas.js";

export const CustomElementEdgeOnChartSchema = z.object({
  id: z.string().uuid(),
  sourceNodeId: z.string(),
  sourceHandle: z.string(),
  targetNodeId: z.string(),
  targetHandle: z.string(),
  // Set when the respective node is a device (to track port-inUse state)
  sourcePortId: z.string().uuid().optional(),
  targetPortId: z.string().uuid().optional(),
});

export const CustomElementOnChartSchema = z.object({
  id: z.string().uuid(),
  customElementId: z.string().uuid(),
  customElement: CustomElementSchema,
  position: PositionSchema,
  freeText: z.string().default(""),
  size: z
    .object({ width: z.number().positive(), height: z.number().positive() })
    .default({ width: 120, height: 120 }),
});
