import {
  ChartEntitiesEnum,
  type Chart,
  type ChartCreate,
  type Device,
  type DeviceOnChart,
  type Handles,
  type Line,
  type LineOnChart,
  type Port,
} from "@easy-charts/easycharts-types";
import { AnimatePresence, motion } from "framer-motion";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import type { Connection, Edge, EdgeChange, Node, NodeChange } from "reactflow";
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
import { useListAssets } from "../../hooks/assetsHooks";
import { DevicesSidebar } from "../ChartsViewer/DevicesSideBar";
import DeviceNode from "../DeviceNode/DeviceNode";
import type { DeviceNodeData } from "../DeviceNode/interfaces/deviceModes.interfaces";
import MenuList from "./EditoroMenuList";
import { useThemeMode } from "../../contexts/ThemeModeContext";
import { EditorMenuListKeys } from "./enums/EditorMenuListKeys.enum";
import type { DeleteSets } from "./interfaces/DeleteSets.interfaces";
import { updateChart } from "../../hooks/chartsHooks";
import type { ChartEditorHandle } from "./interfaces/chartEditorHandle.interfaces";

interface ChardEditorProps {
  chart: Chart;
  setChart: React.Dispatch<React.SetStateAction<Chart>>;
  editMode: boolean;
  setMadeChanges: React.Dispatch<React.SetStateAction<boolean>>;
}

