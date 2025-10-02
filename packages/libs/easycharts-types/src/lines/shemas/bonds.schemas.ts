import z from "zod";

export const BondCreateSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string(),
  membersLines:z.array(z.string().uuid())
});

export const BondUpdateSchema = BondCreateSchema.partial().omit({id:true});

export const BondSchema = BondCreateSchema