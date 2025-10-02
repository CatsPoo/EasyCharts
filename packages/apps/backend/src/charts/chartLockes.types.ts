import { ChartEntity } from "./entities/chart.entity";

export type ChartLockFeilds = Pick<ChartEntity , "id"|"lockedAt"|"lockedBy"|"lockedById">