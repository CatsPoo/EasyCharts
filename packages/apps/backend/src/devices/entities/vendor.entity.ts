import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ModelEntity } from './model.entity';

@Entity({ name: "vendors" })
export class VendorEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  name!: string;

  @OneToMany(() => ModelEntity, (model) => model.vendor)
  models?: ModelEntity[];

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt!: Date;

  @Column({ type: "uuid", name: "created_by_user_id" })
  createdByUserId!: string;

  @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
  updatedAt!: Date;

  @Column({ type: "uuid", name: "updated_by_user_id", nullable: true })
  updatedByUserId!: string | null;
}