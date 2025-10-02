import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { DeviceEntity } from './device.entity';

@Entity({ name: "deviceType" })
export class DeviceTypeEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  name!: string;

  @OneToMany(() => DeviceEntity, (device) => device.type)
  devices?: DeviceEntity[];
}