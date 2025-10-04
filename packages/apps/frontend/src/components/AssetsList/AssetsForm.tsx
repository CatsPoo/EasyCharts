// AssetForm.tsx (patch)
import { type AssetKind, type AssetMap } from "@easy-charts/easycharts-types";
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
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import z from "zod";
import { AssetsSelectionList } from "./AsetsSelectionList.component";


const schemas = {
  devices: z.object({
    name: z.string().min(1),
    typeId: z.string().min(1),
    modelId: z.string().min(1),
    ipAddress: z.ipv4(),
  }),
  types: z.object({
    name: z.string().min(1),
  }),
  models: z.object({
    name: z.string().min(1),
    vendorId: z.string().min(1),
    image: z.file().mime(["image/png", "image/jpeg"]).optional(),
  }),
  vendors: z.object({
    name: z.string().min(1),
  }),
} as const;
type Props<K extends AssetKind> = {
  kind: K;
  open: boolean;
  initial?: Partial<AssetMap[K]>;
  onClose: () => void;
  onSubmit: (data: any) => void;
};

export function AssetForm<K extends AssetKind>({
  kind,
  open,
  initial,
  onClose,
  onSubmit,
}: Props<K>) {
  const schema = schemas[kind] as any;

  function mapDefaults(kind: AssetKind, initial: any) {
    if (!initial) return {};
    const d: any = { ...initial };
    if (kind === "models") {
      d.vendorId = d.vendorId ?? d.vendor?.id ?? "";
      delete d.vendor;
    }
    if (kind === "devices") {
      d.typeId = d.typeId ?? d.type?.id ?? "";
      d.modelId = d.modelId ?? d.model?.id ?? "";
      d.vendorId = d.vendorId ?? d.model?.vendor?.id ?? "";
      delete d.model; // avoid sending nested object back
    }
    return d;
  }

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: mapDefaults(kind, initial), // initial load
    mode: "onSubmit",
  });

  useEffect(() => {
    if (open) reset(mapDefaults(kind, initial));
  }, [open, initial, kind, reset]);

  const selectedVendorId = useWatch({ control, name: "vendorId" });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {initial?.id
          ? `Edit ${kind.slice(0, -1)}`
          : `Create ${kind.slice(0, -1)}`}
      </DialogTitle>
      <form
        onSubmit={handleSubmit(onSubmit, (errs) =>
          console.error("Form validation failed:", errs)
        )}
        noValidate
      >
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {initial?.id && <input type="hidden" {...register("id")} />}
            <TextField
              label="Name"
              {...register("name")}
              helperText={errors.name?.message as string}
              error={!!errors.name}
            />
            {kind === "devices" && (
              <>
                <AssetsSelectionList
                  fetchKind="types"
                  name="typeId"
                  label="Type"
                  control={control}
                  errors={errors}
                  getOptionValue={(t: any) => t.id}
                  getOptionLabel={(t: any) => t.name}
                />

                <AssetsSelectionList
                  fetchKind="vendors"
                  name="vendorId"
                  label="Vendor"
                  control={control}
                  errors={errors}
                  getOptionValue={(v: any) => v.id}
                  getOptionLabel={(v: any) => v.name}
                />

                <AssetsSelectionList
                  fetchKind="models"
                  name="modelId"
                  label="Model"
                  control={control}
                  errors={errors}
                  getOptionValue={(m: any) => m.id}
                  getOptionLabel={(m: any) => m.name}
                  vendorIdFilter={selectedVendorId}
                />

                <TextField
                  label="IP Address"
                  {...register("ipAddress")}
                  helperText={errors.ipAddress?.message as string}
                  error={!!errors.ipAddress}
                />
              </>
            )}
            {kind === "models" && (
              <AssetsSelectionList
                fetchKind="vendors"
                name="vendorId" // field name in your models schema/DTO
                label="Vendor"
                control={control}
                errors={errors}
              />
            )}
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
