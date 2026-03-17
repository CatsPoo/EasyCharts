import z from "zod";
import { IdentifiableSchema } from "../../generic.schema.js";

export const GroupBaseSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(""),
});

export const CreateGroupSchema = GroupBaseSchema;
export const UpdateGroupSchema = GroupBaseSchema.partial();

export const GroupSchema = GroupBaseSchema.extend(IdentifiableSchema.shape).extend({
  createdByUserId: z.string().uuid(),
  createdAt: z.date(),
  memberCount: z.number().default(0),
});

export const AddGroupMemberSchema = z.object({
  userId: z.string().uuid(),
});

// Group sharing schemas
export const ShareWithGroupSchema = z.object({
  sharedWithGroupId: z.string().uuid(),
  canEdit: z.boolean().default(false),
  canDelete: z.boolean().default(false),
  canShare: z.boolean().default(false),
});

export const GroupChartShareSchema = ShareWithGroupSchema.extend({
  chartId: z.string().uuid(),
  sharedByUserId: z.string().uuid(),
});

export const GroupDirectoryShareSchema = ShareWithGroupSchema.extend({
  directoryId: z.string().uuid(),
  sharedByUserId: z.string().uuid(),
});

export const ShareDirectoryWithGroupRequestSchema = ShareWithGroupSchema.extend({
  includeContent: z.boolean().default(false),
});
