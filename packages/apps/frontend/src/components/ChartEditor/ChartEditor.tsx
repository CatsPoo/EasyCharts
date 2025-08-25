import type {
  Chart,
  Device,
  DeviceOnChart,
  Handles,
  Line,
} from "@easy-charts/easycharts-types";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Connection, Edge, EdgeChange, Node, NodeChange } from "reactflow";

import ReactFlow, {
  addEdge,
  Background,
  ConnectionLineType,
  Controls,
  reconnectEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import { DevicesSidebar } from "../ChartsViewer/DevicesSideBar";
import { useListAssets } from "../../hooks/assetsHooks";
import DeviceNode from "./DeviceNode";
import type { DeviceNodeData } from "./interfaces/deviceModes.interfaces";

interface ChardEditorProps {
  chart: Chart;
  setChart: (chart: Chart) => void;
  editMode: boolean;
  setMadeChanges: (val: boolean) => void;
}
export function ChartEditor({
  chart,
  setChart,
  editMode,
  setMadeChanges,
}: ChardEditorProps) {

  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const nodeTypes = useMemo(() => ({ device: DeviceNode }), []);

  const { project } = useReactFlow(); // requires you wrap App in <ReactFlowProvider>

  const { data: availableDevicesResponse } = useListAssets("devices", {
    page: 0,
    pageSize: 100000,
  });


  const usedIds = useMemo(
    () => new Set(chart.devicesOnCharts.map(d => d.device.id)),
    [chart.devicesOnCharts,setChart]
  );

  const availableDevices = availableDevicesResponse?.rows ?? [];
  // Devices not yet placed
  const unusedDevices = useMemo(() => {
    return availableDevices.filter((dev) => !usedIds.has(dev.id));
  }, [availableDevicesResponse, usedIds]);

  const devicesById = useMemo<Map<string, Device>>(
    () =>
      new Map(availableDevices.map((d: Device): [string, Device] => [d.id, d])),
    [availableDevices]
  );

  const updateDeviceOnChartHandles = useCallback(
    (deviceId: string, handles: Handles) => {
      const next: Chart = {
        ...chart,
        devicesOnCharts: chart.devicesOnCharts.map((loc) =>
          loc.device.id === deviceId ? { ...loc, handles } : loc
        ),
      };
      setChart(next);
      setMadeChanges(true);
    },[setChart, setMadeChanges]
  );

  const convertDeviceToNode = (deviceOnChart: DeviceOnChart): Node => {
    const { device, position } = deviceOnChart;
    const node: Node = {
      id: device.id,
      type: "device",
      position,
      data: {
        deviceOnChart: deviceOnChart,
        editMode,
        updateHandles: updateDeviceOnChartHandles
      } as DeviceNodeData,
    };
    return node;
  };

  const convertDevicesToNodes = (devicesLocations: DeviceOnChart[]): Node[] => {
    const nodes: Node[] = devicesLocations.map((deviceOnChart) =>
      convertDeviceToNode(deviceOnChart)
    );
    return nodes;
  };

  const convertLineToEdge = (line: Line): Edge => {
    return {
      id: line.id,
      source: line.sourcePorteId,
      target: line.targetPortId,
      label: line.label,
      type: "step",
      animated: false, // optional: makes the edge animate
      //style: { strokeDasharray: l.type === 'rj45' ? '5 5' : undefined },
    };
  };

  const convertEdgeToLine = (edge: Edge): Line => {
    return {
      id: edge.id,
      sourcePorteId: edge.source,
      targetPortId: edge.target,
      label: edge.label,
      type: edge.type
    } as Line;
  }

  const convertLinesToEdges = (lines: Line[]): Edge[] => {
    return lines ? lines.map((l) => convertLineToEdge(l)) : [];
  };

  const [nodes, setNodes, onNodesChangeRF] = useNodesState(
    convertDevicesToNodes(chart.devicesOnCharts)
  );
  const [edges, setEdges, onEdgesChangeRF] = useEdgesState(
    convertLinesToEdges(chart.lines)
  );

  useEffect(() => {
    setNodes((prev) => {
      const docsById = new Map(
        chart.devicesOnCharts.map((doc) => [doc.device.id, doc])
      );

      return prev.map((prevNode) => {
        if (!prevNode.selected) return prevNode; // only touch selected
        const doc = docsById.get(prevNode.id);
        if (!doc) return prevNode; // device removed, leave as-is

        // PATCH: keep selection/dragging/zIndex etc., update just what changed
        return {
          ...prevNode,
          data: { ...prevNode.data,deviceOnChart:doc} as DeviceNodeData, // handles, callbacks, etc.
          selected: prevNode.selected, // preserve selection (explicit)
        };
      });
    });
    setEdges(convertLinesToEdges(chart.lines));
  }, [setNodes, setEdges, chart.devicesOnCharts]);

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
    [onEdgesChangeRF, setEdges]
  );

  const onConnect = useCallback(
    (c: Connection) => {
      setEdges((eds) => addEdge(c, eds));
    },
    [setEdges]
  );

  const OnReconnectStart = useCallback(() => {
    setIsReconnecting(true);
  }, [setIsReconnecting]);

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
      // find the device-on-chart and update its position immutably
      const next: Chart = {
        ...chart,
        devicesOnCharts: chart.devicesOnCharts.map((loc) =>
          loc.device.id === node.id ? { ...loc, position: node.position } : loc
        ),
      };
      setChart(next);
      setMadeChanges(true);
    },
    [chart, setChart, setMadeChanges]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      if (!editMode || !reactFlowWrapper.current) return;
      e.preventDefault();
      const deviceId = e.dataTransfer.getData("application/reactflow");
      if (!deviceId) return;

      const device: Device | undefined = devicesById.get(deviceId);
      if(!device) return 
      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = project({
        x: e.clientX - bounds.left,
        y: e.clientY - bounds.top,
      });
      const newNode: Node = convertDeviceToNode({device, position,handles:{}} as DeviceOnChart); 
      setNodes((nds) => [...nds, newNode]);

      const nextChart: Chart = {
        ...chart,
        devicesOnCharts: [
          ...chart.devicesOnCharts,
          { chartId: chart.id, device, position } as DeviceOnChart,
        ],
      };
      setChart(nextChart);
      setMadeChanges(true);
    },
    [editMode, project, devicesById, setNodes, setChart, setMadeChanges, chart]
  );
  const onEdgeUpdate = useCallback(
    (oldE: Edge, conn: Connection) => {
      setEdges((eds) => reconnectEdge(oldE, conn, eds));
    },
    [setEdges]
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
            className="flex-none overflow-hidden border-r bg-gray-100"
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
          fitView
          style={{ width: "100%", height: "100%" }}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}
