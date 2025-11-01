import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Unique,
  type Relation
} from "typeorm";
import { BondEntity } from "../../lines/entities/bond.entity";
import { ChartEntity } from "./chart.entity";
import { Position } from "./position.entity";



@Entity({ name: "bond_on_chart" })
@Unique("uniq_bond_per_chart", ["chartId", "bondId"])
@Index(["chartId", "bondId"], { unique: true })
export class BondOnChartEntity {
  @PrimaryColumn({ name: "chart_id",type:"uuid" })
  chartId!: string;

  @PrimaryColumn({ name: "bond_id" ,type:"uuid"})
  bondId!: string;

  @Column(() => Position)
    position!: Position;

  @ManyToOne(() => ChartEntity, (chart) => chart.bondOnChart, {
    onDelete: "CASCADE",
    eager: false,
  })
  @JoinColumn({ name: "chart_id" })
  chart!: Relation<ChartEntity>;

  // The global line it references
  @ManyToOne(() => BondEntity, { onDelete: "CASCADE", eager: false })
  @JoinColumn({ name: "bond_id" })
  bond!: Relation<BondEntity>;


}
