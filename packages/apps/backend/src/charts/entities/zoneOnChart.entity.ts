import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from "typeorm";
import { ChartEntity } from "./chart.entity";
import { Position } from "./position.entity";

@Entity({ name: "zones_on_chart" })
export class ZoneOnChartEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "chart_id", type: "uuid" })
  chartId!: string;

  @Column({ type: "text", default: "" })
  label!: string;

  @Column({ type: "varchar", default: "rectangle" })
  shape!: string;

  @Column({ type: "varchar", default: "blue" })
  color!: string;

  @Column({ name: "fill_color", type: "varchar", default: "" })
  fillColor!: string;

  @Column({ name: "fill_opacity", type: "double precision", default: 0 })
  fillOpacity!: number;

  @Column({ name: "border_style", type: "varchar", default: "solid" })
  borderStyle!: string;

  @Column({ name: "border_width", type: "double precision", default: 2 })
  borderWidth!: number;

  @Column(() => Position)
  position!: Position;

  @Column({ type: "double precision", default: 300 })
  width!: number;

  @Column({ type: "double precision", default: 200 })
  height!: number;

  @ManyToOne(() => ChartEntity, (chart) => chart.zonesOnChart, {
    onDelete: "CASCADE",
    eager: false,
  })
  @JoinColumn({ name: "chart_id" })
  chart!: Relation<ChartEntity>;
}
