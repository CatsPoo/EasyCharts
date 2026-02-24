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

@Entity({ name: "notes_on_chart" })
export class NoteOnChartEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "chart_id", type: "uuid" })
  chartId!: string;

  @Column({ type: "text", default: "" })
  content!: string;

  @Column(() => Position)
  position!: Position;

  @Column({ type: "double precision", default: 220 })
  width!: number;

  @Column({ type: "double precision", default: 130 })
  height!: number;

  @ManyToOne(() => ChartEntity, (chart) => chart.notesOnChart, {
    onDelete: "CASCADE",
    eager: false,
  })
  @JoinColumn({ name: "chart_id" })
  chart!: Relation<ChartEntity>;
}
