import { z } from "zod";

export const ChartVersionMetaSchema = z.object({
  id: z.string().uuid(),
  chartId: z.string().uuid(),
  versionNumber: z.number().int(),
  label: z.string().nullable(),
  savedAt: z.coerce.date(),
  savedByUserId: z.string().uuid(),
  savedByUsername: z.string().nullable(),
});

export type ChartVersionMeta = z.infer<typeof ChartVersionMetaSchema>;

export const ChartVersionSchema = ChartVersionMetaSchema.extend({
  snapshot: z.unknown(),
});

export type ChartVersion = z.infer<typeof ChartVersionSchema>;

export const AssetVersionMetaSchema = z.object({
  id: z.string().uuid(),
  assetId: z.string().uuid(),
  assetKind: z.enum(["devices", "types", "models", "vendors", "clouds"]),
  versionNumber: z.number().int(),
  savedAt: z.coerce.date(),
  savedByUserId: z.string().uuid(),
  savedByUsername: z.string().nullable(),
});

export type AssetVersionMeta = z.infer<typeof AssetVersionMetaSchema>;

export const AssetVersionSchema = AssetVersionMetaSchema.extend({
  snapshot: z.unknown(),
});

export type AssetVersion = z.infer<typeof AssetVersionSchema>;
