import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn
} from "typeorm";
import { DeviceOnChartEntity } from "./deviceOnChart.entityEntity";

@Entity({ name: "charts" })
export class ChartEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  @Column({ nullable: false, default: "" })
  description!: string;

  @OneToMany(
    () => DeviceOnChartEntity,
    (doc: DeviceOnChartEntity) => doc.chart,
    {
      cascade: true,
    }
  )
  devicesOnChart!: DeviceOnChartEntity[];
}
