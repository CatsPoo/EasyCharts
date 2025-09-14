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
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import type { Edge } from "reactflow";
import z from "zod";

interface EditLineDialofProps {
  isEditlineDialogOpen: boolean;
  line: Edge;
  onClose: () => void;
  onSubmit: (data: any) => void;
}
export function EditLineDialog({
  isEditlineDialogOpen,
  line,
  onSubmit,
  onClose,
}: EditLineDialofProps) {
  const schema = z.object({
    label: z.string().min(1),
  });

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: line.label,
    mode: "onSubmit",
  });

  const onEditLineDialogSubmit = useCallback(() => {
    return;
  }, []);

  const onEditLineDialogClose = useCallback(() => {
    return;
  }, []);

  return (
    <Dialog
      open={isEditlineDialogOpen}
      onClose={onEditLineDialogClose}
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
            {line?.id && <input type="hidden" {...register("id")} />}
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
