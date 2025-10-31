import {
  Entity,
  ManyToOne,
  Column,
  PrimaryColumn,
  Index,
  OneToMany,
} from "typeorm";
import { ChartEntity } from "./chart.entity";
import { Position } from "./position.entity";
import { DeviceEntity } from "../../devices/entities/device.entity";
import { PortOnChartEntity } from "./portOnChart.entity";

@Entity({ name: "devices_on_charts" })
@Index(["chartId", "deviceId"], { unique: true })
export class DeviceOnChartEntity {
  // composite key (device within a chart)
  @PrimaryColumn("uuid")
  chartId!: string;

  @PrimaryColumn("uuid")
  deviceId!: string;

  @Column(() => Position)
  position!: Position;

  @ManyToOne(
    () => ChartEntity,
    (chart: ChartEntity) => chart.devicesOnChart,
    {
      onDelete: "CASCADE",
    }
  )
  chart!: ChartEntity;

  @ManyToOne(() => DeviceEntity, (device: DeviceEntity) => device.charts, {
    eager: true,
    onDelete: "CASCADE",
  })
  device!: DeviceEntity;

  @OneToMany(() => PortOnChartEntity, (poc) => poc.deviceOnChart, {
    cascade: true,
  })
  portPlacements!: PortOnChartEntity[];
}
