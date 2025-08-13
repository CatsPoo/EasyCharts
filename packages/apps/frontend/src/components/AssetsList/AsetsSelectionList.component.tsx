import { AssetKind } from "@easy-charts/easycharts-types";
import { FormControl, FormHelperText, InputLabel, MenuItem, Select } from "@mui/material";
import { Control, Controller, FieldErrors } from "react-hook-form";
import { useListAssets } from "../../hooks/assetsHooks";

interface AssetsSelectionListProps {
    kind:AssetKind
    control:Control<any, any, any>
    errors:FieldErrors<any>

}
export function AssetsSelectionList({
    kind,
    control,
    errors
} : AssetsSelectionListProps){

    const { data: vendorsData, isLoading: vendorsLoading } = useListAssets(
      kind,
      { page: 0, pageSize: 1000, sortBy: 'name', sortDir: 'asc' }
      //{ enabled: kind ==='models', staleTime: 5 * 60 * 1000 }
    );
    
    const vendorOptions = vendorsData?.rows ?? [];
    
    return (
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
    )
}