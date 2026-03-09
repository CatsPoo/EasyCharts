import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, UpdateDateColumn, CreateDateColumn, type Relation } from 'typeorm';
import { VendorEntity } from './vendor.entity';
import { DeviceEntity } from './device.entity';
import { AuditableEntity } from '../../auth/entities/auditableEntity.culumns';

@Entity({ name: "models" })
export class ModelEntity extends AuditableEntity{
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  name!: string;

  @Column({ name: "icon_url", nullable: true, type: "text" })
  iconUrl?: string;

  @ManyToOne(() => VendorEntity, { onDelete: "RESTRICT", nullable: true })
  @JoinColumn({ name: "vendor_id" })
  vendor: Relation<VendorEntity>;

  @OneToMany(() => DeviceEntity, (device) => device.model)
  devices?: DeviceEntity[];
}