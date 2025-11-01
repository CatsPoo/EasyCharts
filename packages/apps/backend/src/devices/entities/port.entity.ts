import { type PortType } from "@easy-charts/easycharts-types";
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, UpdateDateColumn, type Relation } from "typeorm";
import { LineEntity } from "../../lines/entities/line.entity";
import { DeviceEntity } from "./device.entity";
@Entity({ name: "ports" })
@Index(["deviceId"])
export class PortEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  @Column({ type: "varchar", length: 8 })
  type!: PortType;

  @Column({ name: "device_id", type: "uuid" })
  deviceId!: string;

  @Column({ type: "boolean", default: false })
  inUse!: boolean;

  @ManyToOne(() => DeviceEntity, (device) => device.ports, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "device_id" })
  device!: DeviceEntity;

  @OneToMany(() => LineEntity, (line) => line.sourcePort)
  asSourceInLines!: Relation<LineEntity[]>;

  @OneToMany(() => LineEntity, (line) => line.targetPort)
  asTargetInLines!: Relation<LineEntity[]>;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt!: Date;

  @Column({ type: "uuid", name: "created_by_user_id" })
  createdByUserId!: string;

  @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
  updatedAt!: Date;

  @Column({ type: "uuid", name: "updated_by_user_id", nullable: true })
  updatedByUserId!: string | null;
}