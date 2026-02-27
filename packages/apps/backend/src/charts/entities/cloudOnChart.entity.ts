import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  type Relation,
} from "typeorm";
import { ChartEntity } from "./chart.entity";
import { CloudEntity } from "../../devices/entities/cloud.entity";
import { Position } from "./position.entity";

@Entity({ name: "cloud_connections_on_chart" })
export class CloudConnectionOnChartEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "chart_id", type: "uuid" })
  chartId!: string;

  @Column({ name: "device_id", type: "uuid" })
  deviceId!: string;

  @Column({ name: "port_id", type: "uuid" })
  portId!: string;

  @Column({ name: "cloud_handle", type: "varchar" })
  cloudHandle!: string;

  @Column({ name: "cloud_on_chart_id", type: "uuid" })
  cloudOnChartId!: string;

  @ManyToOne(() => CloudOnChartEntity, (coc) => coc.connections, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "cloud_on_chart_id" })
  cloudOnChart!: Relation<CloudOnChartEntity>;
}

@Unique(["chartId", "cloudId"])
@Entity({ name: "clouds_on_chart" })
export class CloudOnChartEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "chart_id", type: "uuid" })
  chartId!: string;

  @Column({ name: "cloud_id", type: "uuid" })
  cloudId!: string;

  @Column(() => Position)
  position!: Position;

  @Column({ type: "double precision", default: 180 })
  width!: number;

  @Column({ type: "double precision", default: 90 })
  height!: number;

  @ManyToOne(() => ChartEntity, { onDelete: "CASCADE", eager: false })
  @JoinColumn({ name: "chart_id" })
  chart!: Relation<ChartEntity>;

  @ManyToOne(() => CloudEntity, { onDelete: "CASCADE", eager: true })
  @JoinColumn({ name: "cloud_id" })
  cloud!: Relation<CloudEntity>;

  @OneToMany(() => CloudConnectionOnChartEntity, (c) => c.cloudOnChart, {
    cascade: true,
    eager: true,
  })
  connections!: CloudConnectionOnChartEntity[];
}
