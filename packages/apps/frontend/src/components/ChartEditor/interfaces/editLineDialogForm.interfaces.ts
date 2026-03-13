import { LineTypeEnum } from "@easy-charts/easycharts-types";
import z from "zod";

 export const EditLineDialogFormSchema = z.object({
   id: z.string(),
   label: z.string(),
   type:LineTypeEnum
 });

export type EditLineDialogFormResponse =z.infer<typeof EditLineDialogFormSchema>;