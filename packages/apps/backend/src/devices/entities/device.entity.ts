import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
@Entity({ name: 'devices' })
export class DeviceEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  type!: string;

  @Column({ nullable: true })
  model?: string;

  @Column({ nullable: true })
  vendor?: string;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress?: string;
}