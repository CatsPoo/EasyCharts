import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ModelEntity } from '../../models/entities/model.entity';
import { AuditableEntity } from '../../auth/entities/auditableEntity.culumns';

@Entity({ name: "vendors" })
export class VendorEntity extends AuditableEntity{
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  name!: string;

  @Column({ nullable: true, type: 'text' })
  iconUrl?: string | null;

  @OneToMany(() => ModelEntity, (model) => model.vendor)
  models?: ModelEntity[];
}
