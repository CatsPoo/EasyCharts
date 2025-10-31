import type { Chart } from "@easy-charts/easycharts-types";
import { useMemo } from "react";
import type { XYPosition } from "reactflow";

type UseDeviceArgs = {
  chart: Chart;
  //   setChart: React.Dispatch<React.SetStateAction<Chart>>;
  //   setMadeChanges?: (v: boolean) => void;
};

export function useDevices({ chart }: UseDeviceArgs) {
  const devicePos = useMemo<Map<string, XYPosition>>(() => {
    const m = new Map<string, XYPosition>();
    for (const doc of chart.devicesOnChart) {
      m.set(doc.device.id, doc.position);
    }
    return m;
  }, [chart.devicesOnChart]);

  return {
    devicePos
  }
}
