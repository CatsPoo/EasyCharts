import type { Bond, BondOnChart, Chart, LineOnChart } from "@easy-charts/easycharts-types";
import { useCallback } from "react";
import { useReactFlow, type XYPosition } from "reactflow";
import { v4 as uuidv4 } from "uuid";
import { Orientation } from "../components/ChartEditor/enums/BondBridgeNode.enum";
import { useDevices } from "./devicesHook";

type UseBondsArgs = {
  chart: Chart;
  applyChartChange: (produce: (base: Chart) => Chart) => void;
};

export function useBonds({ chart, applyChartChange }: UseBondsArgs) {
  const rf = useReactFlow();
  const { devicePos } = useDevices({ chart });

  const pickoreantationbyMembersLines = useCallback(
    (membersIds: string[]) => {
      const lines: LineOnChart[] = chart.linesOnChart;
      let sumDx = 0,
        sumDy = 0,
        c = 0;
      for (const lid of membersIds) {
        const loc = lines.find((l) => l.line.id === lid);
        if (!loc) continue;
        const a = devicePos.get(loc.line.sourcePort.deviceId);
        const b = devicePos.get(loc.line.targetPort.deviceId);
        if (!a || !b) continue;
        sumDx += Math.abs(a.x - b.x);
        sumDy += Math.abs(a.y - b.y);
        c++;
      }
      if (!c) return Orientation.TopToBottom;
      // If devices are vertically aligned on average -> use left/right handles (taller oval)
      return sumDx > sumDy ? Orientation.LeftToright : Orientation.TopToBottom;
    },
    [chart.linesOnChart, devicePos]
  );

  const pickOrientation = useCallback(
    (bond: Bond): Orientation => {
      return pickoreantationbyMembersLines(bond.membersLines);
    },
    [pickoreantationbyMembersLines]
  );

  /** Underlying line IDs from selection (handles split edges via data.lineId) */
  const getSelectedLineIds = useCallback((): string[] => {
    const ids = new Set<string>();
    for (const e of rf.getEdges()) {
      if (!e.selected) continue;
      // if you render split edges, each part carries data.lineId === original line id
      const lid = ((e.data as any)?.lineId ?? e.id) as string;
      if (lid) ids.add(lid);
    }
    return [...ids];
  }, [rf]);

  const getBondCenterPos = useCallback(
    (members: LineOnChart[]): XYPosition => {
      let cx = 0,
        cy = 0,
        cnt = 0;
      for (const loc of members) {
        const A = devicePos.get(loc.line.sourcePort.deviceId);
        const B = devicePos.get(loc.line.targetPort.deviceId);
        if (!A || !B) continue;
        cx += (A.x + B.x) / 2;
        cy += (A.y + B.y) / 2;
        cnt++;
      }
      if (cnt) {
        cx /= cnt;
        cy /= cnt;
      }
      return { x: cx, y: cy };
    },
    [devicePos]
  );

  const getNewBondPosition = useCallback(
    (membersIds: string[]): XYPosition => {
      const baseW = 84,
        baseH = 48,
        step = 14,
        n = membersIds.length;
      const orientation = pickoreantationbyMembersLines(membersIds);
      const width =
        orientation === Orientation.TopToBottom
          ? Math.max(baseW, baseW + step * (n - 1))
          : 52;
      const height =
        orientation === Orientation.LeftToright
          ? Math.max(baseH, baseH + step * (n - 1))
          : 52;

      const wanted = new Set(membersIds);
      const membersLinesOnChart: LineOnChart[] = chart.linesOnChart.filter(
        (loc) => wanted.has(loc.line.id)
      );
      const { x: cx, y: cy } = getBondCenterPos(membersLinesOnChart);

      return { x: cx - width / 2, y: cy - height / 2 };
    },
    [chart.linesOnChart, getBondCenterPos, pickoreantationbyMembersLines]
  );

  const createBond = useCallback(
    () => {
      const name = "New bond";
      const baseMembers = getSelectedLineIds()

      const members = Array.from(new Set(baseMembers)); // dedupe

      if (members.length < 2) {
        return {
          ok: false,
          reason: "Select at least 2 lines to create a bond.",
        };
      }

      // Prevent a line from being in two different bonds (simple rule; change if you allow multi-bond)
      const already = new Set(
        (chart.bondsOnChart ?? []).flatMap((b) => b.bond.membersLines) // <-- here if your key differs
      );
      const uniqueMembers = members.filter((id) => !already.has(id));

      if (uniqueMembers.length < 2) {
        return {
          ok: false,
          reason:
            "Selected lines are already bonded or fewer than 2 unique lines remained.",
        };
      }

      const id = uuidv4();
      const newPosition = getNewBondPosition(uniqueMembers);

      const bond: BondOnChart = {
        chartId: chart.id,
        bond: {
          id,
          name,
          membersLines: uniqueMembers,
        },
        position: newPosition,
      };

      applyChartChange((prev) => {
        const next = {
          ...prev,
          bondsOnChart: [
            ...(prev.bondsOnChart ?? []),
            bond
          ],
        } as Chart;
        return next;
      });
      return { ok: true, bond };
    },
    [
      getSelectedLineIds,
      chart.bondsOnChart,
      chart.id,
      getNewBondPosition,
      applyChartChange,
    ]
  );

  /** Delete a bond entirely (does not touch lines themselves) */
  const deleteBond = useCallback(
    (bondId: string) => {
      applyChartChange((prev) => {
        const next = {
          ...prev,
          bondsOnChart: (prev.bondsOnChart ?? []).filter(
            (b) => b.bond.id !== bondId
          ),
        } as Chart;
        return next;
      });
      return { ok: true };
    },
    [applyChartChange]
  );

  /** Add lines into an existing bond (uses selection if lineIds omitted) */
  const addLinesToBond = useCallback(
    (bondId: string, lineIds?: string[]) => {
      const toAdd = lineIds && lineIds.length ? lineIds : getSelectedLineIds();
      if (!toAdd.length)
        return { ok: false, reason: "No lines provided/selected." };

      // Lines that are already in ANY bond are ignored (adjust if you allow multi-bond)
      const globallyBonded = new Set(
        (chart.bondsOnChart ?? []).flatMap((b) => b.bond.membersLines) // <-- here
      );

      const filtered = toAdd.filter((id) => !globallyBonded.has(id));
      if (!filtered.length) {
        return { ok: false, reason: "All selected lines are already bonded." };
      }

      applyChartChange((prev) => {
        const next = {
          ...prev,
          bondsOnChart: (prev.bondsOnChart ?? []).map((b) => {
            if (b.bond.id !== bondId) return b;
            const members = new Set(b.bond.membersLines); // <-- here
            filtered.forEach((id) => members.add(id));
            return {
              ...b,
              bond: { ...b.bond, membersLines: [...members] }, // <-- here
            };
          }),
        } as Chart;
        return next;
      });
      return { ok: true };
    },
    [applyChartChange, chart.bondsOnChart, getSelectedLineIds]
  );

  return {
    createBond,
    deleteBond,
    addLinesToBond,
    pickOrientation,
    getBondCenterPos,
  };
}
