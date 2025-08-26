import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  type Relation,
} from "typeorm";
import { ChartEntity } from "./chart.entity";
import { DeviceEntity } from "../../devices/entities/device.entity";

/** Keep enum as strings for cross-DB portability (MariaDB/SQLite/Postgres). */
export const LineTypeValues = [
  "straight",
  "step",
  "smoothstep",
  "bezier",
  "simplebezier",
] as const;

export type LineType = (typeof LineTypeValues)[number];

@Entity({ name: "lines" })
export class LineEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => ChartEntity, (chart) => chart.lines, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "chart_id" })
  chart!: Relation<ChartEntity>;

  @ManyToOne(() => DeviceEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "source_device_id" })
  sourceDevice!: Relation<DeviceEntity>;

  @ManyToOne(() => DeviceEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "target_device_id" })
  targetDevice!: Relation<DeviceEntity>;

  /** Store type as varchar for portability instead of DB enum */
  @Column({ type: "varchar", length: 20 })
  type!: LineType;

  @Column({ type: "varchar", length: 255, nullable: true })
  label?: string | null;
}
