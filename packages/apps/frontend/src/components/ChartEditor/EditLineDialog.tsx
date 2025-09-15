import { zodResolver } from "@hookform/resolvers/zod";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    TextField,
} from "@mui/material";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { Edge } from "reactflow";
import { EditLineDialogFormSchema, type EditLineDialogFormRespone } from "./interfaces/editLineDialogForm.interfaces";

interface EditLineDialofProps {
  isOpen: boolean;
  line: Edge | null;
  onClose: () => void;
  onSubmit: (data: EditLineDialogFormRespone) => void;
}
export function EditLineDialog({
  isOpen,
  line,
  onSubmit,
  onClose,
}: EditLineDialofProps) {
  const schema = EditLineDialogFormSchema

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues : {
        id:"",
        label:""
    } as EditLineDialogFormRespone,

    mode: "onSubmit",
  });

  useEffect(() => {
    if (isOpen && line) {
      reset({
        id: line.id,
        // Edge.label can be ReactNode; coerce to string safely
        label: String(line.label ?? ""),
      });
    }
  }, [isOpen, line, reset]);

  if (!isOpen || !line) return null;

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Edit Line</DialogTitle>
      <form
        onSubmit={handleSubmit(onSubmit, (errs) =>
          console.error("Form validation failed:", errs)
        )}
        noValidate
      >
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <input type="hidden" {...register("id")} />
            <TextField
              label="label"
              {...register("label")}
              helperText={errors.name?.message as string}
              error={!!errors.name}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} variant="outlined">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            Save
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
