import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { DeviceOnChartEntity } from '../../charts/entities/deviceOnChart.entityEntity';
import { ModelEntity } from './model.entity';
@Entity({ name: "devices" })
export class DeviceEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  // @Column({ type: 'enum', enum: DeviceType })
  @Column()
  type!: string;

  @ManyToOne(() => ModelEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "model_id" })
  model: ModelEntity;

  @Column({ name: "ip_address", nullable: true })
  ipAddress?: string;

  @OneToMany(
    () => DeviceOnChartEntity,
    (doc: DeviceOnChartEntity) => doc.device
  )
  charts!: DeviceOnChartEntity[];
}