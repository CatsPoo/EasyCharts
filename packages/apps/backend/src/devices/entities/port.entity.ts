import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { DeviceEntity } from "./device.entity";
import { type PortType } from "@easy-charts/easycharts-types";
@Entity({ name: "ports" })
@Index(['deviceId'])
export class PortEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  @Column({ type: "varchar", length: 8 })
  type!: PortType;

  @Column({ name: 'device_id', type: 'uuid' })
  deviceId!: string;

  @ManyToOne(() => DeviceEntity, (device) => device.ports, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'device_id' })
  device!: DeviceEntity;


}