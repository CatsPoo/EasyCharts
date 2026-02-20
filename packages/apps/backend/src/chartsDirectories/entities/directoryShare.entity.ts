import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from "typeorm";

@Entity("directory_shares")
@Index(["directoryId", "sharedWithUserId"], { unique: true })
export class DirectoryShareEntity {
  @PrimaryColumn({ type: "uuid", name: "directory_id" })
  directoryId!: string;

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
