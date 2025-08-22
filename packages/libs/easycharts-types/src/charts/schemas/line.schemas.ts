import z from "zod";

export const LineTypeEnum = z.enum([
  "straight",
  "step",
  "smoothstep",
  "bezier",
  "simplebezier",
]);

export const LineCreateSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().min(1).optional(),
  type: LineTypeEnum.default("smoothstep"),
  sourceDeviceId: z.string().uuid(),
  targetDeviceId: z.string().uuid(),
});

export const LineUpdateSchema = LineCreateSchema.partial();

export const LineSchema = z.object({
  id: z.string().uuid(),
  label: z.string().nullable().optional()
    .transform(v => (v ?? undefined)),
  type: LineTypeEnum,
  sourceDeviceId: z.string().uuid(),
  targetDeviceId: z.string().uuid(),
  sourceHamdleId: z.string().uuid(),
  targetHandleId: z.string().uuid(),
});