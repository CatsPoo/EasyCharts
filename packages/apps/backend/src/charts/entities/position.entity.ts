import { Column } from 'typeorm';

export class Position {
  @Column('double precision')
  x!: number;

  @Column('double precision')
  y!: number;
}