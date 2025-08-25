import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { DeviceEntity } from "./device.entity";
@Entity({ name: "ports" })
@Index(['deviceId'])
export class PortEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  @Column()
  type!: string;

  @Column({ name: 'device_id', type: 'uuid' })
  deviceId!: string;

  @ManyToOne(() => DeviceEntity, (device) => device.ports, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'device_id' })
  device!: DeviceEntity;


}