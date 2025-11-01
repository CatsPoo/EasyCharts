import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn
} from "typeorm";
import { LineEntity } from "./line.entity";

@Entity({ name: "bond" })
export class BondEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Column()
  name: string;

  @OneToMany(() => LineEntity, (line) => line.bond, { eager: true })
  members!: LineEntity[];

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt!: Date;

  @Column({ type: "uuid", name: "created_by_user_id" })
  createdByUserId!: string;

  @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
  updatedAt!: Date;

  @Column({ type: "uuid", name: "updated_by_user_id", nullable: true })
  updatedByUserId!: string | null;
}
