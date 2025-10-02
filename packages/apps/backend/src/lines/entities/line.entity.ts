import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Unique,
  type Relation
} from "typeorm";
import { PortEntity } from "../../devices/entities/port.entity";
import { BondEntity } from "./bond.entity";

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
@Unique("uniq_line_pair", ["sourcePortId", "targetPortId"])
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

  @Column({ name: "bond_id", type: "uuid", nullable: true })
  bondId?: string | null;

  @ManyToOne(() => BondEntity, (bond) => bond.members, { onDelete: "SET NULL" })
  @JoinColumn({ name: "bond_id" })
  bond?: BondEntity | null;
}
