import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  type Relation,
} from 'typeorm';
import { ChartEntity } from './chart.entity';
import { CustomElementEntity } from '../../devices/entities/customElement.entity';
import { Position } from './position.entity';

@Unique(['chartId', 'customElementId', 'id'])
@Entity({ name: 'custom_elements_on_chart' })
export class CustomElementOnChartEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'chart_id', type: 'uuid' })
  chartId!: string;

  @Column({ name: 'custom_element_id', type: 'uuid' })
  customElementId!: string;

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

  @ManyToOne(() => CustomElementEntity, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'custom_element_id' })
  customElement!: Relation<CustomElementEntity>;
}

@Entity({ name: 'custom_element_edges_on_chart' })
export class CustomElementEdgeOnChartEntity {
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

  // Set when the respective node is a device port — used for inUse tracking
  @Column({ name: 'source_port_id', type: 'uuid', nullable: true, default: null })
  sourcePortId?: string | null;

  @Column({ name: 'target_port_id', type: 'uuid', nullable: true, default: null })
  targetPortId?: string | null;

  @ManyToOne(() => ChartEntity, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'chart_id' })
  chart!: Relation<ChartEntity>;
}
