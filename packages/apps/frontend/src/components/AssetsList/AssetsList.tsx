import { assetsTypes } from "@easy-charts/easycharts-types";
import { List, ListItem } from "@mui/material";

interface assetsListProps{
  items: assetsTypes[];
  clickable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (newIds: string) => void;
  renderItem: (
    id:string,
    item: assetsTypes,
  ) => React.ReactNode;
  emptyPlaceholder?: React.ReactNode;
}
export function AssetsList ({
items,
  clickable = false,
  selectedIds = [],
  onSelectionChange,
  renderItem,
  emptyPlaceholder = <div className="p-4 text-gray-500">No items.</div>,
}: assetsListProps
){
if (items.length === 0) {
    return {emptyPlaceholder};
  }

  return (
    <List disablePadding>
      {items.map((item) => {
        return (
          <ListItem key={item.id} disablePadding>
            <div
            key={item.id}
            className={`p-2 cursor-pointer`}
          >
            {renderItem(item.id,item)}
          </div>
          </ListItem>
        )})}
    </List>
  );
}