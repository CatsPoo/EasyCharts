import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { DeviceOnChartEntity } from './deviceOnChart.entityEntity';

@Entity({ name: 'charts' })
export class ChartEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column() 
  name!: string;

  @Column({ nullable: true }) 
  description?: string;

  @OneToMany(() => DeviceOnChartEntity, (doc :DeviceOnChart) => doc.chart, { cascade: true })
  devices!: DeviceOnChartEntity[];

//   @OneToMany(() => Line, line => line.chart, { cascade: true })
//   lines!: Line[];
}