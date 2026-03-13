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
import { LineTypeEnum, StrokeTypeEnum } from "@easy-charts/easycharts-types";

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
      type: "straight",
      strokeType: undefined,
    },
    mode: "onSubmit",
  });

  const typeValue = watch("type");
  const strokeTypeValue = watch("strokeType");

  useEffect(() => {
    if (isOpen && line) {
      reset({
        id: line.id,
        label: typeof line.label === "string" ? line.label : "",
        type: (line.type ?? "step") as EditLineDialogFormResponse["type"],
        strokeType: line.data?.strokeType as EditLineDialogFormResponse["strokeType"],
      });
    }
  }, [isOpen, line, reset]);

  if (!isOpen || !line) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Line</DialogTitle>
      <form
        key={line.id}
        onSubmit={handleSubmit(onSubmit, (errs) =>
          console.error("Form validation failed:", errs)
        )}
        noValidate
      >
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <input type="hidden" {...register("id")} />

            <TextField
              label="Label"
              fullWidth
              {...register("label")}
              helperText={errors.label?.message}
              error={!!errors.label}
            />

            <TextField
              select
              label="Line Type"
              fullWidth
              {...register("type")}
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

            <TextField
              select
              label="Stroke Style"
              fullWidth
              {...register("strokeType")}
              value={strokeTypeValue ?? ""}
              error={!!errors.strokeType}
              helperText={errors.strokeType?.message}
            >
              <MenuItem value="">Default (Solid)</MenuItem>
              {StrokeTypeEnum.options.map((option) => (
                <MenuItem key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1).replace("-", " ")}
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
