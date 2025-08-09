// AssetForm.tsx (patch)
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Stack, FormControl, InputLabel, Select, MenuItem, FormHelperText } from '@mui/material';
import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AssetKind, AssetMap } from '@easy-charts/easycharts-types';
import { useListAssets } from '../../hooks/assetsHooks';

const schemas = {
  devices: z.object({ name: z.string().min(1), type: z.string().min(1), model: z.string().optional(), vendor: z.string().optional(), ipAddress: z.string().optional() }),
  models:  z.object({
    name: z.string().min(1),
    vendorId: z.string().min(1)
   }),
  vendors: z.object({ name: z.string().min(1)}),
} as const;

type Props<K extends AssetKind> = {
  kind: K;
  open: boolean;
  initial?: Partial<AssetMap[K]>;  
  onClose: () => void;
  onSubmit: (data: any) => void;
};

export function AssetForm<K extends AssetKind>({ kind, open, initial, onClose, onSubmit }: Props<K>) {
  const schema = schemas[kind] as any;

  const defaults = useMemo(() => {
    if (!initial) return {};
    const d: any = { ...initial };
    if (kind === 'models') {
     
      if (d.vendor?.id && !d.vendorId) d.vendorId = d.vendor.id; // ⭐
      delete d.vendor; 
    }
    return d;
  }, [initial, kind]);
  
  const {control, register, handleSubmit, formState: {  errors, isSubmitting }, reset } = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: defaults,     // initial load
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (open) reset(initial ?? {});
  }, [open, initial, reset]);

  const { data: vendorsData, isLoading: vendorsLoading } = useListAssets(
  'vendors',
  { page: 0, pageSize: 1000, sortBy: 'name', sortDir: 'asc' },
  { enabled: kind === 'models', staleTime: 5 * 60 * 1000 }
);

const vendorOptions = vendorsData?.rows ?? [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initial?.id ? `Edit ${kind.slice(0, -1)}` : `Create ${kind.slice(0, -1)}`}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
             {initial?.id && <input type="hidden" {...register('id')} />}
            <TextField label="Name" {...register('name')} helperText={errors.name?.message as string} error={!!errors.name}/>
            {kind === 'devices' && (
              <>
                <TextField label="Type" {...register('type')} helperText={errors.type?.message as string} error={!!errors.type}/>
                <TextField label="Model" {...register('model')} />
                <TextField label="Vendor" {...register('vendor')} />
                <TextField label="IP Address" {...register('ipAddress')} />
              </>
            )}
            {kind === 'models' && (
              <FormControl error={!!errors.vendorId}>
                <InputLabel id="vendorId-label">Vendor</InputLabel>
                  <Controller
                      name="vendorId"
                      control={control}
                      render={({ field }) => (
                        <Select
                          labelId="vendorId-label"
                          label="Vendor"
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          disabled={vendorsLoading}
                        >
                          <MenuItem value=""><em>None</em></MenuItem>
                            {vendorOptions.map((v: any) => (
                          <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>
                          ))}
                        </Select>
                      )}
                    />
                    <FormHelperText>{errors.vendorId?.message as string}</FormHelperText>
                  </FormControl>
)}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} variant="outlined">Cancel</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>Save</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
