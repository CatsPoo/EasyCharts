import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ModelEntity } from './model.entity';

@Entity({ name: "vendors" })
export class VendorEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  name!: string;

  @OneToMany(() => ModelEntity, (model) => model.vendor)
  models?: ModelEntity[];
}