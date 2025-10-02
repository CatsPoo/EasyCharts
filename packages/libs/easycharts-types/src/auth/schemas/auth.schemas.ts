import z from "zod";

export const LoginPayloadSchema = z.object({
  username: z.string().min(1),
  password:z.string().min(6)
});
