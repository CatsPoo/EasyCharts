// src/auth/entities/user.entity.ts
import { Permission } from '@easy-charts/easycharts-types';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: "users" })
export class UserEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar" })
  username: string;

  @Column({ type: "varchar", length: 120 })
  displayName!: string;

  @Column({ type: "varchar", length: 255 })
  password!: string;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @Column("varchar", { array: true, default: "{}" })
  permissions!: Permission[];
}
