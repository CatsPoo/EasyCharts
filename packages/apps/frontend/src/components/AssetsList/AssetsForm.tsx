// AssetForm.tsx (patch)
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Stack, FormControl, InputLabel, Select, MenuItem, FormHelperText } from '@mui/material';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AssetKind, AssetMap } from '@easy-charts/easycharts-types';
import {AssetsSelectionList} from './AsetsSelectionList.component';

const schemas = {
  devices: z.object({ 
    name: z.string().min(1), 
    type: z.string().min(1), 
    model: z.string().optional(), 
    vendor: z.string().optional(), 
    ipAddress: z.string().optional() 
  }),
  models:  z.object({
    name: z.string().min(1),
    vendorId: z.string().min(1)
   }),
  vendors: z.object({
     name: z.string().min(1)
    }),
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

  function mapDefaults(kind: AssetKind, initial: any) {
  if (!initial) return {};
  const d: any = { ...initial };
  if (kind === 'models') {
    d.vendorId = d.vendorId ?? d.vendor?.id ?? ''; // prefill select
    delete d.vendor;                                // avoid sending object back
  }
  return d;
}
  
  const {control, register, handleSubmit, formState: {  errors, isSubmitting }, reset } = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: mapDefaults(kind, initial),     // initial load
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (open) reset(mapDefaults(kind, initial));
  }, [open, initial, kind, reset]);

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
                
                <AssetsSelectionList
                  fetchKind="vendors"
                  name="vendor"                     // ← matches your devices schema
                  label="Vendor"
                  control={control}
                  errors={errors}
                  getOptionValue={(v:any) => v.name} // ← store the NAME string
                  getOptionLabel={(v:any) => v.name}
                />

                <TextField label="IP Address" {...register('ipAddress')} />
              </>
            )}
            {kind === 'models' && (
              <AssetsSelectionList
                fetchKind="vendors"
                name="vendorId"           // field name in your models schema/DTO
                label="Vendor"
                control={control}
                errors={errors}
              />
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
