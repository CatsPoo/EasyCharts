// AsetsSelectionList.component.tsx
import { FormControl, FormHelperText, InputLabel, MenuItem, Select } from '@mui/material';
import { Controller, type Control, type FieldErrors } from 'react-hook-form';
import { useListAssets } from '../../hooks/assetsHooks';
import type { AssetKind } from '@easy-charts/easycharts-types';
import { useMemo } from 'react';

type AnyRow = Record<string, any>;

interface AssetsSelectionListProps<TForm = any, TRow extends AnyRow = AnyRow> {
  fetchKind: AssetKind;            // e.g. 'vendors'
  name: string;                    // e.g. 'vendorId' or 'vendor'
  label: string;                   // UI label
  control: Control<TForm>;
  errors: FieldErrors<TForm>;
  getOptionValue?: (row: TRow) => string; // default: row.id
  getOptionLabel?: (row: TRow) => string; // default: row.name
  allowNone?: boolean;
  vendorIdFilter?: string | null | undefined;           // default: true
}

export function AssetsSelectionList<TForm = any, TRow extends AnyRow = AnyRow>({
  fetchKind,
  name,
  label,
  control,
  errors,
  getOptionValue = (r) => (r as any).id,
  getOptionLabel = (r) => (r as any).name,
  allowNone = true,
  vendorIdFilter

}: AssetsSelectionListProps<TForm, TRow>) {

  const params = useMemo(() => {
    const base: any = { page: 0, pageSize: 1000, sortBy: 'name', sortDir: 'asc' };
    if (fetchKind === 'models' && vendorIdFilter) {
      base.vendorId = vendorIdFilter;       // <-- pass vendor filter
    }
    return base;
  }, [fetchKind, vendorIdFilter]);



  const { data, isLoading } = useListAssets(fetchKind, params);

  const options = (data?.rows ?? []) as TRow[];
  const labelId = `${name}-label`;
  const fieldError = (errors as any)?.[name]?.message as string | undefined;

  return (
    <FormControl error={!!fieldError} fullWidth>
      <InputLabel id={labelId}>{label}</InputLabel>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Select
            labelId={labelId}
            label={label}
            value={field.value ?? ''}   // keep controlled
            onChange={(e) => field.onChange(e.target.value)}
            disabled={isLoading}
          >
            {allowNone && (
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
            )}
            {options.map((row) => {
              const value = getOptionValue(row);
              const text = getOptionLabel(row);
              return (
                <MenuItem key={value} value={value}>
                  {text}
                </MenuItem>
              );
            })}
          </Select>
        )}
      />
      <FormHelperText>{fieldError}</FormHelperText>
    </FormControl>
  );
}