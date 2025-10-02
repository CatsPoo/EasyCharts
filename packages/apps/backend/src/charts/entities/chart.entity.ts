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

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt!: Date;

  @Column({ name: "created_by_id", type: "uuid" })
  createdById!: string;

  @ManyToOne(() => UserEntity, { onDelete: "CASCADE", eager: false })
  @JoinColumn({ name: "created_by_id" })
  createdBy!: Relation<UserEntity>;

  @Column({ name: "locked_at", type: "timestamptz",nullable:true,default:null })
  lockedAt?:Date | null


  @Column({ name: "locked_by_id", type: "uuid",nullable:true,default:null })
  lockedById?: string | null;

  @ManyToOne(() => UserEntity, {onDelete: "SET NULL", eager: true ,nullable:true})
  @JoinColumn({ name: "locked_by_id"})
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
}
