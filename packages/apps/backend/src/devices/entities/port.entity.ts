import { type PortType } from "@easy-charts/easycharts-types";
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, type Relation } from "typeorm";
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
}