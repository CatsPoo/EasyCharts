import z from "zod";
import { UserCreateSchema, UserSchema, UserUpdateSchema } from "../schemas/user.schemas.js";

export type UserCreate = z.infer<typeof UserCreateSchema>;
export type UserUpdate = z.infer<typeof UserUpdateSchema>;
export type User = z.infer<typeof UserSchema>;
