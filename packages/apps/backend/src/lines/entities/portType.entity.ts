import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { AuditableEntity } from "../../auth/entities/auditableEntity.culumns";
import { CableTypeEntity } from "./cableType.entity";

@Entity({ name: "port_types" })
export class PortTypeEntity extends AuditableEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true, type: "varchar", length: 50 })
  name!: string;

  @ManyToMany(() => CableTypeEntity, (ct) => ct.compatiblePortTypes)
  cableTypes?: CableTypeEntity[];
}