export const ChartEditor = forwardRef<ChartEditorHandle, ChardEditorProps>(function ChartEditor(
  { chart, setChart, editMode, setMadeChanges }: ChardEditorProps,
  ref
) {
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { isDark } = useThemeMode();
  const nodeTypes = useMemo(() => ({ device: DeviceNode }), []);

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
    setCtx({
      open: true,
      x: e.clientX,
      y: e.clientY,
      kind: "node",
      payload: { node },
    });
  }, []);

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
        side?: "left" | "right" | "top" | "bottom";
      }
    ) => {
      e.preventDefault();
      setCtx({
        open: true,
        x: e.clientX,
        y: e.clientY,
        kind: "handle",
        payload: info,
      });
    },
    []
  );

  const { project } = useReactFlow(); // requires you wrap App in <ReactFlowProvider>

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
      setChart((prev) => ({
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
      }));
      setNodes((ns) => ns.filter((n) => n.id !== deviceId));
      setEdges((es) =>
        es.filter((e) => e.source !== deviceId && e.target !== deviceId)
      );
    },
    [setChart, setNodes, setEdges]
  );

  //Remove line from chart but keep it on dayabase
  const onRemoveEdge = useCallback(
    (edgeId: string) => {
      setEdges((es) => es.filter((e) => e.id !== edgeId));
      setChart((prev) => ({
        ...prev,
        linesOnChart: prev.linesOnChart.filter((l) => l.line.id !== edgeId),
      }));
    },
    [setChart, setEdges]
  );

  //remove handle from chart but keep iit in database
  const onRemoveHandle = useCallback(
    (deviceId: string, portId: string) => {
      // 1) update chart state (handles + lines)
      setChart((prev) => {
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

        return { ...prev, devicesOnChart, linesOnChart };
      });

      // 2) update reactflow edges immediately
      setEdges((es) =>
        es.filter((e) => e.sourceHandle !== portId && e.targetHandle !== portId)
      );

      setDirty(true);
    },
    [setChart, setEdges, setDirty]
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
    (lineId: string) => {
      onRemoveEdge(lineId);
      deleteSetsRef.current[ChartEntitiesEnum.LINES].add(lineId);
    },
    [onRemoveEdge]
  );

  const updateDeviceOnChart = useCallback(
    (deviceOnChart: DeviceOnChart) => {
      const { device, handles } = deviceOnChart;
      setChart((prev) => {
        return {
          ...prev,
          devicesOnChart: prev.devicesOnChart.map((doc) =>
            doc.device.id === device.id ? { ...doc, handles, device } : doc
          ),
        };
      });
      setDirty(true);
    },
    [setChart, setDirty]
  );

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
        } as DeviceNodeData,
      };
      return node;
    },
    [editMode, onRemoveNode, updateDeviceOnChart]
  );

  const { data: availableDevicesResponse } = useListAssets("devices", {
    page: 0,
    pageSize: 100000,
  });

  const usedIds = useMemo(
    () => new Set(chart.devicesOnChart.map((d) => d.device.id)),
    [chart.devicesOnChart]
  );

  const availableDevices = useMemo(
    () => availableDevicesResponse?.rows ?? [],
    [availableDevicesResponse]
  );

  // Devices not yet placed
  const unusedDevices = useMemo(() => {
    return availableDevices.filter((dev) => !usedIds.has(dev.id));
  }, [usedIds, availableDevices]);

  const devicesById = useMemo<Map<string, Device>>(
    () =>
      new Map(availableDevices.map((d: Device): [string, Device] => [d.id, d])),
    [availableDevices]
  );

  useEffect(() => {
    setNodes((prev: Node[]) => {
      const docsById = new Map(
        chart.devicesOnChart.map((doc) => [doc.device.id, doc])
      );

      return prev.map((prevNode) => {
        const doc = docsById.get(prevNode.id);
        if (!doc) return prevNode;
        return {
          ...prevNode,
          data: { ...prevNode.data, deviceOnChart: doc } as DeviceNodeData,
        };
      });
    });
    setEdges(chart.linesOnChart.map(convertLineToEdge));
  }, [setNodes, setEdges, chart.devicesOnChart, chart.linesOnChart]);

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
      const newLine: LineOnChart = {
        chartId: chart.id,
        line: {
          id: newId,
          sourcePort: sourcePort,
          targetPort: targetPort,
        } as Line,
        type: "step",
        label: "",
      };
      sourcePort.inUse = true;
      targetPort.inUse = true;

      setEdges((eds) => [...eds, convertLineToEdge(newLine)]);
      setMadeChanges(true);
      setChart((prev) => {
        return {
          ...prev,
          linesOnChart: [...prev.linesOnChart, newLine],
        } as Chart;
      });
    },
    [setChart, chart.devicesOnChart, setEdges, setMadeChanges, chart.id]
  );

  const OnReconnectStart = useCallback(() => {
    setIsReconnecting(true);

    setMadeChanges(true);
  }, [setIsReconnecting, setMadeChanges]);

  const OnReconnectEnd = useCallback(() => {
    setIsReconnecting(false);
  }, [setIsReconnecting]);

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
      setChart((prev) => {
        return {
          ...prev,
          devicesOnChart: prev.devicesOnChart.map((loc) =>
            loc.device.id === node.id
              ? { ...loc, position: node.position }
              : loc
          ),
        };
      });
      setMadeChanges(true);
    },
    [setChart, setMadeChanges]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      if (!editMode || !reactFlowWrapper.current) return;
      e.preventDefault();
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
      const newNode: Node = convertDeviceToNode({
        device,
        position,
        handles: defaultHandles,
      } as DeviceOnChart);
      setNodes((nds) => [...nds, newNode]);

      setChart((prev) => {
        return {
          ...chart,
          devicesOnChart: [
            ...chart.devicesOnChart,
            {
              chartId: chart.id,
              device,
              position,
              handles: defaultHandles,
            } as DeviceOnChart,
          ],
        };
      });
      setMadeChanges(true);
    },
    [
      editMode,
      project,
      devicesById,
      setNodes,
      setChart,
      setMadeChanges,
      chart,
      convertDeviceToNode,
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
        case EditorMenuListKeys.Add_DDEVICE_TO_CHART:
          break;

        case EditorMenuListKeys.DELETE_DEVICE:
          onDeleteDevice(payload.node.id);
          break;

        case EditorMenuListKeys.EDIT_DEVICE:
          break;

        case EditorMenuListKeys.REMOVE_DEVICE_FROM_CHART:
          onRemoveNode(payload.node.id);
          break;

        case EditorMenuListKeys.EDIT_LINE:
          break;

        case EditorMenuListKeys.REMOVE_LINE_FROM_CHART:
          onRemoveEdge(payload.edge.id);
          break;

        case EditorMenuListKeys.DELETE_LINE:
          onDeleteLine(payload.edge.id);
          break;

        case EditorMenuListKeys.EDIT_PORT:
          break;

        case EditorMenuListKeys.REMOVE_PORT:
          console.log(payload);
          //onRemoveHandle(payload.handle.)
          break;

        case EditorMenuListKeys.FIT:
          break;
      }

      closeCtx();
    },
    [ctx, onRemoveNode, setEdges, setChart, closeCtx]
  );

  useEffect(() => {
    setNodes(chart.devicesOnChart.map(convertDeviceToNode));
  }, []);

  useEffect(() => {
    setEdges(chart.linesOnChart.map(convertLineToEdge));
  }, []);

   const onSave = useCallback(
     async (e?: React.MouseEvent<HTMLButtonElement>) => {
       // prevent form submit refresh if inside a <form>
       e?.preventDefault();

       const payload: ChartCreate= {
         name: chart.name,
         description: chart.description ?? "",
         devicesOnChart: chart.devicesOnChart,
         linesOnChart: chart.linesOnChart,
       };
       try {
         const newChart: Chart = await updateChart(chart.id, payload);
         setDirty(false);
         return newChart
       } catch (err: any) {
         console.error("updateChart failed:", err);
       }
       return null
     },
     [chart.description, chart.devicesOnChart, chart.id, chart.linesOnChart, chart.name, setDirty]
   );

   useImperativeHandle(ref, () => ({
    onSave,
    isChangesMade: () => dirtyRef.current,
  }), [onSave]);

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
              className="fixed z-[9999] min-w-[180px] rounded-md border border-slate-200 bg-white shadow-lg"
              style={{ left: ctx.x, top: ctx.y }}
              onContextMenu={(e) => e.preventDefault()}
            >
              <MenuList kind={ctx.kind} onAction={onCtxAction} />
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
          onReconnectStart={OnReconnectStart}
          onReconnectEnd={OnReconnectEnd}
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
    </div>
  );
});
