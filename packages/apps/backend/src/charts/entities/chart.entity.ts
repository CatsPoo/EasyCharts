import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation
} from "typeorm";
import { UserEntity } from "../../auth/entities/user.entity";
import { BondOnChartEntity } from "./BondOnChart.emtity";
import { DeviceOnChartEntity } from "./deviceOnChart.entity";
import { LineOnChartEntity } from "./lineonChart.emtity";
import { NoteOnChartEntity } from "./noteOnChart.entity";
import { CloudOnChartEntity } from "./cloudOnChart.entity";
import { AuditableEntity } from "../../auth/entities/auditableEntity.culumns";

@Entity({ name: "charts" })
export class ChartEntity extends AuditableEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  @Column({ nullable: false, default: "" })
  description!: string;

  @Column({
    name: "locked_at",
    type: "timestamptz",
    nullable: true,
    default: null,
  })
  lockedAt?: Date | null;

  @Column({ name: "locked_by_id", type: "uuid", nullable: true, default: null })
  lockedById?: string | null;

  @ManyToOne(() => UserEntity, {
    onDelete: "SET NULL",
    eager: true,
    nullable: true,
  })
  @JoinColumn({ name: "locked_by_id" })
  lockedBy?: Relation<UserEntity> | null;

  @OneToMany(() => DeviceOnChartEntity, (doc) => doc.chart, {
    cascade: ["insert", "update"],
    orphanedRowAction: "delete",
  })
  devicesOnChart!: Relation<DeviceOnChartEntity[]>;

  @OneToMany(() => LineOnChartEntity, (loc) => loc.chart, {
    cascade: ["insert", "update"],
    orphanedRowAction: "delete",
  })
  linesOnChart!: Relation<LineOnChartEntity[]>;

  @OneToMany(() => BondOnChartEntity, (boc) => boc.chart, {
    cascade: ["insert", "update"],
    orphanedRowAction: "delete",
  })
  bondOnChart!: Relation<BondOnChartEntity[]>;

  @OneToMany(() => NoteOnChartEntity, (noc) => noc.chart, {
    cascade: ["insert", "update"],
    orphanedRowAction: "delete",
  })
  notesOnChart!: Relation<NoteOnChartEntity[]>;

  @OneToMany(() => CloudOnChartEntity, (coc) => coc.chart, {
    cascade: ["insert", "update"],
    orphanedRowAction: "delete",
  })
  cloudsOnChart!: Relation<CloudOnChartEntity[]>;
}
