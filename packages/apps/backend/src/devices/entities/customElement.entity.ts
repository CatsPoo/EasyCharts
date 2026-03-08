import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { AuditableEntity } from '../../auth/entities/auditableEntity.culumns';

@Entity({ name: 'custom_elements' })
export class CustomElementEntity extends AuditableEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  name!: string;

  @Column({ nullable: true, type: 'text' })
  imageUrl?: string;
}
