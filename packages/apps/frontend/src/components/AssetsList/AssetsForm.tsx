// AssetForm.tsx (patch)
import { type AssetKind, type AssetMap } from "@easy-charts/easycharts-types";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormHelperText,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useCreateAsset, useListAssets } from "../../hooks/assetsHooks";
import z from "zod";
import { AssetsSelectionList } from "./AsetsSelectionList.component";
import { DevicePortsTable } from "./DevicePortsTable";

function CableTypeFields({ register, errors, control, setValue }: { register: any; errors: any; control: any; setValue: any }) {
  const { data: portTypesData } = useListAssets("portTypes");
  const portTypes = portTypesData?.rows ?? [];
  const selected: string[] = useWatch({ control, name: "compatiblePortTypeIds" }) ?? [];

  return (
    <>
      <TextField
        label="Default Color"
        type="color"
        size="small"
        {...register("defaultColor")}
        helperText={(errors as any).defaultColor?.message as string}
        error={!!(errors as any).defaultColor}
        sx={{ width: 140 }}
      />
      <Box>
        <InputLabel shrink>Compatible Port Types</InputLabel>
        <Select
          multiple
          displayEmpty
          value={selected}
          onChange={(e) => setValue("compatiblePortTypeIds", e.target.value as string[], { shouldValidate: true })}
          input={<OutlinedInput size="small" fullWidth />}
          renderValue={(vals: string[]) =>
            vals.length === 0 ? (
              <span style={{ color: "#aaa" }}>Select port types...</span>
            ) : (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {vals.map((id) => {
                  const pt = portTypes.find((p: any) => p.id === id);
                  return <Chip key={id} label={pt?.name ?? id} size="small" />;
                })}
              </Box>
            )
          }
          size="small"
          fullWidth
        >
          {portTypes.map((pt: any) => (
            <MenuItem key={pt.id} value={pt.id}>
              {pt.name}
            </MenuItem>
          ))}
        </Select>
        {(errors as any).compatiblePortTypeIds && (
          <FormHelperText error>{(errors as any).compatiblePortTypeIds.message}</FormHelperText>
        )}
      </Box>
    </>
  );
}

const schemas = {
  clouds: z.object({
    name: z.string().min(1),
    description: z.string().optional(),
  }),
  customElements: z.object({
    name: z.string().min(1),
    imageUrl: z.string().optional(),
  }),
  devices: z.object({
    name: z.string().min(1),
    typeId: z.string().min(1),
    modelId: z.string().min(1),
    ipAddress: z.ipv4()
  }),
  types: z.object({
    name: z.string().min(1),
  }),
  models: z.object({
    name: z.string().min(1),
    vendorId: z.string().min(1),
  }),
  vendors: z.object({
    name: z.string().min(1),
  }),
  portTypes: z.object({
    name: z.string().min(1).max(50),
  }),
  cableTypes: z.object({
    name: z.string().min(1).max(50),
    defaultColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color"),
    compatiblePortTypeIds: z.array(z.string()).min(0),
  }),
} as const;
type Props<K extends AssetKind> = {
  kind: K;
  open: boolean;
  initial?: Partial<AssetMap[K]>;
  onClose: () => void;
  onSubmit: (data: any) => void;
};

function QuickCreateDialog({
  kind,
  open,
  initial,
  onClose,
  onSuccess,
}: {
  kind: AssetKind;
  open: boolean;
  initial?: Record<string, any>;
  onClose: () => void;
  onSuccess: (id: string) => void;
}) {
  const { mutateAsync } = useCreateAsset(kind);
  return (
    <AssetForm
      kind={kind}
      open={open}
      initial={initial as any}
      onClose={onClose}
      onSubmit={async (data) => {
        try {
          const result = await mutateAsync(data);
          onSuccess(result.id);
          onClose();
        } catch {
          // keep sub-dialog open on error
        }
      }}
    />
  );
}

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
    if (kind === "cableTypes") {
      d.compatiblePortTypeIds = d.compatiblePortTypeIds ?? d.compatiblePortTypes?.map((pt: any) => pt.id) ?? [];
      delete d.compatiblePortTypes;
    }
    return d;
  }

  const [quickKind, setQuickKind] = useState<AssetKind | null>(null);

  const {
    control,
    register,
    handleSubmit,
    setValue,
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
    <Dialog open={open} onClose={onClose} maxWidth={kind === "devices" ? "md" : "sm"} fullWidth>
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
            {kind === "clouds" && (
              <TextField
                label="Description"
                multiline
                rows={3}
                {...register("description")}
                helperText={errors.description?.message as string}
                error={!!errors.description}
              />
            )}
            {kind === "customElements" && (
              <TextField
                label="Image URL"
                placeholder="https://example.com/icon.png"
                {...register("imageUrl")}
                helperText={(errors as any).imageUrl?.message as string}
                error={!!(errors as any).imageUrl}
              />
            )}
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
                  onQuickCreate={() => setQuickKind("types")}
                />

                <AssetsSelectionList
                  fetchKind="vendors"
                  name="vendorId"
                  label="Vendor"
                  control={control}
                  errors={errors}
                  getOptionValue={(v: any) => v.id}
                  getOptionLabel={(v: any) => v.name}
                  onQuickCreate={() => setQuickKind("vendors")}
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
                  onQuickCreate={() => setQuickKind("models")}
                />

                <TextField label="IP Address"
                {...register("ipAddress")}
                helperText={errors.ipAddress?.message as string}
                error={!!errors.ipAddress}
              />
                <DevicePortsTable
                  deviceId={(initial as any)?.id ?? ""}
                  initialPorts={(initial as any)?.ports ?? []}
                  disabled={!(initial as any)?.id}
                />
              </>
            )}
            {kind === "models" && (
              <AssetsSelectionList
                fetchKind="vendors"
                name="vendorId"
                label="Vendor"
                control={control}
                errors={errors}
                onQuickCreate={() => setQuickKind("vendors")}
              />
            )}
            {kind === "cableTypes" && (
              <CableTypeFields
                register={register}
                errors={errors}
                control={control}
                setValue={setValue}
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
      {quickKind && (
        <QuickCreateDialog
          kind={quickKind}
          open={true}
          initial={quickKind === "models" && selectedVendorId ? { vendorId: selectedVendorId } : undefined}
          onClose={() => setQuickKind(null)}
          onSuccess={(id) => {
            const fieldMap: Partial<Record<AssetKind, string>> = {
              types: "typeId",
              vendors: "vendorId",
              models: "modelId",
            };
            const field = fieldMap[quickKind];
            if (field) setValue(field, id);
            setQuickKind(null);
          }}
        />
      )}
    </Dialog>
  );
}
