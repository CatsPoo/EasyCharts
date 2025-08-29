import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
  type Relation,
  Index,
  Unique,
} from "typeorm";
import { ChartEntity } from "./chart.entity";
import { LineEntity } from "../../lines/entities/line.entity";
import type { LineType } from "@easy-charts/easycharts-types";



@Entity({ name: "lines_on_chart" })
@Unique("uniq_line_per_chart", ["chartId", "lineId"])
export class LineOnChartEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => ChartEntity, (chart) => chart.linesOnChart, {
    onDelete: "CASCADE",
    eager: false,
  })
  @JoinColumn({ name: "chart_id" })
  chart!: Relation<ChartEntity>;

  @Column({ name: "chart_id" })
  @Index()
  chartId!: string;

  // The global line it references
  @ManyToOne(() => LineEntity, { onDelete: "CASCADE", eager: false })
  @JoinColumn({ name: "line_id" })
  line!: Relation<LineEntity>;

  @Column({ name: "line_id" })
  @Index()
  lineId!: string;

  // Override the label shown on this chart (falls back to LineEntity.label if empty)
  @Column({ name: "label_override", type: "varchar", length: 255, nullable: false, default: "" })
  label: string;

  @Column({ type: "varchar", length: 20 })
  type!: LineType;

}
