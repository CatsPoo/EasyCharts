import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  type Relation,
} from "typeorm";
import { ChartEntity } from "../../charts/entities/chart.entity";
import { DeviceEntity } from "../../devices/entities/device.entity";
import { PortEntity } from "../../devices/entities/port.entity";

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

  @ManyToOne(() => PortEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "source_port_id" })
  sourcePort!: Relation<PortEntity>;

  @ManyToOne(() => PortEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "target_port_id" })
  targetPort!: Relation<PortEntity>;

  @Column({ type: "varchar", length: 20 })
  type!: LineType;

  @Column({ type: "varchar", length: 255, nullable: true })
  label?: string | null;
}
