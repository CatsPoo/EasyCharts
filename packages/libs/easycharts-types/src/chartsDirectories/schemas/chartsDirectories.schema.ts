import { ChartMetadataSchema } from "dist/index.js";
import { AuditableSchema, IdentifiableSchema } from "../../generic.schema.js";
import z from "zod";

export const BaseChartsDirectorySchema = z.object({
  name: z.string().min(1),
  parentId: z.string().uuid().nullable().default(null),
  description: z.string().default(""),
});

export const CreateChartDirectorySchema = BaseChartsDirectorySchema;
export const UpdateChartsDirectorySchema = BaseChartsDirectorySchema.partial();

export const ChartsDirectorySchema = BaseChartsDirectorySchema
  .extend(IdentifiableSchema.shape)
  .extend(AuditableSchema.shape);

export const ChartDirectoryFullContentSchema = z.object({
  subDirectories:z.array(ChartsDirectorySchema),
  chartsMetadata:z.array(ChartMetadataSchema)
})
// Sharing schemas
export const ShareWithUserSchema = z.object({
  sharedWithUserId: z.string().uuid(),
  canEdit: z.boolean().default(false),
  canDelete: z.boolean().default(false),
  canShare: z.boolean().default(false),
});

export const ChartShareSchema = ShareWithUserSchema.extend({
  chartId: z.string().uuid(),
  sharedByUserId: z.string().uuid(),
});

export const DirectoryShareSchema = ShareWithUserSchema.extend({
  directoryId: z.string().uuid(),
  sharedByUserId: z.string().uuid(),
});

export const ShareDirectoryRequestSchema = ShareWithUserSchema.extend({
  includeContent: z.boolean().default(false),
});