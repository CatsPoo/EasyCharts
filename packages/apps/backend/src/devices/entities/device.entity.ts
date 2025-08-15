import { Entity, PrimaryGeneratedColumn, Column, ManyToOne,JoinColumn, OneToMany } from 'typeorm';
import { ModelEntity } from './model.entity';
import { DeviceOnChart } from '../../charts/entities/deviceOnChart.entity';
@Entity({ name: 'devices' })
export class DeviceEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  // @Column({ type: 'enum', enum: DeviceType })
    @Column()
  type!: string;

  @ManyToOne(() => ModelEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'model_id' })
    model: ModelEntity;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress?: string;

  @OneToMany(() => DeviceOnChart, (doc:DeviceOnChart) => doc.device)
  charts!: DeviceOnChart[];
}