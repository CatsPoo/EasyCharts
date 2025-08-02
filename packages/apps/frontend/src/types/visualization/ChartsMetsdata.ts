import type { Chart } from '../topology/Chart';

export type chartMetadata = Omit<Chart,'devices' | 'lines'>

export interface Chartsinformation{
    myCharts: chartMetadata[],
    sharedCharts: chartMetadata[]
}