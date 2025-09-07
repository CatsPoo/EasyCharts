import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  Unique,
  type Relation,
} from "typeorm";
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
@Check("CHK_line_source_target_diff", `"source_port_id" <> "target_port_id"`)
@Unique('uniq_line_pair', ['sourcePortId', 'targetPortId'])
export class LineEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @ManyToOne(() => PortEntity, { onDelete: "CASCADE", eager: false })
  @JoinColumn({ name: "source_port_id" })
  sourcePort!: Relation<PortEntity>;

  @Column({ name: "source_port_id" })
  @Index()
  sourcePortId!: string;

  @ManyToOne(() => PortEntity, { onDelete: "CASCADE", eager: false })
  @JoinColumn({ name: "target_port_id" })
  targetPort!: Relation<PortEntity>;

  @Column({ name: "target_port_id" })
  @Index()
  targetPortId!: string;

}
