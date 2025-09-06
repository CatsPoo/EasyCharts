import type { LineType } from "@easy-charts/easycharts-types";
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Unique,
  type Relation
} from "typeorm";
import { LineEntity } from "../../lines/entities/line.entity";
import { ChartEntity } from "./chart.entity";



@Entity({ name: "lines_on_chart" })
@Unique("uniq_line_per_chart", ["chartId", "lineId"])
@Index(["chartId", "lineId"], { unique: true })
export class LineOnChartEntity {
  @PrimaryColumn({ name: "chart_id",type:"uuid" })
  chartId!: string;

  @PrimaryColumn({ name: "line_id" ,type:"uuid"})
  lineId!: string;

  @ManyToOne(() => ChartEntity, (chart) => chart.linesOnChart, {
    onDelete: "CASCADE",
    eager: false,
  })
  @JoinColumn({ name: "chart_id" })
  chart!: Relation<ChartEntity>;

  // The global line it references
  @ManyToOne(() => LineEntity, { onDelete: "CASCADE", eager: false })
  @JoinColumn({ name: "line_id" })
  line!: Relation<LineEntity>;

  // Override the label shown on this chart (falls back to LineEntity.label if empty)
  @Column({type: "varchar", length: 255, nullable: false, default: "" })
  label: string;

  @Column({ type: "varchar", length: 20 })
  type!: LineType;

}
