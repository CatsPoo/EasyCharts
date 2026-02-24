import {
  ChartEntitiesEnum,
  type BondOnChart,
  type Chart,
  type ChartUpdate,
  type Device,
  type DeviceOnChart,
  type Handles,
  type Line,
  type LineOnChart,
  type NoteOnChart,
  type Port,
  type Side
} from "@easy-charts/easycharts-types";
import { AnimatePresence, motion } from "framer-motion";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange
} from "reactflow";
import { v4 as uuidv4 } from "uuid";

import ReactFlow, {
  Background,
  ConnectionLineType,
  Controls,
  reconnectEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import { useThemeMode } from "../../contexts/ThemeModeContext";
import { useListAssets, useUpdateAsset } from "../../hooks/assetsHooks";
import { updatePort } from "../../hooks/portsHooks";
import { AssetForm } from "../AssetsList/AssetsForm";
import { PortFormDialog } from "../PortFormDialog";
import type { PortFormValues } from "../PortFormDialog";
import { useBonds } from "../../hooks/bondsHooks";
import { useUpdateChartMutation } from "../../hooks/chartsHooks";
import { useDevices } from "../../hooks/devicesHook";
import { fetchBondPortSiblings, fetchConnectedPortIds, fetchConnectedPortInfo, type BondPortSiblingsResponse } from "../../hooks/linesHooks";
import { DevicesSidebar } from "./DevicesSideBar";
import { Alert, Button, Snackbar } from "@mui/material";
import { ConfirmDialog } from "../DeleteAlertDialog";
import DeviceNode from "../DeviceNode/DeviceNode";
import type { DeviceNodeData } from "../DeviceNode/interfaces/deviceModes.interfaces";
import { BondBridgeNode, type BondBridgeNodeData } from "./BondBadgeNode";
import { EditLineDialog } from "./EditLineDialog";
import MenuList from "./EditoroMenuList";
import NoteNode, { type NoteNodeData } from "./NoteNode";
import { PortsEditorDialog } from "./PortsEditorDialog";
import { Orientation } from "./enums/BondBridgeNode.enum";
import { EditorMenuListKeys } from "./enums/EditorMenuListKeys.enum";
import type { ChartEditorHandle } from "./interfaces/chartEditorHandle.interfaces";
import type { DeleteSets } from "./interfaces/deleteSets.interfaces";
import type { EditLineDialogFormResponse } from "./interfaces/editLineDialogForm.interfaces";

interface ChardEditorProps {
  chart: Chart;
  setChart: React.Dispatch<React.SetStateAction<Chart>>;
  editMode: boolean;
  setMadeChanges: React.Dispatch<React.SetStateAction<boolean>>;
}

export const ChartEditor = forwardRef<ChartEditorHandle, ChardEditorProps>(
  function ChartEditor(
    { chart, setChart, editMode, setMadeChanges }: ChardEditorProps,
    ref
  ) {
    const [isEditlineDialogOpen, setEditLineDialogOpen] =
      useState<boolean>(false);
    const [portsEditorDevice, setPortsEditorDevice] =
      useState<DeviceOnChart | null>(null);
    const [editPortTarget, setEditPortTarget] = useState<{
      port: Port;
      deviceId: string;
    } | null>(null);
    const [editDeviceTarget, setEditDeviceTarget] =
      useState<DeviceOnChart | null>(null);
    const [selectedEditLine, setSelectedEditLine] = useState<Edge | null>(null);

    const [portTypeMismatch, setPortTypeMismatch] = useState(false);
    const [pairedToastOpen, setPairedToastOpen] = useState(false);
    const [bondSiblingToast, setBondSiblingToast] = useState<{
      result: BondPortSiblingsResponse;
      deviceId: string;
      side: Side;
    } | null>(null);
    const [bondOtherSideToast, setBondOtherSideToast] = useState<{
      result: BondPortSiblingsResponse;
      side: Side;
    } | null>(null);
    const [connectedPortToast, setConnectedPortToast] = useState<{
      connectedPort: Port;
      triggeredPortId: string;
      triggeredDeviceId: string;
      deviceName: string;
      side: Side;
    } | null>(null);
    const greenPortIdsRef = useRef<Set<string>>(new Set());
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [pandingDelete, setPandingDelete] = useState<{
      value: Node | Edge | null;
      kind?: keyof DeleteSets;
    }>({ value: null });
    const [confimDialogTitle, setConfirmDialogTitle] = useState<string>("");
    const [confimDialogDescription, setConfirmDialogDescription] =
      useState<string>("");

    const actionsHistory = useRef<Chart[]>([chart]);
    const actionsHistoryIndex = useRef<number>(
      actionsHistory.current.length - 1
    );

    const addChartToHistory = useCallback((newChart: Chart) => {
      actionsHistory.current = actionsHistory.current.slice(
        0,
        actionsHistoryIndex.current + 1
      );
      setCanUndo(true);
      setCanUndo(actionsHistoryIndex.current > 0);

      actionsHistory.current.push(structuredClone(newChart));
      actionsHistoryIndex.current = actionsHistory.current.length - 1;
    }, []);

    const applyChartChange = useCallback(
      (produce: (base: Chart) => Chart) => {
        const base = chart;
        const next = produce(base);
        setChart(next);
        addChartToHistory(next);
        setMadeChanges(true);
      },
      [addChartToHistory, chart, setChart, setMadeChanges]
    );


    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);

    const updateMut = useUpdateChartMutation();
    const updateDeviceMut = useUpdateAsset("devices");
    const { project,getEdge } = useReactFlow();
    const {devicePos} = useDevices({chart})
    const {pickOrientation,getBondCenterPos,createBond} = useBonds({chart,applyChartChange})
    
    
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const { isDark } = useThemeMode();

    const nodeTypes = useMemo(
      () => ({
        device: DeviceNode,
        bridge: BondBridgeNode,
        note: NoteNode,
      }),
      []
    );

    const devicesByIdRef = useRef<Map<string, Device>>(new Map());
    const chartRef = useRef<Chart>(chart);
    const pendingBondRef = useRef<{ bondId: string; bondName: string; lineMap: Map<string, string> } | null>(null);

    const deleteSetsRef = useRef<DeleteSets>({
      devices: new Set(),
      ports: new Set(),
      lines: new Set(),
    });

    const dirtyRef = useRef(false);
    const setDirty = useCallback(
      (v: boolean) => {
        dirtyRef.current = v;
        setMadeChanges(v);
      },
      [setMadeChanges]
    );

    const [ctx, setCtx] = useState<CtxState>({
      open: false,
      x: 0,
      y: 0,
      kind: "pane",
    });

    const closeCtx = useCallback(
      () => setCtx((c) => ({ ...c, open: false })),
      []
    );

    const moveMenuTo = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault(); // block browser context menu
        e.stopPropagation();
        setCtx((prev) => ({
          ...prev,
          open: true,
          x: e.clientX,
          y: e.clientY,
          kind: ctx.kind,
        }));
      },
      [ctx.kind]
    );

    const onPaneContextMenu = useCallback((e: React.MouseEvent) => {
      e.preventDefault();
      setCtx({
        open: true,
        x: e.clientX,
        y: e.clientY,
        kind: "pane",
        payload: null,
      });
    }, []);


    const onNodeContextMenu = useCallback((e: React.MouseEvent, node: Node) => {
      e.preventDefault();
      // Notes don't have a context menu
      if (node.type === "note") return;
      const doc = chart.devicesOnChart.find((d) => d.device.id === node.id);
      const canConnectPaired = doc?.device.ports.some((p) => greenPortIdsRef.current.has(p.id)) ?? false;
      setCtx({
        open: true,
        x: e.clientX,
        y: e.clientY,
        kind: "node",
        payload: { node },
        canConnectPaired,
      });
    }, [chart.devicesOnChart]);

    const onEdgeContextMenu = useCallback((e: React.MouseEvent, edge: Edge) => {
      e.preventDefault();
      setCtx({
        open: true,
        x: e.clientX,
        y: e.clientY,
        kind: "edge",
        payload: { edge },
      });
    }, []);

    // this one will be passed down to DeviceNode and called from each <Handle>
    const onHandleContextMenu = useCallback(
      (
        e: React.MouseEvent,
        info: {
          deviceId: string;
          portId: string;
          role: "source" | "target";
          side?: Side;
        }
      ) => {
        e.preventDefault();
        e.stopPropagation();
        setCtx({
          open: true,
          x: e.clientX,
          y: e.clientY,
          kind: "handle",
          payload: info,
          canConnectPaired: greenPortIdsRef.current.has(info.portId),
        });
      },
      []
    );


    const onUndoClick = useCallback(() => {
      if (actionsHistoryIndex.current === 0) return;
      actionsHistoryIndex.current -= 1;
      setChart(actionsHistory.current[actionsHistoryIndex.current]);
      setMadeChanges(actionsHistoryIndex.current > 0);
      setCanUndo(actionsHistoryIndex.current > 0);
      setCanRedo(
        actionsHistoryIndex.current < actionsHistory.current.length - 1
      );
    }, [setChart, setMadeChanges]);

    const onRedoClick = useCallback(() => {
      if (actionsHistoryIndex.current === actionsHistory.current.length - 1)
        return;
      actionsHistoryIndex.current += 1;
      setChart(actionsHistory.current[actionsHistoryIndex.current]);
      setCanUndo(actionsHistoryIndex.current > 0);
      setCanRedo(
        actionsHistoryIndex.current < actionsHistory.current.length - 1
      );
    }, [setChart]);

    useEffect(() => {
      actionsHistory.current = [chart];
      actionsHistoryIndex.current = 0;
      setCanRedo(false);
      setCanRedo(false);
    }, [chart.id]);

    const convertLineToEdge = (lineonChart: LineOnChart): Edge => {
      return {
        id: lineonChart.line.id,
        source: lineonChart.line.sourcePort.deviceId,
        target: lineonChart.line.targetPort.deviceId,
        sourceHandle: lineonChart.line.sourcePort.id,
        targetHandle: lineonChart.line.targetPort.id,
        label: lineonChart.label,
        type: lineonChart.type,
        animated: false,
      };
    };

    const [nodes, setNodes, onNodesChangeRF] = useNodesState<Node[]>([]);
    const [edges, setEdges, onEdgesChangeRF] = useEdgesState<Edge[]>([]);

    //Remove Node from chart but keep it in database
    const onRemoveNode = useCallback(
      (deviceId: string) => {
        applyChartChange((prev) => {
          return {
            ...prev,
            devicesOnChart: prev.devicesOnChart.filter(
              (doc) => doc.device.id !== deviceId
            ),
            // optional: also drop edges touching this device in chart state
            linesOnChart: prev.linesOnChart.filter(
              (l) =>
                l.line.sourcePort.deviceId !== deviceId &&
                l.line.targetPort.deviceId !== deviceId
            ),
          } as Chart;
        });
        setNodes((ns) => ns.filter((n) => n.id !== deviceId));
        setEdges((es) =>
          es.filter((e) => e.source !== deviceId && e.target !== deviceId)
        );
      },
      [applyChartChange, setNodes, setEdges]
    );

    //Remove line from chart but keep it on dayabase
    const onRemoveEdge = useCallback(
      (edgeToRemove: Edge) => {
        const used = new Set<string>();
        if (edgeToRemove.sourceHandle) used.add(edgeToRemove.sourceHandle);
        if (edgeToRemove.targetHandle) used.add(edgeToRemove.targetHandle);

        setEdges((es) => es.filter((e) => e.id !== edgeToRemove.id));
        applyChartChange((prev) => {
          return {
            ...prev,
            linesOnChart: prev.linesOnChart.filter(
              (l) => l.line.id !== edgeToRemove.id
            ),
            devicesOnChart: prev.devicesOnChart.map((doc) => {
              return {
                ...doc,
                device: {
                  ...doc.device,
                  ports: doc.device.ports.map((p) => {
                    return used.has(p.id) ? { ...p, inUse: false } : p;
                  }),
                },
              } as DeviceOnChart;
            }),
          } as Chart;
        });
      },
      [applyChartChange, setEdges]
    );

    const onMoveHandle = useCallback(
      (deviceId: string, portId: string, fromSide: Side, toSide: Side) => {
        if (fromSide === toSide) return;
        applyChartChange((prev) => {
          return {
            ...prev,
            devicesOnChart: prev.devicesOnChart.map((doc) => {
              if (doc.device.id !== deviceId) return doc;
              const handleToMove = doc.handles[fromSide]?.find(
                (h) => h.port.id === portId
              );
              if (!handleToMove) return doc;
              return {
                ...doc,
                handles: {
                  ...doc.handles,
                  [fromSide]: (doc.handles[fromSide] ?? []).filter(
                    (h) => h.port.id !== portId
                  ),
                  [toSide]: [...(doc.handles[toSide] ?? []), handleToMove],
                },
              };
            }),
          } as Chart;
        });
        setDirty(true);
      },
      [applyChartChange, setDirty]
    );

    //remove handle from chart but keep iit in database
    const onRemoveHandle = useCallback(
      (deviceId: string, portId: string) => {
        // 1) update chart state (handles + lines)
        applyChartChange((prev) => {
          const devicesOnChart = prev.devicesOnChart.map((doc) => {
            if (doc.device.id !== deviceId) return doc;

            const strip = (arr: any[] = []) =>
              arr.filter((h) => h?.port?.id !== portId);

            const newHandles: Handles = {
              left: strip(doc.handles.left),
              right: strip(doc.handles.right),
              top: strip(doc.handles.top),
              bottom: strip(doc.handles.bottom),
            };

            // mark port as free; don't remove from device.ports
            const newDevice = {
              ...doc.device,
              ports: (doc.device.ports ?? []).map((p) =>
                p.id === portId ? { ...p, inUse: false } : p
              ),
            };

            return { ...doc, handles: newHandles, device: newDevice };
          });

          // also drop any lines that referenced this port
          const linesOnChart = prev.linesOnChart.filter(
            (l) =>
              l.line.sourcePort.id !== portId && l.line.targetPort.id !== portId
          );

          return { ...prev, devicesOnChart, linesOnChart } as Chart;
        });

        // 2) update reactflow edges immediately
        setEdges((es) =>
          es.filter(
            (e) => e.sourceHandle !== portId && e.targetHandle !== portId
          )
        );

        setDirty(true);
      },
      [applyChartChange, setEdges, setDirty]
    );

    //delete device from both cgart and from dtabase
    const onDeleteDevice = useCallback(
      (deviceId: string) => {
        onRemoveNode(deviceId);
        deleteSetsRef.current[ChartEntitiesEnum.DEVICES].add(deviceId);
      },
      [onRemoveNode]
    );

    //delete line from both chart and database
    const onDeleteLine = useCallback(
      (line: Edge) => {
        onRemoveEdge(line);
        deleteSetsRef.current[ChartEntitiesEnum.LINES].add(line.id);
      },
      [onRemoveEdge]
    );

    const onEditLine = useCallback(
      (line: Edge) => {
        setSelectedEditLine(line);
        setEditLineDialogOpen(true);
      },
      [setEditLineDialogOpen, setSelectedEditLine]
    );

    const onDeletePort = useCallback(
      (portId: string, deviceId: string) => {
        onRemoveHandle(deviceId, portId);
        deleteSetsRef.current[ChartEntitiesEnum.PORTS].add(portId);
      },
      [onRemoveHandle]
    );

    const onEditPortSubmit = useCallback(
      async ({ name, type }: PortFormValues) => {
        if (!editPortTarget) return;
        const { port, deviceId } = editPortTarget;
        try {
          await updatePort(port.id, { name, type });
          applyChartChange((prev) => ({
            ...prev,
            devicesOnChart: prev.devicesOnChart.map((doc) => {
              if (doc.device.id !== deviceId) return doc;
              const updatedPort = (p: Port) =>
                p.id === port.id ? { ...p, name, type } : p;
              const updatedHandle = (h: { port: Port }) =>
                h.port.id === port.id ? { ...h, port: { ...h.port, name, type } } : h;
              return {
                ...doc,
                device: { ...doc.device, ports: doc.device.ports.map(updatedPort) },
                handles: {
                  left: (doc.handles.left ?? []).map(updatedHandle),
                  right: (doc.handles.right ?? []).map(updatedHandle),
                  top: (doc.handles.top ?? []).map(updatedHandle),
                  bottom: (doc.handles.bottom ?? []).map(updatedHandle),
                },
              };
            }),
          } as Chart));
          setDirty(true);
        } catch (e) {
          console.error("Failed to update port:", e);
        }
        setEditPortTarget(null);
      },
      [editPortTarget, applyChartChange, setDirty]
    );

    const onConfirmDialogConfirm = useCallback(() => {
      if (!pandingDelete.kind) return;
      try {
        if (pandingDelete.kind === "devices") {
          onDeleteDevice((pandingDelete.value as Node).id);
        }
        if (pandingDelete.kind === "lines") {
          onDeleteLine(pandingDelete.value as Edge);
        }
        if (pandingDelete.kind === "ports") {
          const { portId, deviceId } = pandingDelete.value as unknown as { portId: string; deviceId: string };
          onDeletePort(portId, deviceId);
        }
      } catch (e) {
        console.log("Delete failed: ", e);
      }
      setPandingDelete({ value: null });
      setConfirmDeleteOpen(false);
    }, [onDeleteDevice, onDeleteLine, onDeletePort, pandingDelete.kind, pandingDelete.value]);

    const onconfigDialofClose = useCallback(() => {
      setPandingDelete({ value: null });
      setConfirmDeleteOpen(false);
    }, []);

    const onEditLineDialogClose = useCallback(() => {
      setEditLineDialogOpen(false);
      setSelectedEditLine(null);
    }, [setEditLineDialogOpen, setSelectedEditLine]);

    const onEditLineDialgSubmit = useCallback(
      (newValue: EditLineDialogFormResponse) => {
        applyChartChange((prev) => {
          return {
            ...prev,
            linesOnChart: prev.linesOnChart.map((loc) => {
              return loc.line.id === selectedEditLine?.id
                ? ({
                    ...loc,
                    label: newValue.label,
                  } as LineOnChart as LineOnChart)
                : loc;
            }),
          } as Chart;
        });

        setEditLineDialogOpen(false);
        setMadeChanges(true);
      },
      [applyChartChange, selectedEditLine?.id, setMadeChanges]
    );

    const updateDeviceOnChart = useCallback(
      (deviceOnChart: DeviceOnChart) => {
        const { device, handles } = deviceOnChart;
        applyChartChange((prev) => {
          return {
            ...prev,
            devicesOnChart: prev.devicesOnChart.map((doc) =>
              doc.device.id === device.id ? { ...doc, handles, device } : doc
            ),
          } as Chart;
        });
        setDirty(true);
      },
      [applyChartChange, setDirty]
    );

    const onEditDeviceSubmit = useCallback(
      async (formData: any) => {
        if (!editDeviceTarget) return;
        try {
          const updated: Device = await updateDeviceMut.mutateAsync({
            ...formData,
            id: editDeviceTarget.device.id,
          } as Device);
          updateDeviceOnChart({
            ...editDeviceTarget,
            device: {
              ...editDeviceTarget.device,
              name: updated.name ?? editDeviceTarget.device.name,
              ipAddress: updated.ipAddress ?? editDeviceTarget.device.ipAddress,
              model: updated.model ?? editDeviceTarget.device.model,
              type: updated.type ?? editDeviceTarget.device.type,
            },
          });
        } catch (e) {
          console.error("Failed to update device:", e);
        }
        setEditDeviceTarget(null);
      },
      [editDeviceTarget, updateDeviceMut, updateDeviceOnChart]
    );

    const greenPortIds = useMemo(() => {
      const inChartLines = new Set<string>();
      for (const loc of chart.linesOnChart) {
        inChartLines.add(loc.line.sourcePort.id);
        inChartLines.add(loc.line.targetPort.id);
      }
      // Only ports actually placed as handles on chart nodes
      const handlePortIds = new Set<string>();
      for (const doc of chart.devicesOnChart) {
        for (const side of ["left", "right", "top", "bottom"] as const) {
          for (const h of doc.handles[side] ?? []) handlePortIds.add(h.port.id);
        }
      }
      const green = new Set<string>();
      for (const doc of chart.devicesOnChart) {
        for (const port of doc.device.ports) {
          if (
            handlePortIds.has(port.id) &&
            !inChartLines.has(port.id) &&
            port.connectedPortId &&
            handlePortIds.has(port.connectedPortId)
          ) {
            green.add(port.id);
          }
        }
      }
      return green;
    }, [chart.linesOnChart, chart.devicesOnChart]);

    greenPortIdsRef.current = greenPortIds;

    useEffect(() => {
      if (greenPortIds.size > 0) setPairedToastOpen(true);
      else setPairedToastOpen(false);
    }, [greenPortIds]);

    const connectPairedPorts = useCallback(
      (specificPortIds?: string[]) => {
        const idsToProcess = specificPortIds ? new Set(specificPortIds) : greenPortIds;
        const newLines: LineOnChart[] = [];
        const processed = new Set<string>();

        for (const doc of chart.devicesOnChart) {
          for (const port of doc.device.ports) {
            if (!idsToProcess.has(port.id) || processed.has(port.id) || !port.connectedPortId) continue;
            let targetPort: Port | undefined;
            for (const doc2 of chart.devicesOnChart) {
              targetPort = doc2.device.ports.find((p) => p.id === port.connectedPortId);
              if (targetPort) break;
            }
            if (!targetPort) continue;
            const existingLineId = pendingBondRef.current?.lineMap.get(`${port.id}:${targetPort.id}`)
              ?? pendingBondRef.current?.lineMap.get(`${targetPort.id}:${port.id}`);
            const newLine: LineOnChart = {
              chartId: chart.id,
              line: { id: existingLineId ?? uuidv4(), sourcePort: port, targetPort } as Line,
              type: "step",
              label: "",
            };
            port.inUse = true;
            targetPort.inUse = true;
            newLines.push(newLine);
            processed.add(port.id);
            processed.add(port.connectedPortId);
          }
        }
        if (!newLines.length) return;
        setEdges((eds) => [...eds, ...newLines.map(convertLineToEdge)]);
        setMadeChanges(true);

        // If user arrived here via the bond toast flow, also surface the bond bridge node
        const pendingBond = pendingBondRef.current;
        pendingBondRef.current = null;

        applyChartChange((prev) => {
          const next: Chart = { ...prev, linesOnChart: [...prev.linesOnChart, ...newLines] };
          if (!pendingBond) return next;

          const newLineIds = newLines.map((l) => l.line.id);
          // Check if this bond is already on the chart
          const existingBoc = next.bondsOnChart.find((b) => b.bond.id === pendingBond.bondId);
          if (existingBoc) {
            return {
              ...next,
              bondsOnChart: next.bondsOnChart.map((b) =>
                b.bond.id === pendingBond.bondId
                  ? { ...b, bond: { ...b.bond, membersLines: [...b.bond.membersLines, ...newLineIds] } }
                  : b
              ),
            } as Chart;
          }

          // Compute bridge position: average midpoint of all connected device pairs
          const docByDeviceId = new Map(prev.devicesOnChart.map((d) => [d.device.id, d]));
          let cx = 0, cy = 0, cnt = 0;
          for (const loc of newLines) {
            const src = docByDeviceId.get(loc.line.sourcePort.deviceId)?.position;
            const tgt = docByDeviceId.get(loc.line.targetPort.deviceId)?.position;
            if (!src || !tgt) continue;
            cx += (src.x + tgt.x) / 2;
            cy += (src.y + tgt.y) / 2;
            cnt++;
          }
          if (cnt > 0) { cx /= cnt; cy /= cnt; }

          const bondOnChart: BondOnChart = {
            chartId: prev.id,
            bond: { id: pendingBond.bondId, name: pendingBond.bondName, membersLines: newLineIds } as Bond,
            position: { x: cx - 42, y: cy - 24 },
          };
          return { ...next, bondsOnChart: [...(next.bondsOnChart ?? []), bondOnChart] } as Chart;
        });
      },
      [chart, greenPortIds, convertLineToEdge, setEdges, setMadeChanges, applyChartChange]
    );

    const onPortAdded = useCallback(async (portId: string, deviceId: string, side: Side) => {
      const [bondResult, connectedPort] = await Promise.all([
        fetchBondPortSiblings(portId, deviceId),
        fetchConnectedPortInfo(portId),
      ]);

      if (bondResult && bondResult.sameSide.length > 0) {
        setBondSiblingToast({ result: bondResult, deviceId, side });
        return;
      }

      if (connectedPort) {
        const currentChart = chartRef.current;
        const alreadyOnChart = currentChart.devicesOnChart.some((doc) =>
          (["left", "right", "top", "bottom"] as Side[]).some((s) =>
            doc.handles[s]?.some((h) => h.port.id === connectedPort.id)
          )
        );
        if (!alreadyOnChart) {
          const deviceName =
            devicesByIdRef.current.get(connectedPort.deviceId)?.name ??
            "Unknown Device";
          setConnectedPortToast({
            connectedPort,
            triggeredPortId: portId,
            triggeredDeviceId: deviceId,
            deviceName,
            side,
          });
        }
      }
    }, []);

    const onBondSiblingAdd = useCallback(() => {
      if (!bondSiblingToast) return;
      const { result, deviceId, side } = bondSiblingToast;

      applyChartChange((prev) => ({
        ...prev,
        devicesOnChart: prev.devicesOnChart.map((doc) => {
          if (doc.device.id !== deviceId) return doc;
          const existingHandleIds = new Set([
            ...(doc.handles.left ?? []).map((h) => h.port.id),
            ...(doc.handles.right ?? []).map((h) => h.port.id),
            ...(doc.handles.top ?? []).map((h) => h.port.id),
            ...(doc.handles.bottom ?? []).map((h) => h.port.id),
          ]);
          const newHandles = result.sameSide
            .filter((p) => !existingHandleIds.has(p.id))
            .map((p) => ({ port: p }));
          return {
            ...doc,
            device: {
              ...doc.device,
              ports: doc.device.ports.map((p) => {
                const updated = result.sameSide.find((s) => s.id === p.id);
                return updated ? { ...p, connectedPortId: updated.connectedPortId } : p;
              }),
            },
            handles: {
              ...doc.handles,
              [side]: [...(doc.handles[side] ?? []), ...newHandles],
            },
          };
        }),
      } as Chart));

      const lineMap = new Map<string, string>();
      for (const { lineId, sourcePortId, targetPortId } of result.memberLinePairs) {
        lineMap.set(`${sourcePortId}:${targetPortId}`, lineId);
        lineMap.set(`${targetPortId}:${sourcePortId}`, lineId);
      }
      pendingBondRef.current = { bondId: result.bondId, bondName: result.bondName, lineMap };
      setBondSiblingToast(null);
      if (result.otherSide.length > 0) {
        setBondOtherSideToast({ result, side });
      }
    }, [bondSiblingToast, applyChartChange]);

    const onBondOtherSideAdd = useCallback(() => {
      if (!bondOtherSideToast) return;
      const { result, side } = bondOtherSideToast;

      applyChartChange((prev) => {
        let next = { ...prev, devicesOnChart: [...prev.devicesOnChart] };
        for (const { deviceId: otherDeviceId, ports: otherPorts } of result.otherSide) {
          const existing = next.devicesOnChart.find((d) => d.device.id === otherDeviceId);
          if (existing) {
            const existingHandleIds = new Set([
              ...(existing.handles.left ?? []).map((h) => h.port.id),
              ...(existing.handles.right ?? []).map((h) => h.port.id),
              ...(existing.handles.top ?? []).map((h) => h.port.id),
              ...(existing.handles.bottom ?? []).map((h) => h.port.id),
            ]);
            const newHandles = otherPorts
              .filter((p) => !existingHandleIds.has(p.id))
              .map((p) => ({ port: p }));
            next = {
              ...next,
              devicesOnChart: next.devicesOnChart.map((doc) =>
                doc.device.id === otherDeviceId
                  ? {
                      ...doc,
                      device: {
                        ...doc.device,
                        ports: doc.device.ports.map((p) => {
                          const updated = otherPorts.find((op) => op.id === p.id);
                          return updated ? { ...p, connectedPortId: updated.connectedPortId } : p;
                        }),
                      },
                      handles: {
                        ...doc.handles,
                        [side]: [...(doc.handles[side] ?? []), ...newHandles],
                      },
                    }
                  : doc
              ),
            };
          } else {
            const device = devicesByIdRef.current.get(otherDeviceId);
            if (!device) continue;
            const enrichedDevice: Device = {
              ...device,
              ports: device.ports.map((p) => {
                const bondPort = otherPorts.find((op) => op.id === p.id);
                return bondPort ? { ...p, connectedPortId: bondPort.connectedPortId } : p;
              }),
            };
            next = {
              ...next,
              devicesOnChart: [
                ...next.devicesOnChart,
                {
                  chartId: prev.id,
                  device: enrichedDevice,
                  position: { x: 150 + Math.random() * 300, y: 150 + Math.random() * 300 },
                  handles: {
                    left: [],
                    right: [],
                    top: [],
                    bottom: [],
                    [side]: otherPorts.map((p) => ({ port: p })),
                  },
                } as DeviceOnChart,
              ],
            };
          }
        }
        return next as Chart;
      });

      setBondOtherSideToast(null);
      setMadeChanges(true);
    }, [bondOtherSideToast, applyChartChange, setMadeChanges]);

    const onConnectedPortAdd = useCallback(() => {
      if (!connectedPortToast) return;
      const { connectedPort, triggeredPortId, triggeredDeviceId, side } = connectedPortToast;
      const enrichedConnectedPort: Port = { ...connectedPort, connectedPortId: triggeredPortId };

      applyChartChange((prev) => {
        // 1) Set connectedPortId on the port that was just added
        let next: Chart = {
          ...prev,
          devicesOnChart: prev.devicesOnChart.map((doc) => {
            if (doc.device.id !== triggeredDeviceId) return doc;
            return {
              ...doc,
              device: {
                ...doc.device,
                ports: doc.device.ports.map((p) =>
                  p.id === triggeredPortId ? { ...p, connectedPortId: connectedPort.id } : p
                ),
              },
            };
          }),
        } as Chart;

        // 2) Add the connected port — either to an existing device or a new one
        const existingDoc = next.devicesOnChart.find((d) => d.device.id === connectedPort.deviceId);
        if (existingDoc) {
          const existingHandleIds = new Set([
            ...(existingDoc.handles.left ?? []).map((h) => h.port.id),
            ...(existingDoc.handles.right ?? []).map((h) => h.port.id),
            ...(existingDoc.handles.top ?? []).map((h) => h.port.id),
            ...(existingDoc.handles.bottom ?? []).map((h) => h.port.id),
          ]);
          if (existingHandleIds.has(connectedPort.id)) return next;
          next = {
            ...next,
            devicesOnChart: next.devicesOnChart.map((doc) => {
              if (doc.device.id !== connectedPort.deviceId) return doc;
              return {
                ...doc,
                device: {
                  ...doc.device,
                  ports: doc.device.ports.map((p) =>
                    p.id === connectedPort.id ? { ...p, connectedPortId: triggeredPortId } : p
                  ),
                },
                handles: {
                  ...doc.handles,
                  [side]: [...(doc.handles[side] ?? []), { port: enrichedConnectedPort }],
                },
              };
            }),
          } as Chart;
        } else {
          const device = devicesByIdRef.current.get(connectedPort.deviceId);
          if (!device) return next;
          const enrichedDevice: Device = {
            ...device,
            ports: device.ports.map((p) =>
              p.id === connectedPort.id ? { ...p, connectedPortId: triggeredPortId } : p
            ),
          };
          next = {
            ...next,
            devicesOnChart: [
              ...next.devicesOnChart,
              {
                chartId: prev.id,
                device: enrichedDevice,
                position: { x: 150 + Math.random() * 300, y: 150 + Math.random() * 300 },
                handles: {
                  left: [],
                  right: [],
                  top: [],
                  bottom: [],
                  [side]: [{ port: enrichedConnectedPort }],
                },
              } as DeviceOnChart,
            ],
          } as Chart;
        }
        return next;
      });

      setConnectedPortToast(null);
    }, [connectedPortToast, applyChartChange]);

    const convertDeviceToNode = useCallback(
      (deviceOnChart: DeviceOnChart): Node => {
        const { device, position } = deviceOnChart;
        const node: Node = {
          id: device.id,
          type: "device",
          position,
          data: {
            deviceOnChart: deviceOnChart,
            editMode,
            updateDeviceOnChart,
            onRemoveNode,
            onHandleContextMenu,
            greenPortIds,
            onPortAdded,
          } as DeviceNodeData,
        };
        return node;
      },
      [editMode, onHandleContextMenu, onRemoveNode, updateDeviceOnChart, greenPortIds, onPortAdded]
    );

    const updateNoteContent = useCallback(
      (id: string, content: string) => {
        applyChartChange((prev) => ({
          ...prev,
          notesOnChart: (prev.notesOnChart ?? []).map((n) =>
            n.id === id ? { ...n, content } : n
          ),
        } as Chart));
      },
      [applyChartChange]
    );

    const updateNoteSize = useCallback(
      (id: string, width: number, height: number) => {
        applyChartChange((prev) => ({
          ...prev,
          notesOnChart: (prev.notesOnChart ?? []).map((n) =>
            n.id === id ? { ...n, size: { width, height } } : n
          ),
        } as Chart));
      },
      [applyChartChange]
    );

    const convertNoteToNode = useCallback(
      (note: NoteOnChart): Node => ({
        id: note.id,
        type: "note",
        position: note.position,
        style: { width: note.size.width, height: note.size.height },
        data: {
          note,
          editMode,
          onContentChange: updateNoteContent,
          onSizeChange: updateNoteSize,
        } as NoteNodeData,
      }),
      [editMode, updateNoteContent, updateNoteSize]
    );

    const { data: availableDevicesResponse } = useListAssets("devices", {
      page: 0,
      pageSize: 100000,
    });

    const usedIds = useMemo(
      () => new Set(chart.devicesOnChart.map((d) => d.device.id)),
      [chart.devicesOnChart]
    );

    const availableDevices = useMemo(() => {
      const all = availableDevicesResponse?.rows ?? [];
      const deleted = deleteSetsRef.current.devices;
      return deleted.size ? all.filter((d) => !deleted.has(d.id)) : all;
    }, [availableDevicesResponse, deleteSetsRef]);

    // Devices not yet placed
    const unusedDevices = useMemo(() => {
      return availableDevices.filter((dev) => !usedIds.has(dev.id));
    }, [usedIds, availableDevices]);

    const devicesById = useMemo<Map<string, Device>>(
      () =>
        new Map(
          availableDevices.map((d: Device): [string, Device] => [d.id, d])
        ),
      [availableDevices]
    );
    devicesByIdRef.current = devicesById;
    chartRef.current = chart;

    const buildBridgeView = useCallback((bondsOnChart : BondOnChart[],linesOnChart:LineOnChart[]) => {
      const bridgeNodes: Node<BondBridgeNodeData>[] = [];
      const splitEdges: Edge[] = [];
      const bridgedLineIds = new Set<string>();

      // stable order for handles
      const byAngle = (
        cx: number,
        cy: number,
        devA: { x: number; y: number },
        devB: { x: number; y: number }
      ) => {
        const mx = (devA.x + devB.x) / 2,
          my = (devA.y + devB.y) / 2;
        return Math.atan2(my - cy, mx - cx);
      };

      for (const b of bondsOnChart) {
        console.log(b)
        const members: LineOnChart[] = linesOnChart.filter((loc) =>
          b.bond.membersLines.includes(loc.line.id)
        );
        if (members.length < 2) continue;

        const orientation: Orientation = pickOrientation(b.bond);
        // auto position: average of member midpoints
        const {x:cx,y:cy} = getBondCenterPos(members)
        const nodeId = `bridge-${b.bond.id}`;

        // order handles by angle around bridge center for nicer bundling
        const membersSorted = [...members].sort((L1, L2) => {
          const a1 = devicePos.get(L1.line.sourcePort.deviceId)!;
          const b1 = devicePos.get(L1.line.targetPort.deviceId)!;
          const a2 = devicePos.get(L2.line.sourcePort.deviceId)!;
          const b2 = devicePos.get(L2.line.targetPort.deviceId)!;
          return byAngle(cx, cy, a1, b1) - byAngle(cx, cy, a2, b2);
        });

        // create node
        bridgeNodes.push({
          id: nodeId,
          type: "bridge",
          position: b.position,
          draggable: true,
          selectable: true,
          zIndex: 10,
          data: {
            bond: b.bond,
            orientation,
            onRename: (txt: string) => {
              //setBridges(prev => prev.map(x => x.id === b.id ? { ...x, name: txt } : x));
              setMadeChanges(true);
            },
          },
        } as Node);

        // per-member split edges
        membersSorted.forEach((loc, idx) => {
          bridgedLineIds.add(loc.line.id);

          const A = devicePos.get(loc.line.sourcePort.deviceId)!;
          const B = devicePos.get(loc.line.targetPort.deviceId)!;

          // Decide which end goes to the “first side” based on orientation:
          //  - "lr": smaller x → Left; larger x → Right
          //  - "tb": smaller y → Top;  larger y → Bottom
          const sourceFirst =
            orientation === Orientation.LeftToright ? A.x <= B.x : A.y <= B.y;

          const leftOrTopHandle =
            orientation === Orientation.LeftToright
              ? `${nodeId}-L-${idx}`
              : `${nodeId}-T-${idx}`;
          const rightOrBottomHandle =
            orientation === Orientation.LeftToright
              ? `${nodeId}-R-${idx}`
              : `${nodeId}-B-${idx}`;

          const edgeA: Edge = sourceFirst
            ? {
                id: `${loc.line.id}-a`,
                source: loc.line.sourcePort.deviceId,
                sourceHandle: loc.line.sourcePort.id,
                target: nodeId,
                targetHandle: leftOrTopHandle,
                type: "step",
                data: { lineId: loc.line.id },
                // avoid editing reconnection on split view
                updatable: false,
              } as Edge
            : {
                id: `${loc.line.id}-a`,
                source: loc.line.targetPort.deviceId,
                sourceHandle: loc.line.targetPort.id,
                target: nodeId,
                targetHandle: leftOrTopHandle,
                type: "step",
                data: { lineId: loc.line.id },
                updatable: false,
              } as Edge;

          const edgeB: Edge = sourceFirst
            ? {
                id: `${loc.line.id}-b`,
                source: nodeId,
                sourceHandle: rightOrBottomHandle,
                target: loc.line.targetPort.deviceId,
                targetHandle: loc.line.targetPort.id,
                type: "step",
                data: { lineId: loc.line.id },
                updatable: false,
              } as Edge
            : {
                id: `${loc.line.id}-b`,
                source: nodeId,
                sourceHandle: rightOrBottomHandle,
                target: loc.line.sourcePort.deviceId,
                targetHandle: loc.line.sourcePort.id,
                type: "step",
                data: { lineId: loc.line.id },
                updatable: false,
              } as Edge;

          splitEdges.push(edgeA, edgeB);
        });
      }

      // Non-bridged lines render as usual
      const plainEdges = linesOnChart
        .filter((l) => !bridgedLineIds.has(l.line.id))
        .map(convertLineToEdge);

      return { bridgeNodes, displayEdges: [...plainEdges, ...splitEdges] };
    }, [devicePos, getBondCenterPos, pickOrientation, setMadeChanges]);

    useEffect(() => {
      setNodes((prev) => {
        const prevById = new Map(prev.map((n) => [n.id, n]));

        const devicesNodes: Node[] = chart.devicesOnChart.map((doc) => {
          const base = convertDeviceToNode(doc); // fresh node from chart
          const old = prevById.get(base.id);

          // preserve transient UI state from prev
          return old
            ? {
                ...base,
                selected: old.selected,
              }
            : base;
        });
        const { bridgeNodes } = buildBridgeView(chart.bondsOnChart,chart.linesOnChart);
        const noteNodes: Node[] = (chart.notesOnChart ?? []).map(convertNoteToNode);
        return [...devicesNodes, ...bridgeNodes, ...noteNodes];
      });
    }, [buildBridgeView, chart.bondsOnChart, chart.devicesOnChart, chart.linesOnChart, chart.notesOnChart, convertDeviceToNode, convertNoteToNode, setNodes]);

    useEffect(() => {
      const { displayEdges } = buildBridgeView(chart.bondsOnChart,chart.linesOnChart);
      setEdges(displayEdges);
    }, [buildBridgeView, chart.bondsOnChart, chart.linesOnChart, setEdges]);

    const onNodesChange = useCallback(
      (changes: NodeChange[]) => {
        onNodesChangeRF(changes);
      },
      [onNodesChangeRF]
    );
    const onEdgesChange = useCallback(
      (changes: EdgeChange[]) => {
        onEdgesChangeRF(changes);
      },
      [onEdgesChangeRF]
    );

    const onConnect = useCallback(
      (c: Connection) => {
        const newId: string = uuidv4();
        const sourcePort: Port = chart.devicesOnChart
          .find((d) => d.device.id === c.source)!
          .device.ports.find((p) => p.id === c.sourceHandle)!;
        const targetPort: Port = chart.devicesOnChart
          .find((d) => d.device.id === c.target)!
          .device.ports.find((p) => p.id === c.targetHandle)!;
        if (sourcePort.type !== targetPort.type) {
          setPortTypeMismatch(true);
          return;
        }
        const newLine: LineOnChart = {
          chartId: chart.id,
          line: {
            id: newId,
            sourcePort,
            targetPort,
          } as Line,
          type: "step",
          label: "",
        };
        sourcePort.inUse = true;
        targetPort.inUse = true;

        setEdges((eds) => [...eds, convertLineToEdge(newLine)]);
        setMadeChanges(true);
        applyChartChange((prev) => {
          return {
            ...prev,
            linesOnChart: [...prev.linesOnChart, newLine],
            devicesOnChart: prev.devicesOnChart.map((doc) => {
              return {
                ...doc,
                device: {
                  ...doc.device,
                  ports: doc.device.ports.find(
                    (p) => p.id === sourcePort.id && p.id === targetPort.id
                  )
                    ? [
                        ...doc.device.ports.filter(
                          (p) =>
                            p.id === sourcePort.id || p.id === targetPort.id
                        ),
                        sourcePort,
                        targetPort,
                      ]
                    : doc.device.ports,
                } as Device,
              } as DeviceOnChart;
            }),
          } as Chart;
        });
      },
      [
        chart.devicesOnChart,
        chart.id,
        setEdges,
        setMadeChanges,
        applyChartChange,
      ]
    );

    const onReconnect = useCallback(
      (oldEdge: Edge, newConnection: Connection) => {
        applyChartChange((prev) => {
          const newSourcDevice: DeviceOnChart | undefined =
            prev.devicesOnChart.find(
              (doc) => doc.device.id === newConnection.source
            );
          const newTargetDevice: DeviceOnChart | undefined =
            prev.devicesOnChart.find(
              (doc) => doc.device.id === newConnection.target
            );
          const newSourcePort: Port | undefined =
            newSourcDevice?.device.ports.find(
              (p) => p.id === newConnection.sourceHandle
            );
          const newTargetePort: Port | undefined =
            newTargetDevice?.device.ports.find(
              (p) => p.id === newConnection.targetHandle
            );

          if (
            !newSourcDevice ||
            !newTargetDevice ||
            !newSourcePort ||
            !newTargetePort
          )
            return prev;

          newSourcePort.inUse = true;
          newTargetePort.inUse = true;

          return {
            ...prev,
            linesOnChart: prev.linesOnChart.map((loc) => {
              return loc.line.id === oldEdge.id
                ? ({
                    ...loc,
                    line: {
                      ...loc.line,
                      sourcePort: newSourcePort,
                      targetPort: newTargetePort,
                    } as Line,
                  } as LineOnChart)
                : loc;
            }),
            devicesOnChart: prev.devicesOnChart.map((doc) => {
              return doc.device.id === newSourcDevice.device.id ||
                doc.device.id === newTargetDevice.device.id ||
                doc.device.id === oldEdge.target ||
                doc.device.id === oldEdge.source
                ? ({
                    ...doc,
                    device: {
                      ...doc.device,
                      ports: doc.device.ports.map((p) => {
                        return (p.id === oldEdge.sourceHandle &&
                          p.id !== newSourcePort.id) ||
                          p.id === oldEdge.targetHandle
                          ? ({ ...p, inUse: false } as Port)
                          : p.id === newSourcePort.id
                          ? newSourcePort
                          : p.id === newTargetePort.id
                          ? newTargetePort
                          : p;
                      }),
                    },
                  } as DeviceOnChart)
                : doc;
            }),
          } as Chart;
        });

        setEdges((els) => reconnectEdge(oldEdge, newConnection, els));
        setMadeChanges(true);
      },

      [applyChartChange, setEdges, setMadeChanges]
    );
    const onDragOver = useCallback(
      (e: React.DragEvent) => {
        if (!editMode) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      },
      [editMode]
    );

    const onNodeDragStop = useCallback(
      (_e: React.MouseEvent, node: Node) => {

        if (node.type === "bridge") {
          const bondId = node.id.replace("bridge-", "");
          applyChartChange((prev) => ({
            ...prev,
            bondsOnChart: (prev.bondsOnChart ?? []).map((b) =>
              b.bond.id === bondId ? { ...b, position: node.position } : b
            ),
          } as Chart));

        } else if (node.type === "device") {
          applyChartChange(
            (prev) =>
              ({
                ...prev,
                devicesOnChart: prev.devicesOnChart.map((loc) =>
                  loc.device.id === node.id
                    ? { ...loc, position: node.position }
                    : loc
                ),
              } as Chart)
          );
        } else if (node.type === "note") {
          applyChartChange((prev) => ({
            ...prev,
            notesOnChart: (prev.notesOnChart ?? []).map((n) =>
              n.id === node.id ? { ...n, position: node.position } : n
            ),
          } as Chart));
        }
      },
      [applyChartChange]
    );

    const onDrop = useCallback(
      async (e: React.DragEvent) => {
        if (!editMode || !reactFlowWrapper.current) return;
        e.preventDefault();

        // ── Chart element drop (e.g. Note) ──
        const elementRaw = e.dataTransfer.getData("application/reactflow-element");
        if (elementRaw) {
          try {
            const { type } = JSON.parse(elementRaw) as { type: string };
            if (type === "note") {
              const bounds = reactFlowWrapper.current.getBoundingClientRect();
              const position = project({
                x: e.clientX - bounds.left,
                y: e.clientY - bounds.top,
              });
              const newNote: NoteOnChart = {
                id: uuidv4(),
                content: "",
                position,
                size: { width: 220, height: 130 },
              };
              applyChartChange((prev) => ({
                ...prev,
                notesOnChart: [...(prev.notesOnChart ?? []), newNote],
              } as Chart));
            }
          } catch {
            // ignore malformed element data
          }
          return;
        }

        // ── Device drop ──
        const deviceId = e.dataTransfer.getData("application/reactflow");
        if (!deviceId) return;

        const device: Device | undefined = devicesById.get(deviceId);
        if (!device) return;
        const bounds = reactFlowWrapper.current.getBoundingClientRect();
        const position = project({
          x: e.clientX - bounds.left,
          y: e.clientY - bounds.top,
        });
        const defaultHandles: Handles = {
          left: [],
          right: [],
          top: [],
          bottom: [],
        };

        // Fetch connected port IDs from backend for all inUse ports on the
        // dropped device, then merge with any already-known connectedPortId
        // data from devices currently on the chart.
        const inUsePorts = device.ports.filter((p) => p.inUse).map((p) => p.id);
        const apiMap = await fetchConnectedPortIds(inUsePorts);

        const connectedMap = new Map<string, string>(Object.entries(apiMap));
        for (const doc of chart.devicesOnChart) {
          for (const p of doc.device.ports) {
            if (p.connectedPortId && !connectedMap.has(p.id)) {
              connectedMap.set(p.id, p.connectedPortId);
              connectedMap.set(p.connectedPortId, p.id);
            }
          }
        }

        const enrich = (d: Device): Device =>
          connectedMap.size
            ? {
                ...d,
                ports: d.ports.map((p) =>
                  !p.connectedPortId && connectedMap.has(p.id)
                    ? { ...p, connectedPortId: connectedMap.get(p.id) }
                    : p
                ),
              }
            : d;

        const enrichedDevice = enrich(device);

        const newNode: Node = convertDeviceToNode({
          device: enrichedDevice,
          position,
          handles: defaultHandles,
        } as DeviceOnChart);
        setNodes((nds) => [...nds, newNode]);

        applyChartChange((prev) => {
          return {
            ...chart,
            devicesOnChart: [
              // Re-enrich existing devices in case they are the "other side"
              // of a pair whose connectedPortId we just learned from the API.
              ...chart.devicesOnChart.map((doc) => ({
                ...doc,
                device: enrich(doc.device),
              })),
              {
                chartId: chart.id,
                device: enrichedDevice,
                position,
                handles: defaultHandles,
              } as DeviceOnChart,
            ],
          } as Chart;
        });
        setMadeChanges(true);
      },
      [
        editMode,
        devicesById,
        project,
        convertDeviceToNode,
        setNodes,
        applyChartChange,
        setMadeChanges,
        chart,
      ]
    );
    const onEdgeUpdate = useCallback(
      (oldE: Edge, conn: Connection) => {
        setEdges((eds) => reconnectEdge(oldE, conn, eds));
      },
      [setEdges]
    );
    

    const onCtxAction = useCallback(
      (action: EditorMenuListKeys) => {
        const { payload } = ctx;

        setMadeChanges(true);
        switch (action) {
          case EditorMenuListKeys.UNDO:
            onUndoClick();
            break;
          case EditorMenuListKeys.REDO:
            onRedoClick();
            break;
          case EditorMenuListKeys.Add_DDEVICE_TO_CHART:
            break;

          case EditorMenuListKeys.DELETE_DEVICE:
            setPandingDelete({ value: payload.node, kind: "devices" });
            setConfirmDialogTitle("Delete Device?");
            setConfirmDialogDescription(
              "Are you shure you want to permenantly delete device: <add device name>"
            );
            setConfirmDeleteOpen(true);
            break;

          case EditorMenuListKeys.EDIT_DEVICE: {
            const doc = chart.devicesOnChart.find(d => d.device.id === payload.node.id);
            if (doc) setEditDeviceTarget(doc);
            break;
          }

          case EditorMenuListKeys.EDIT_PORTS: {
            const deviceId =
              ctx.kind === "handle" ? payload.deviceId : payload.node.id;
            const doc = chart.devicesOnChart.find(
              (d) => d.device.id === deviceId
            );
            if (doc) setPortsEditorDevice(doc);
            break;
          }

          case EditorMenuListKeys.REMOVE_DEVICE_FROM_CHART:
            onRemoveNode(payload.node.id);
            break;

          case EditorMenuListKeys.EDIT_LINE:
            onEditLine(payload.edge);
            break;

          case EditorMenuListKeys.REMOVE_LINE_FROM_CHART:
            onRemoveEdge(payload.edge);
            break;

          case EditorMenuListKeys.DELETE_LINE:
            setPandingDelete({ value: payload.edge, kind: "lines" });
            setConfirmDialogTitle("Delete Line?");
            setConfirmDialogDescription(
              "Are you shure you want to permenantly delete line: " +
                payload.edge.label
            );
            setConfirmDeleteOpen(true);
            //onDeleteLine(payload.edge.id);
            break;

          case EditorMenuListKeys.BOND_LINES:
            createBond()
            break;

          case EditorMenuListKeys.EDIT_PORT: {
            const doc = chart.devicesOnChart.find(d => d.device.id === payload.deviceId);
            const port = doc?.device.ports.find(p => p.id === payload.portId);
            if (port) setEditPortTarget({ port, deviceId: payload.deviceId });
            break;
          }

          case EditorMenuListKeys.REMOVE_PORT:
            onRemoveHandle(payload.deviceId, payload.portId);
            break;

          case EditorMenuListKeys.DELETE_PORT: {
            const doc = chart.devicesOnChart.find(d => d.device.id === payload.deviceId);
            const port = doc?.device.ports.find(p => p.id === payload.portId);
            setPandingDelete({ value: { portId: payload.portId, deviceId: payload.deviceId } as unknown as Node, kind: "ports" });
            setConfirmDialogTitle("Delete Port?");
            setConfirmDialogDescription(`Permanently delete port "${port?.name ?? payload.portId}"?`);
            setConfirmDeleteOpen(true);
            break;
          }

          case EditorMenuListKeys.FIT:
            break;

          case EditorMenuListKeys.CONNECT_PAIRED_PORTS:
            if (ctx.kind === 'handle') {
              connectPairedPorts([payload.portId]);
            } else if (ctx.kind === 'node') {
              const doc = chart.devicesOnChart.find(d => d.device.id === payload.node.id);
              const deviceGreenPorts = doc?.device.ports
                .filter(p => greenPortIdsRef.current.has(p.id))
                .map(p => p.id) ?? [];
              connectPairedPorts(deviceGreenPorts);
            }
            break;

          case EditorMenuListKeys.MOVE_HANDLE_TO_LEFT:
            onMoveHandle(payload.deviceId, payload.portId, payload.side, 'left');
            break;
          case EditorMenuListKeys.MOVE_HANDLE_TO_RIGHT:
            onMoveHandle(payload.deviceId, payload.portId, payload.side, 'right');
            break;
          case EditorMenuListKeys.MOVE_HANDLE_TO_TOP:
            onMoveHandle(payload.deviceId, payload.portId, payload.side, 'top');
            break;
          case EditorMenuListKeys.MOVE_HANDLE_TO_BOTTOM:
            onMoveHandle(payload.deviceId, payload.portId, payload.side, 'bottom');
            break;
        }

        closeCtx();
      },
      [ctx, setMadeChanges, closeCtx, onRemoveNode, onEditLine, onRemoveEdge, connectPairedPorts, onMoveHandle, onUndoClick, onRedoClick, createBond, chart.devicesOnChart, onRemoveHandle, setEditPortTarget, setEditDeviceTarget]
    );

    const onSave = useCallback(
      async (e?: React.MouseEvent<HTMLButtonElement>) => {
        // prevent form submit refresh if inside a <form>
        e?.preventDefault();

        const payload: ChartUpdate = {
          ...chart,
          deletes: {
            devices: [...deleteSetsRef.current[ChartEntitiesEnum.DEVICES]],
            lines: [...deleteSetsRef.current[ChartEntitiesEnum.LINES]],
            ports: [...deleteSetsRef.current[ChartEntitiesEnum.PORTS]],
          },
        };
        try {
          const newChart: Chart = await updateMut.mutateAsync({
            id: chart.id,
            data: payload,
          });
          setDirty(false);
          return newChart;
        } catch (err: any) {
          console.error("updateChart failed:", err);
        }
        return null;
      },
      [
        chart.description,
        chart.devicesOnChart,
        chart.id,
        chart.linesOnChart,
        chart.name,
        chart.notesOnChart,
        setDirty,
        updateMut,
      ]
    );

    useImperativeHandle(
      ref,
      () => ({
        onSave,
        isChangesMade: () => dirtyRef.current,
      }),
      [onSave]
    );

    return (
      <div className="flex flex-1 h-full">
        <AnimatePresence initial={false}>
          {editMode && (
            <motion.div
              key="sidebar"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 192, opacity: 1 }} // 192px = 12rem
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex-none overflow-hidden border-r
             border-slate-200"
            >
              <DevicesSidebar devicesList={unusedDevices} />
            </motion.div>
          )}
        </AnimatePresence>
        <div
          ref={reactFlowWrapper}
          onDragOver={onDragOver}
          onDrop={onDrop}
          className="flex-1"
        >
          {ctx.open && (
            <>
              {/* click-away overlay */}
              <div
                onClick={closeCtx}
                onContextMenu={moveMenuTo}
                className="fixed inset-0 z-[9998] bg-transparent"
              />
              <div
                className={[
                  "fixed z-[9999] min-w-[180px] rounded-md border shadow-lg",
                  isDark
                    ? "bg-slate-800 border-slate-700 text-slate-100"
                    : "bg-white border-slate-200 text-slate-900",
                ].join(" ")}
                style={{ left: ctx.x, top: ctx.y }}
                onContextMenu={(e) => e.preventDefault()}
              >
                <MenuList
                  kind={ctx.kind}
                  onAction={onCtxAction}
                  isRedoEnabled={canRedo}
                  isUndoEnabled={canUndo}
                  canConnectPaired={ctx.canConnectPaired ?? false}
                />
              </div>
            </>
          )}
          <ReactFlow
            nodeTypes={nodeTypes}
            nodes={nodes}
            edges={edges}
            onNodesChange={editMode ? onNodesChange : undefined}
            onNodeDragStop={editMode ? onNodeDragStop : undefined}
            onEdgesChange={editMode ? onEdgesChange : undefined}
            onConnect={editMode ? onConnect : undefined}
            onEdgeUpdate={editMode ? onEdgeUpdate : undefined}
            onReconnect={editMode ? onReconnect : undefined}
            nodesDraggable={editMode}
            nodesConnectable={editMode}
            defaultEdgeOptions={{ type: ConnectionLineType.Step }}
            connectionLineType={ConnectionLineType.Step}
            onPaneContextMenu={editMode ? onPaneContextMenu : undefined}
            onNodeContextMenu={editMode ? onNodeContextMenu : undefined}
            onEdgeContextMenu={editMode ? onEdgeContextMenu : undefined}
            fitView
            style={{ width: "100%", height: "100%" }}
          >
            <Background color={isDark ? "#1f2937" : "#e5e7eb"} gap={16} />
            <Controls className={isDark ? "invert" : ""} />
          </ReactFlow>
        </div>
        <EditLineDialog
          isOpen={isEditlineDialogOpen}
          line={selectedEditLine ?? edges[0]}
          onClose={onEditLineDialogClose}
          onSubmit={onEditLineDialgSubmit}
        />
        <PortsEditorDialog
          open={portsEditorDevice !== null}
          deviceOnChart={portsEditorDevice}
          onClose={() => setPortsEditorDevice(null)}
          onConfirm={(newHandles) => {
            if (!portsEditorDevice) return;
            updateDeviceOnChart({ ...portsEditorDevice, handles: newHandles });
          }}
        />
        <PortFormDialog
          open={editPortTarget !== null}
          title="Edit Port"
          initial={editPortTarget ? { name: editPortTarget.port.name, type: editPortTarget.port.type } : undefined}
          onClose={() => setEditPortTarget(null)}
          onSubmit={onEditPortSubmit}
        />
        <AssetForm
          kind="devices"
          open={editDeviceTarget !== null}
          initial={editDeviceTarget?.device}
          onClose={() => setEditDeviceTarget(null)}
          onSubmit={onEditDeviceSubmit}
        />
        <ConfirmDialog
          open={confirmDeleteOpen}
          title={confimDialogTitle}
          description={confimDialogDescription}
          confirmText="Delete"
          confirmColor="error"
          loading={false}
          onCancel={onconfigDialofClose}
          onConfirm={onConfirmDialogConfirm}
        />
        <Snackbar
          open={portTypeMismatch}
          autoHideDuration={4000}
          onClose={() => setPortTypeMismatch(false)}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            severity="error"
            onClose={() => setPortTypeMismatch(false)}
          >
            Cannot connect ports of different types.
          </Alert>
        </Snackbar>
        <Snackbar
          open={bondSiblingToast !== null}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            severity="info"
            onClose={() => setBondSiblingToast(null)}
            action={
              <>
                <Button color="inherit" size="small" onClick={onBondSiblingAdd}>
                  Add
                </Button>
                <Button color="inherit" size="small" onClick={() => setBondSiblingToast(null)}>
                  Cancel
                </Button>
              </>
            }
          >
            Port is part of bond &ldquo;{bondSiblingToast?.result.bondName}&rdquo;.
            Add {bondSiblingToast?.result.sameSide.length} sibling port(s) to this device?
          </Alert>
        </Snackbar>
        <Snackbar
          open={bondOtherSideToast !== null}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            severity="info"
            onClose={() => setBondOtherSideToast(null)}
            action={
              <>
                <Button color="inherit" size="small" onClick={onBondOtherSideAdd}>
                  Add
                </Button>
                <Button color="inherit" size="small" onClick={() => setBondOtherSideToast(null)}>
                  Cancel
                </Button>
              </>
            }
          >
            Add the other side of bond &ldquo;{bondOtherSideToast?.result.bondName}&rdquo; to the chart?
          </Alert>
        </Snackbar>
        <Snackbar
          open={connectedPortToast !== null}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            severity="info"
            onClose={() => setConnectedPortToast(null)}
            action={
              <>
                <Button color="inherit" size="small" onClick={onConnectedPortAdd}>
                  Add
                </Button>
                <Button color="inherit" size="small" onClick={() => setConnectedPortToast(null)}>
                  Cancel
                </Button>
              </>
            }
          >
            Port &ldquo;{connectedPortToast?.connectedPort.name}&rdquo; on{" "}
            &ldquo;{connectedPortToast?.deviceName}&rdquo; is connected to this port.
            Add it to the chart?
          </Alert>
        </Snackbar>
        <Snackbar
          open={pairedToastOpen}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            severity="info"
            onClose={() => setPairedToastOpen(false)}
            action={
              <>
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => { connectPairedPorts(); setPairedToastOpen(false); }}
                >
                  Connect
                </Button>
                <Button color="inherit" size="small" onClick={() => setPairedToastOpen(false)}>
                  Cancel
                </Button>
              </>
            }
          >
            Paired ports detected — connect them?
          </Alert>
        </Snackbar>
      </div>
    );
  }
);
