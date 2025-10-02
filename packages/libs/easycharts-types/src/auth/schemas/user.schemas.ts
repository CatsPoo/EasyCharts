import { IdentifiableSchema } from "../../generic.schema.js";
import z from "zod";
import { Permission } from "../enums/permitions.enums.js";

export const PermissionsEnumSchema = z.enum(Object.values(Permission));

export const UserBaseSchema = z.object({
  username: z.string().min(1),
  displayName : z.string(),
  isActive : z.boolean(),
  permissions: z.array(PermissionsEnumSchema),
  refreshTokenHash : z.string()
});

export const UserCreateSchema = UserBaseSchema.extend({
  password: z.string()
})

export const UserUpdateSchema = UserCreateSchema.partial()

export const UserSchema = UserBaseSchema.extend(IdentifiableSchema.shape)

