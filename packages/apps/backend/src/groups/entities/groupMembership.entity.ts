import { Column, CreateDateColumn, Entity, PrimaryColumn } from "typeorm";

@Entity("group_memberships")
export class GroupMembershipEntity {
  @PrimaryColumn({ type: "uuid", name: "group_id" })
  groupId!: string;

  @PrimaryColumn({ type: "uuid", name: "user_id" })
  userId!: string;

  @Column({ type: "uuid", name: "added_by_user_id" })
  addedByUserId!: string;

  @CreateDateColumn({ type: "timestamptz", name: "added_at" })
  addedAt!: Date;
}
