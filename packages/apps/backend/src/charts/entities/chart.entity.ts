import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { DeviceOnChart } from './deviceOnChart.entity';

@Entity({ name: 'charts' })
export class ChartEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column() 
  name!: string;

  @Column({ nullable: true }) 
  description?: string;

  @OneToMany(() => DeviceOnChart, (doc :DeviceOnChart) => doc.chart, { cascade: true })
  devices!: DeviceOnChart[];

//   @OneToMany(() => Line, line => line.chart, { cascade: true })
//   lines!: Line[];
}