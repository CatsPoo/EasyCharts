import z from "zod";
import { PositionSchema } from "../../charts/schemas/position.schema.js";
import { OverlayElementSchema } from "./overlayElement.schemas.js";

export const OverlayElementOnChartSchema = z.object({
  id: z.string().uuid(),
  overlayElementId: z.string().uuid(),
  overlayElement: OverlayElementSchema,
  position: PositionSchema,
  freeText: z.string().default(""),
  size: z
    .object({ width: z.number().positive(), height: z.number().positive() })
    .default({ width: 120, height: 120 }),
});

export const OverlayEdgeOnChartSchema = z.object({
  id: z.string().uuid(),
  sourceNodeId: z.string(),
  sourceHandle: z.string(),
  targetNodeId: z.string(),
  targetHandle: z.string(),
  sourcePortId: z.string().uuid().optional(),
  targetPortId: z.string().uuid().optional(),
});
