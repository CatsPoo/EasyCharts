import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'models' })
export class ModelEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  name!: string;

}