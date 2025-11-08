// apps/api/src/directories/entities/directory.entity.ts
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  RelationId
} from "typeorm";
import { ChartInDirectoryEntity } from "./chartsInDirectory.entity";
import { AuditableEntity } from "../../auth/entities/auditableEntity.culumns";

@Entity("charts_directories")
@Index(["parentId", "name"], { unique: true }) // unique among siblings
export class ChartsDirectoryEntity extends AuditableEntity{
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 200 })
  name!: string;

  @Column({ type: "text", default: "" })
  description!: string;

  @Column({ name: "parant_id", type: "uuid", nullable: true })
  parentId!: string | null;

  @ManyToOne(() => ChartsDirectoryEntity, (d) => d.children, {
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "parant_id", referencedColumnName: "id" })
  parent!: ChartsDirectoryEntity | null;

  @OneToMany(() => ChartsDirectoryEntity, (d) => d.parent)
  children!: ChartsDirectoryEntity[];

  @OneToMany(() => ChartInDirectoryEntity, (cid) => cid.directory, { cascade: false })
  charts!: ChartInDirectoryEntity[];

  /** >>> New: relation IDs of the join rows (composite keys) */
  @RelationId((d: ChartsDirectoryEntity) => d.charts)
  chartMembershipKeys!: Array<{ directoryId: string; chartId: string }>;

  /** >>> New: convenience getter that exposes only the chart IDs */
  get chartIds(): string[] {
    return (this.chartMembershipKeys ?? []).map((k) => k.chartId);
  }
}
