import {
  Column,
  Entity,
  OneToMany,
  PrimaryColumn
} from "typeorm";
import { LineEntity } from "./line.entity";

@Entity({ name: "bond" })
export class BondEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Column()
  name:string

  @OneToMany(() => LineEntity, (line) => line.bond,{ eager: true })
  members!: LineEntity[];
}
