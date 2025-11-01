import { IdentifiableSchema } from "src/generic.schema.js";
import z from "zod";

export const BaseChartsDirectorySchema = z.object({
  directoryId: z.ulid(),
  createdAt: z.date(),
  createdByUserId: z.uuid(),
  description: z.string()
});

export const CreateChartDirectorySchema = BaseChartsDirectorySchema
export const UpdateChartsDirectory = BaseChartsDirectorySchema.partial()
export const ChartsDirectorySchema = BaseChartsDirectorySchema.extend(IdentifiableSchema)