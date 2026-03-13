import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  MenuItem,
} from "@mui/material";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { Edge } from "reactflow";
import { 
  EditLineDialogFormSchema, 
  type EditLineDialogFormResponse 
} from "./interfaces/editLineDialogForm.interfaces";
import { LineTypeEnum } from "@easy-charts/easycharts-types";

interface EditLineDialogProps {
  isOpen: boolean;
  line: Edge | null;
  onClose: () => void;
  onSubmit: (data: EditLineDialogFormResponse) => void;
}

export function EditLineDialog({
  isOpen,
  line,
  onSubmit,
  onClose,
}: EditLineDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EditLineDialogFormResponse>({
    resolver: zodResolver(EditLineDialogFormSchema),
    defaultValues: {
      id: "",
      label: "",
      type: "straight", // Base fallback
    },
    mode: "onSubmit",
  });

  // This "watches" the form state so the MUI Select stays in sync
  const typeValue = watch("type");

  useEffect(() => {
    if (isOpen && line) {
      reset({
        id: line.id,
        label: typeof line.label === "string" ? line.label : "",
        // Look for the type in line.data, fallback to 'straight' if missing
        type: line.data?.type ?? "straight",
      });
    }
  }, [isOpen, line, reset]);

  if (!isOpen || !line) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Line</DialogTitle>
      <form
        // The 'key' ensures that if you switch from Line A to Line B, 
        // the form completely remounts with the new data.
        key={line.id}
        onSubmit={handleSubmit(onSubmit, (errs) =>
          console.error("Form validation failed:", errs)
        )}
        noValidate
      >
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* Hidden ID field */}
            <input type="hidden" {...register("id")} />

            {/* Label Field */}
            <TextField
              label="Label"
              fullWidth
              {...register("label")}
              helperText={errors.label?.message}
              error={!!errors.label}
            />

            {/* Line Type Select Box */}
            <TextField
              select
              label="Line Type"
              fullWidth
              {...register("type")}
              // Linking the visual value to the watched form state
              value={typeValue} 
              error={!!errors.type}
              helperText={errors.type?.message}
            >
              {LineTypeEnum.options.map((option) => (
                <MenuItem key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} variant="outlined">
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={isSubmitting}
          >
            Save Changes
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}