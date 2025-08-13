import { Entity, PrimaryGeneratedColumn, Column, ManyToOne,JoinColumn } from 'typeorm';
import { ModelEntity } from './model.entity';
@Entity({ name: 'devices' })
export class DeviceEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  type!: string;

  @ManyToOne(() => ModelEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'model_id' })
    model: ModelEntity;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress?: string;
}