// AssetForm.tsx
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Stack } from '@mui/material';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { AssetKind, AssetMap } from '@easy-charts/easycharts-types';

const schemas = {
  devices: z.object({ name: z.string().min(1), type: z.string().min(1), model: z.string().optional(), vendor: z.string().optional() }),
  models:  z.object({ name: z.string().min(1), vendor: z.string().optional() }),
  vendors: z.object({ name: z.string().min(1) }),
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
  const { register, handleSubmit, formState: { errors } } = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: initial,
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initial?.id ? `Edit ${kind.slice(0, -1)}` : `Create ${kind.slice(0, -1)}`}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Name" {...register('name')} helperText={errors.name?.message as string} error={!!errors.name}/>
          {kind === 'devices' && (
            <>
              <TextField label="Type" {...register('type')} helperText={errors.type?.message as string} error={!!errors.type}/>
              {/* <TextField label="Model" {...register('model')} />
              <TextField label="Vendor" {...register('vendor')} /> */}
            </>
          )}
          {/* {kind === 'models' && <TextField label="Vendor" {...register('vendor')} />} */}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">Cancel</Button>
        <Button onClick={handleSubmit(onSubmit)} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );
}
