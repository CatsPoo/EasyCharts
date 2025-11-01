// apps/api/src/directories/entities/chart-in-directory.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import { ChartsDirectoryEntity } from "./chartsDirectory.entity"

@Entity({ name: "charts_in_directories" })
@Index(["directoryId", "chartId"], { unique: true })
@Index(["directoryId"])
export class ChartInDirectoryEntity {
  @PrimaryColumn({ type: "uuid", name: "directory_id" })
  directoryId!: string;

  @PrimaryColumn({ type: "varchar", length: 36, name: "chart_id" })
  chartId!: string;

  @ManyToOne(() => ChartsDirectoryEntity, (d) => d.charts, {
    onDelete: "CASCADE",
  })
  @JoinColumn({
    name: "directory_id",
    referencedColumnName: "id",
  })
  directory!: ChartsDirectoryEntity;

  @CreateDateColumn({ type: "timestamptz", name: "added_at" })
  addedAt!: Date;

  @Column({ type: "uuid", name: "added_by_user_id", nullable: true })
  addedByUserId!: string | null;
}
