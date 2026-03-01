import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
  Unique,
} from "typeorm";
import { ChartEntity } from "./chart.entity";
import { UserEntity } from "../../auth/entities/user.entity";

@Entity({ name: "chart_versions" })
@Unique(["chartId", "versionNumber"])
export class ChartVersionEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "chart_id", type: "uuid" })
  chartId!: string;

  @ManyToOne(() => ChartEntity, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "chart_id" })
  chart!: Relation<ChartEntity>;

  @Column({ name: "version_number", type: "int" })
  versionNumber!: number;

  @Column({ type: "jsonb" })
  snapshot!: object;

  @Column({ type: "varchar", length: 255, nullable: true, default: null })
  label!: string | null;

  @Column({ name: "saved_by_user_id", type: "uuid" })
  savedByUserId!: string;

  @ManyToOne(() => UserEntity, { eager: true, nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "saved_by_user_id" })
  savedByUser!: Relation<UserEntity> | null;

  @CreateDateColumn({ name: "saved_at", type: "timestamptz" })
  savedAt!: Date;
}
