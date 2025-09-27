import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation
} from "typeorm";
import { DeviceOnChartEntity } from "./deviceOnChart.entityEntity";
import { LineOnChartEntity } from "./lineonChart.emtity";
import { UserEntity } from "../../auth/entities/user.entity";

@Entity({ name: "charts" })
export class ChartEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  @Column({ nullable: false, default: "" })
  description!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

   @Index("idx_charts_created_by")
  @Column({ name: "created_by_id", type: "uuid" })
  createdById!: string;

  @ManyToOne(() => UserEntity, {onDelete: "CASCADE", eager: false })
  @JoinColumn({ name: "created_by_id" })
  createdBy!: Relation<UserEntity>;

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
}
