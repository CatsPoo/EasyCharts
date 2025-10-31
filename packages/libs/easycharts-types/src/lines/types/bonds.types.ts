import z from "zod";
import { BondCreateSchema, BondSchema, BondUpdateSchema } from "../shemas/bonds.schemas.js";

export type BondCreate = z.infer<typeof BondCreateSchema>;
export type BondUpdate = z.infer<typeof BondUpdateSchema>;
export type Bond = z.infer<typeof BondSchema>;