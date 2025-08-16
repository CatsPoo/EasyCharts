import { Entity, ManyToOne, Column, PrimaryColumn, Index } from 'typeorm';
import {ChartEntity } from './chart.entity';
import { Position } from './position.entity';
import { DeviceEntity } from '../../devices/entities/device.entity';

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

  @ManyToOne(() => ChartEntity, (chart: ChartEntity) => chart.devices, {
    onDelete: "CASCADE",
  })
  chart!: ChartEntity;

  @ManyToOne(() => DeviceEntity, (device: DeviceEntity) => device.charts, {
    eager: true,
    onDelete: "CASCADE",
  })
  device!: DeviceEntity;
}
