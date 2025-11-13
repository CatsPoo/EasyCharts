import { AuditableSchema, IdentifiableSchema } from "../../generic.schema.js";
import z from "zod";

export const BaseChartsDirectorySchema = z.object({
  name:z.string(),
  parentId:z.ulid().nullable().default(null),
  childrensIds:z.array(z.uuid()).default([]),
  chartsIds:z.array(z.uuid()).default([]),
  description: z.string()
});

export const CreateChartDirectorySchema = BaseChartsDirectorySchema
export const UpdateChartsDirectorySchema = CreateChartDirectorySchema.partial()

export const ChartsDirectorySchema = BaseChartsDirectorySchema.extend(IdentifiableSchema.shape).extend(AuditableSchema.shape)