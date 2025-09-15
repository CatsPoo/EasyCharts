import z from "zod";

 export const EditLineDialogFormSchema = z.object({
   id: z.string(),
   label: z.string(),
 });

export type EditLineDialogFormRespone =z.infer<typeof EditLineDialogFormSchema>;