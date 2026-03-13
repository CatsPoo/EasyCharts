import { LineTypeEnum, StrokeTypeEnum } from "@easy-charts/easycharts-types";
import z from "zod";

 export const EditLineDialogFormSchema = z.object({
   id: z.string(),
   label: z.string(),
   type: LineTypeEnum,
   strokeType: z.union([StrokeTypeEnum, z.literal("")]).optional().transform(v => v === "" ? undefined : v),
 });

export type EditLineDialogFormResponse =z.infer<typeof EditLineDialogFormSchema>;