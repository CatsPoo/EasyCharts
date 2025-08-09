import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'vendors' })
export class VendorEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  name!: string;

}