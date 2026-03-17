import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from "typeorm";

@Entity("group_directory_shares")
@Index(["groupId", "directoryId"], { unique: true })
export class GroupDirectoryShareEntity {
  @PrimaryColumn({ type: "uuid", name: "group_id" })
  groupId!: string;

  @PrimaryColumn({ type: "uuid", name: "directory_id" })
  directoryId!: string;

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
