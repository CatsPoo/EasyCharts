import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import type { Chart } from "@easy-charts/easycharts-types";
import type { Chartsinformation } from "@easy-charts/easycharts-types";

let chartsMock : Chart[] =
[
    {
      id: '1',
      name: 'Core Network',
      description:'test-chart-1',
      devicesLocations: [
        {device:{ id: '1', type: 'switch',name:'sw1'},position:{ x: 0, y: 0 }},
        {device:{ id: '2', type: 'router',name:'r2'}, position: { x: 200, y: 0 }},
      ],
      lines: [{ id: '1', label: '1Gbps', type:'rj45',sourceDeviceId:'1',targeDevicetId:'2'}],
    },
    {
      id: '2',
      name: 'site Network',
      description:'test-chart-2',
      devicesLocations: [
        {device:{ id: '3', type: 'switch',name:'sw1'},position: { x: 50, y: 50 }},
        {device:{ id: '4', type: 'router',name:'r2'},position: { x: 150, y: 150 }}
      ],
      lines: [{ id: '2', label: '1Gbps', type:'rj45',sourceDeviceId:'4',targeDevicetId:'3'}],
    },
    {
      id: '3',
      name: 'Core Network',
      description:'test-chart-1',
      devicesLocations: [
        {device:{ id: '5', type: 'switch',name:'sw1'},position: { x: 0, y: 0 }},
        {device:{ id: '6', type: 'router',name:'r2'},position: { x: 200, y: 0 }}
      ],
      lines: [{ id: '3', label: '1Gbps', type:'rj45',sourceDeviceId:'5',targeDevicetId:'6'}],
    },
]

const initialChartsInformation : Chartsinformation = {
    myCharts : [
         {
      id: '1',
      name: 'Core Network',
      description:'test-chart-1',
    },
    {
      id: '2',
      name: 'site Network',
      description:'test-chart-2',
    }
    ],
    sharedCharts : [
        {
      id: '3',
      name: 'Core Network',
      description:'test-chart-1',
    }
    ]
}

interface ChartsContextValue {
  getChart: (id: string) => Chart | undefined;
  getChartsInformation: () => Chartsinformation;
  //addChart: (chart:Chart) => void
  updateChart: (chartId:string,updated: Chart) => void;
  // you can also add createChart, deleteChart, etc.
}

const ChartsContext = createContext<ChartsContextValue | undefined>(undefined);

export function ChartsProvider({ children }: { children: ReactNode }) {
  const [chartsInformation, setChartsInformation] = useState<Chartsinformation>(initialChartsInformation);
  const [charts, setCharts] = useState<Chart[]>(chartsMock); //temp until api integration

  const getChartsInformation = useCallback(
  () => chartsInformation,
  [chartsInformation]
);
const getChart = useCallback(
  (id: string) => charts.find(c => c.id === id),
  [charts]
);

// const addChart = useCallback(
//   (chart: Chart) => {
//     setCharts([...charts,chart] )
//     setChartsInformation(...chartsInformation + {cha})
//   }

//   ,[charts]
// )

  const updateChart = (chartId:string,updated: Chart) => {
    chartsMock = chartsMock.filter(chart => chart.id === chartId)
    chartsMock.push(updated)
  };

//   const updateSharedChart = (updated: Chart) => {
//     setSharedCharts((prev) =>
//       prev.map((c) => (c.id === updated.id ? updated : c))
//     );
//   };

  return (
    <ChartsContext.Provider
      value={{getChartsInformation, getChart,updateChart }}
    >
      {children}
    </ChartsContext.Provider>
  );
}

export function useCharts(): ChartsContextValue {
  const ctx = useContext(ChartsContext);
  if (!ctx) {
    throw new Error('useChart must be used within a ChartFunctionsProvider');
  }
  return ctx;
}