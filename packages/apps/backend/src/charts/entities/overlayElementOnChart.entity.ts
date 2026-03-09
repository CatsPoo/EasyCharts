import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { ChartEntity } from './chart.entity';
import { OverlayElementEntity } from '../../overlayElements/entities/overlayElement.entity';
import { Position } from './position.entity';

@Entity({ name: 'overlay_elements_on_chart' })
export class OverlayElementOnChartEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'chart_id', type: 'uuid' })
  chartId!: string;

  @Column({ name: 'overlay_element_id', type: 'uuid' })
  overlayElementId!: string;

  @Column(() => Position)
  position!: Position;

  @Column({ name: 'free_text', type: 'text', default: '' })
  freeText!: string;

  @Column({ name: 'width', type: 'double precision', default: 120 })
  width!: number;

  @Column({ name: 'height', type: 'double precision', default: 120 })
  height!: number;

  @ManyToOne(() => ChartEntity, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'chart_id' })
  chart!: Relation<ChartEntity>;

  @ManyToOne(() => OverlayElementEntity, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'overlay_element_id' })
  overlayElement!: Relation<OverlayElementEntity>;
}

@Entity({ name: 'overlay_edges_on_chart' })
export class OverlayEdgeOnChartEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'chart_id', type: 'uuid' })
  chartId!: string;

  @Column({ name: 'source_node_id', type: 'varchar' })
  sourceNodeId!: string;

  @Column({ name: 'source_handle', type: 'varchar' })
  sourceHandle!: string;

  @Column({ name: 'target_node_id', type: 'varchar' })
  targetNodeId!: string;

  @Column({ name: 'target_handle', type: 'varchar' })
  targetHandle!: string;

  @Column({ name: 'source_port_id', type: 'uuid', nullable: true, default: null })
  sourcePortId?: string | null;

  @Column({ name: 'target_port_id', type: 'uuid', nullable: true, default: null })
  targetPortId?: string | null;

  @ManyToOne(() => ChartEntity, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'chart_id' })
  chart!: Relation<ChartEntity>;
}
