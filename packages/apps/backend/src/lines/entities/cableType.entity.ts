import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { AuditableEntity } from "../../auth/entities/auditableEntity.culumns";
import { PortTypeEntity } from "./portType.entity";

@Entity({ name: "cable_types" })
export class CableTypeEntity extends AuditableEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true, type: "varchar", length: 50 })
  name!: string;

  @Column({ name: "default_color", type: "varchar", length: 7 })
  defaultColor!: string;

  @ManyToMany(() => PortTypeEntity, (pt) => pt.cableTypes, { eager: true })
  @JoinTable({
    name: "cable_type_compatible_port_types",
    joinColumn: { name: "cable_type_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "port_type_id", referencedColumnName: "id" },
  })
  compatiblePortTypes!: PortTypeEntity[];
}
