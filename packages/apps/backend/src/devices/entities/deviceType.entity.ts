import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { DeviceEntity } from './device.entity';
import { AuditableEntity } from '../../auth/entities/auditableEntity.culumns';

@Entity({ name: "device_type" })
export class DeviceTypeEntity extends AuditableEntity{
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  name!: string;

  @OneToMany(() => DeviceEntity, (device) => device.type)
  devices?: DeviceEntity[];
}