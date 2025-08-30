import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  Check,
} from "typeorm";
import { DeviceOnChartEntity } from "./deviceOnChart.entityEntity";
import { PortEntity } from "../../devices/entities/port.entity";
import { type PortSide, type ConnectionDirection } from "@easy-charts/easycharts-types";

@Entity({ name: "ports_on_chart" })
@Index(["chartId", "deviceId"]) // fast lookups per node
@Index(["chartId", "deviceId", "side"], { unique: true }) // no dup slot
@Index(["chartId", "deviceId", "portId"], { unique: true }) // same port once per node
@Check(`"side" IN ('left','right','top','bottom')`)
@Check(`"side" IN ('source','target')`)
export class PortOnChartEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  // --- reference the device-on-this-chart (composite FK) ---
  @Column({ name: "chart_id", type: "uuid" })
  chartId!: string;

  @Column({ name: "device_id", type: "uuid" })
  deviceId!: string;

  @ManyToOne(() => DeviceOnChartEntity, (doc) => doc.portPlacements, {
    onDelete: "CASCADE",
  })
  @JoinColumn([
    { name: "chart_id", referencedColumnName: "chartId" },
    { name: "device_id", referencedColumnName: "deviceId" },
  ])
  deviceOnChart!: DeviceOnChartEntity;

  @Column({ name: "port_id", type: "uuid" })
  portId!: string;

  @ManyToOne(() => PortEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "port_id" })
  port!: PortEntity;

  @Column({ type: "varchar", length: 8 })
  side!: PortSide; // "left" | "right" | "top" | "bottom"
}
