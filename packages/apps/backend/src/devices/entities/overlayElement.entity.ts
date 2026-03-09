import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { AuditableEntity } from '../../auth/entities/auditableEntity.culumns';

@Entity({ name: 'overlay_elements' })
export class OverlayElementEntity extends AuditableEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  name!: string;

  @Column({ type: 'varchar', default: 'cloud' })
  type!: 'cloud' | 'customElement';

  @Column({ nullable: true, type: 'text' })
  description?: string;

  @Column({ nullable: true, type: 'text' })
  imageUrl?: string;
}
