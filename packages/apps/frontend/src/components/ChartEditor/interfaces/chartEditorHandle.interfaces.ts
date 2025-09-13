import type { Chart } from "@easy-charts/easycharts-types";
import type { MouseEvent } from "react";

export interface ChartEditorHandle  {
  onSave: (e?:MouseEvent<HTMLButtonElement>) => Promise<Chart|null>;
  isChangesMade: () => boolean;
};