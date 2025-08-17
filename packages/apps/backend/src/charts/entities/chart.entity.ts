import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { DeviceOnChartEntity } from './deviceOnChart.entityEntity';
import { DeviceOnChart } from '@easy-charts/easycharts-types';

@Entity({ name: "charts" })
export class ChartEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @OneToMany(() => DeviceOnChartEntity, (doc: DeviceOnChartEntity) => doc.chart, {
    cascade: true,
  })
  devicesLocations!: DeviceOnChartEntity[];

  //   @OneToMany(() => Line, line => line.chart, { cascade: true })
  //   lines!: Line[];
}