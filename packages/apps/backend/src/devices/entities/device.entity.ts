import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Position } from './position.entity'

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

  @Column(()=>Position)
  position!: Position;
}