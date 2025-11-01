import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, UpdateDateColumn, CreateDateColumn } from 'typeorm';
import { VendorEntity } from './vendor.entity';
import { DeviceEntity } from './device.entity';

@Entity({ name: "models" })
export class ModelEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  name!: string;

  @ManyToOne(() => VendorEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "vendor_id" })
  vendor: VendorEntity;

  @OneToMany(() => DeviceEntity, (device) => device.model)
  devices?: DeviceEntity[];

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt!: Date;

  @Column({ type: "uuid", name: "created_by_user_id" })
  createdByUserId!: string;

  @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
  updatedAt!: Date;

  @Column({ type: "uuid", name: "updated_by_user_id", nullable: true })
  updatedByUserId!: string | null;
}