// AssetForm.tsx (patch)
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Stack } from '@mui/material';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { AssetKind, AssetMap } from './types';

const schemas = {
  devices: z.object({ name: z.string().min(1), type: z.string().min(1), model: z.string().optional(), vendor: z.string().optional(), ipAddress: z.string().optional() }),
  models:  z.object({ name: z.string().min(1), vendor: z.string().optional() }),
  vendors: z.object({ name: z.string().min(1) }),
} as const;

type Props<K extends AssetKind> = {
  kind: K;
  open: boolean;
  initial?: Partial<AssetMap[K]>;   // contains existing row when editing
  onClose: () => void;
  onSubmit: (data: any) => void;
};

export function AssetForm<K extends AssetKind>({ kind, open, initial, onClose, onSubmit }: Props<K>) {
  const schema = schemas[kind] as any;

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: initial ?? {},     // initial load
    mode: 'onSubmit',
  });

  // IMPORTANT: when dialog opens with a new row, push defaults into RHF
  useEffect(() => {
    if (open) reset(initial ?? {});
  }, [open, initial, reset]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initial?.id ? `Edit ${kind.slice(0, -1)}` : `Create ${kind.slice(0, -1)}`}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Name" {...register('name')} helperText={errors.name?.message as string} error={!!errors.name}/>
            {kind === 'devices' && (
              <>
                <TextField label="Type" {...register('type')} helperText={errors.type?.message as string} error={!!errors.type}/>
                <TextField label="Model" {...register('model')} />
                <TextField label="Vendor" {...register('vendor')} />
                <TextField label="IP Address" {...register('ipAddress')} />
              </>
            )}
            {/* {kind === 'models' && <TextField label="Vendor" {...register('vendor')} />} */}
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
