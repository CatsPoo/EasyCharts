import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from "typeorm";

@Entity("chart_shares")
@Index(["chartId", "sharedWithUserId"], { unique: true })
export class ChartShareEntity {
  @PrimaryColumn({ type: "uuid", name: "chart_id" })
  chartId!: string;

  @PrimaryColumn({ type: "uuid", name: "shared_with_user_id" })
  sharedWithUserId!: string;

  @Column({ type: "uuid", name: "shared_by_user_id" })
  sharedByUserId!: string;

  @Column({ type: "boolean", default: false, name: "can_edit" })
  canEdit!: boolean;

  @Column({ type: "boolean", default: false, name: "can_delete" })
  canDelete!: boolean;

  @Column({ type: "boolean", default: false, name: "can_share" })
  canShare!: boolean;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt!: Date;
}
