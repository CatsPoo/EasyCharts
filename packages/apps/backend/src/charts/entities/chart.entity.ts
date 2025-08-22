import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from "typeorm";
import { DeviceOnChartEntity } from "./deviceOnChart.entityEntity";
import { LineEntity } from "../../lines/entities/line.entity";

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
  devicesLocations!: DeviceOnChartEntity[];
}
