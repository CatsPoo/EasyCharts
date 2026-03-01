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
import { UserEntity } from "../../auth/entities/user.entity";

@Entity({ name: "asset_versions" })
@Unique(["assetId", "assetKind", "versionNumber"])
export class AssetVersionEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "asset_id", type: "uuid" })
  assetId!: string;

  @Column({ name: "asset_kind", type: "varchar", length: 50 })
  assetKind!: string;

  @Column({ name: "version_number", type: "int" })
  versionNumber!: number;

  @Column({ type: "jsonb" })
  snapshot!: object;

  @Column({ name: "saved_by_user_id", type: "uuid" })
  savedByUserId!: string;

  @ManyToOne(() => UserEntity, { eager: true, nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "saved_by_user_id" })
  savedByUser!: Relation<UserEntity> | null;

  @CreateDateColumn({ name: "saved_at", type: "timestamptz" })
  savedAt!: Date;
}
