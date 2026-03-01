import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { AuditableEntity } from '../../auth/entities/auditableEntity.culumns';

@Entity({ name: 'clouds' })
export class CloudEntity extends AuditableEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  name!: string;

  @Column({ nullable: true, type: 'text' })
  description?: string;
}
