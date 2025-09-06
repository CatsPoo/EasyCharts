import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation
} from "typeorm";
import { DeviceOnChartEntity } from "./deviceOnChart.entityEntity";
import { LineOnChartEntity } from "./lineonChart.emtity";

@Entity({ name: "charts" })
export class ChartEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  @Column({ nullable: false, default: "" })
  description!: string;

  @OneToMany(() => DeviceOnChartEntity, (doc) => doc.chart, {
    cascade: ["insert", "update"],
    orphanedRowAction: "delete",
  })
  devicesOnChart!: Relation<DeviceOnChartEntity[]>;

  @OneToMany(() => LineOnChartEntity, (loc) => loc.chart, {
    cascade: ["insert", "update"],
    orphanedRowAction: "delete",
  })
  linesOnChart!: Relation<LineOnChartEntity[]>;
}
