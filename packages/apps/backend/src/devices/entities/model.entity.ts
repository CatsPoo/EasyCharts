import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, UpdateDateColumn, CreateDateColumn } from 'typeorm';
import { VendorEntity } from './vendor.entity';
import { DeviceEntity } from './device.entity';
import { AuditableEntity } from '../../auth/entities/auditableEntity.culumns';

@Entity({ name: "models" })
export class ModelEntity extends AuditableEntity{
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  name!: string;

  @ManyToOne(() => VendorEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "vendor_id" })
  vendor: VendorEntity;

  @OneToMany(() => DeviceEntity, (device) => device.model)
  devices?: DeviceEntity[];
}