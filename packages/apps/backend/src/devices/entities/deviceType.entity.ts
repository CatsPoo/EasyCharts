import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { DeviceEntity } from './device.entity';

@Entity({ name: "device_type" })
export class DeviceTypeEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  name!: string;

  @OneToMany(() => DeviceEntity, (device) => device.type)
  devices?: DeviceEntity[];

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt!: Date;

  @Column({ type: "uuid", name: "created_by_user_id" })
  createdByUserId!: string;

  @UpdateDateColumn({ type: "timestamptz", name: "updated_at"})
  updatedAt!: Date;

  @Column({ type: "uuid", name: "updated_by_user_id", nullable: true })
  updatedByUserId!: string | null;
}