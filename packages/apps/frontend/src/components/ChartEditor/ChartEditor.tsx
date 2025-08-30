import {
  DirectionsValues,
  type Chart,
  type Device,
  type DeviceOnChart,
  type HandleInfo,
  type Handles,
  type Line,
  type LineOnChart,
  type Port,
} from "@easy-charts/easycharts-types";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { DevicesSidebar } from "../ChartsViewer/DevicesSideBar";
import { useListAssets } from "../../hooks/assetsHooks";
import DeviceNode from "./DeviceNode";
import type { DeviceNodeData } from "./interfaces/deviceModes.interfaces";

interface ChardEditorProps {
  chart: Chart;
  setChart:  React.Dispatch<React.SetStateAction<Chart>>;
  editMode: boolean;
  setMadeChanges: React.Dispatch<React.SetStateAction<boolean>>;
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
    () => new Set(chart.devicesOnChart.map(d => d.device.id)),
    [chart.devicesOnChart,setChart]
  );

  const availableDevices = availableDevicesResponse?.rows ?? [];
  // Devices not yet placed
  const unusedDevices = useMemo(() => {
    return availableDevices.filter((dev) => !usedIds.has(dev.id));
  }, [availableDevicesResponse, usedIds]);

  const devicesById = useMemo<Map<string, Device>>(
    () =>
      new Map(availableDevices.map((d: Device): [string, Device] => [d.id, d])),
    [availableDevices, setChart,chart]
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
      setMadeChanges(true);
    },
    [setChart, chart, setMadeChanges]
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
        updateDeviceOnChart
      } as DeviceNodeData,
    };
    return node;
  };

  const convertDevicesToNodes = (devicesOnChart: DeviceOnChart[]): Node[] => {
    const nodes: Node[] = devicesOnChart.map((deviceOnChart) =>
      convertDeviceToNode(deviceOnChart)
    );
    return nodes;
  };

  const convertLineToEdge = (lineonChart: LineOnChart): Edge => {
    console.log("lineOnchat",lineonChart)
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

  const convertLinesToEdges = (lines: LineOnChart[]): Edge[] => {
    return lines ? lines.map((l) => convertLineToEdge(l)) : [];
  };

  const [nodes, setNodes, onNodesChangeRF] = useNodesState(
    convertDevicesToNodes(chart.devicesOnChart)
  );
  const [edges, setEdges, onEdgesChangeRF] = useEdgesState(
    convertLinesToEdges(chart.linesOnChart)
  );

  useEffect(() => {
    setNodes((prev) => {
      const docsById = new Map(
        chart.devicesOnChart.map((doc) => [doc.device.id, doc])
      );

      return prev.map((prevNode) => {
        
        const doc = docsById.get(prevNode.id);
        if (!doc) return prevNode;
        return {
          ...prevNode,
          data: { ...prevNode.data,deviceOnChart:doc} as DeviceNodeData,  
        };
      });
    });
    setEdges(chart.linesOnChart.map(convertLineToEdge));
  }, [setNodes, setEdges, chart.devicesOnChart]);

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
      const newId:string = uuidv4();
      const sourcePort : Port = chart.devicesOnChart.find(d=>d.device.id===c.source)!.device.ports.find(p=>p.id===c.sourceHandle)!;
      const targetPort: Port = chart.devicesOnChart.find(d=>d.device.id===c.target)!.device.ports.find(p=>p.id===c.targetHandle)!;
      console.log("sourcePort,targetPort",sourcePort,targetPort)
      const newLine: LineOnChart = {
        chartId: chart.id,
        id: newId,
        line: {
          id:newId,
          sourcePort:sourcePort,
          targetPort:targetPort
        } as Line,
        type: 'step',
        label: "",
      }
      setEdges((eds) => [...eds, convertLineToEdge(newLine)]);
      setMadeChanges(true);
      setChart((prev) => {
        return {
          ...prev,
          linesOnChart: [...prev.linesOnChart, newLine],
        } as Chart;
      });
    },
    [setChart, nodes]
  );
  
  const OnReconnectStart = useCallback(() => {
    setIsReconnecting(true);
    
    setMadeChanges(true);
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
    [chart, setChart, setMadeChanges]
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
