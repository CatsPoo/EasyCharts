import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { DeviceOnChartEntity } from '../../charts/entities/deviceOnChart.entity';
import { ModelEntity } from './model.entity';
import { PortEntity } from './port.entity';
import { DeviceTypeEntity } from './deviceType.entity';
import { AuditableEntity } from '../../auth/entities/auditableEntity.culumns';
@Entity({ name: "devices" })
export class DeviceEntity extends AuditableEntity{
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  // @Column({ type: 'enum', enum: DeviceType })
  // @Column()
  // type!: string;
  @ManyToOne(() => DeviceTypeEntity, { onDelete: "RESTRICT", nullable: true })
  @JoinColumn({ name: "type_id" })
  type: DeviceTypeEntity;

  @ManyToOne(() => ModelEntity, { onDelete: "RESTRICT", nullable: true })
  @JoinColumn({ name: "model_id" })
  model: ModelEntity;

  @Column({ name: "ip_address", nullable: true })
  ipAddress: string;

  @OneToMany(
    () => DeviceOnChartEntity,
    (doc: DeviceOnChartEntity) => doc.device
  )
  charts!: DeviceOnChartEntity[];

  @OneToMany(() => PortEntity, (p) => p.device, {
    cascade: true,      
    eager: true,       
  })
  ports!: PortEntity[];
}