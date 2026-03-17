import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from "typeorm";

@Entity("group_chart_shares")
@Index(["groupId", "chartId"], { unique: true })
export class GroupChartShareEntity {
  @PrimaryColumn({ type: "uuid", name: "group_id" })
  groupId!: string;

  @PrimaryColumn({ type: "uuid", name: "chart_id" })
  chartId!: string;

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
