import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { DeviceOnChartEntity } from '../../charts/entities/deviceOnChart.entity';
import { ModelEntity } from './model.entity';
import { PortEntity } from './port.entity';
import { DeviceTypeEntity } from './deviceType.entity';
@Entity({ name: "devices" })
export class DeviceEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  // @Column({ type: 'enum', enum: DeviceType })
  // @Column()
  // type!: string;
  @ManyToOne(() => DeviceTypeEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "type_id" })
  type: DeviceTypeEntity;

  @ManyToOne(() => ModelEntity, { onDelete: "CASCADE" })
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

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
    createdAt!: Date;
  
    @Column({ type: "uuid", name: "created_by_user_id" })
    createdByUserId!: string;
  
    @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
    updatedAt!: Date;
  
    @Column({ type: "uuid", name: "updated_by_user_id", nullable: true })
    updatedByUserId!: string | null;
}