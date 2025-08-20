import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from "typeorm";
import { DeviceOnChartEntity } from "./deviceOnChart.entityEntity";
import { LineEntity } from "./line.entity";

@Entity({ name: "charts" })
export class ChartEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @OneToMany(
    () => DeviceOnChartEntity,
    (doc: DeviceOnChartEntity) => doc.chart,
    {
      cascade: true,
    }
  )
  devicesLocations!: DeviceOnChartEntity[];

  @OneToMany(() => LineEntity, (line) => line.chart, {
    cascade: true, // allows saving via parent; keep if you use replace-on-update
  })
  lines!: Relation<LineEntity[]>;
}
