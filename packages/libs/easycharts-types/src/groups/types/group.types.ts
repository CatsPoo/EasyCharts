import type z from "zod";
import type {
  AddGroupMemberSchema,
  CreateGroupSchema,
  GroupChartShareSchema,
  GroupDirectoryShareSchema,
  GroupSchema,
  ShareDirectoryWithGroupRequestSchema,
  ShareWithGroupSchema,
  UpdateGroupSchema,
} from "../schemas/group.schemas.js";

export type Group = z.infer<typeof GroupSchema>;
export type CreateGroup = z.infer<typeof CreateGroupSchema>;
export type UpdateGroup = z.infer<typeof UpdateGroupSchema>;
export type AddGroupMember = z.infer<typeof AddGroupMemberSchema>;
export type ShareWithGroup = z.infer<typeof ShareWithGroupSchema>;
export type GroupChartShare = z.infer<typeof GroupChartShareSchema>;
export type GroupDirectoryShare = z.infer<typeof GroupDirectoryShareSchema>;
export type ShareDirectoryWithGroupRequest = z.infer<typeof ShareDirectoryWithGroupRequestSchema>;
