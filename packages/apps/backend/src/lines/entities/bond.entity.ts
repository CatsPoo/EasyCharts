import {
  Column,
  Entity,
  OneToMany,
  PrimaryColumn
} from "typeorm";
import { AuditableEntity } from "../../auth/entities/auditableEntity.culumns";
import { LineEntity } from "./line.entity";

@Entity({ name: "bond" })
export class BondEntity extends AuditableEntity{
  @PrimaryColumn("uuid")
  id!: string;

  @Column()
  name: string;

  @OneToMany(() => LineEntity, (line) => line.bond, { eager: true })
  members!: LineEntity[];
}
