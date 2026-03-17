import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { DeviceEntity } from './device.entity';
import { AuditableEntity } from '../../auth/entities/auditableEntity.culumns';

@Entity({ name: "device_type" })
export class DeviceTypeEntity extends AuditableEntity{
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  name!: string;

  @Column({ name: 'icon_url', nullable: true, type: 'text' })
  iconUrl?: string | null;

  @OneToMany(() => DeviceEntity, (device) => device.type)
  devices?: DeviceEntity[];
}