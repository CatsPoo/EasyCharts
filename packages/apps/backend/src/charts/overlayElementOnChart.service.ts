import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import type { OverlayElementOnChart, OverlayEdgeOnChart } from '@easy-charts/easycharts-types';
import {
  OverlayElementOnChartEntity,
  OverlayEdgeOnChartEntity,
} from './entities/overlayElementOnChart.entity';
import { Position } from './entities/position.entity';

@Injectable()
export class OverlayElementsOnChartService {
  convertEntity(entity: OverlayElementOnChartEntity): OverlayElementOnChart {
    return {
      id: entity.id,
      overlayElementId: entity.overlayElementId,
      overlayElement: entity.overlayElement as any,
      position: { x: entity.position.x, y: entity.position.y },
      freeText: entity.freeText ?? '',
      size: { width: entity.width ?? 120, height: entity.height ?? 120 },
    } as OverlayElementOnChart;
  }

  async syncOverlayElementsOnChart(
    manager: EntityManager,
    chartId: string,
    items: OverlayElementOnChart[],
    edges: OverlayEdgeOnChart[],
  ): Promise<void> {
    const oeRepo = manager.getRepository(OverlayElementOnChartEntity);
    const edgeRepo = manager.getRepository(OverlayEdgeOnChartEntity);

    await oeRepo.delete({ chartId });
    await edgeRepo.delete({ chartId });

    if (items.length) {
      const toInsert = items.map((item) => ({
        id: item.id,
        chartId,
        overlayElementId: item.overlayElementId,
        position: { x: item.position.x, y: item.position.y } as Position,
        freeText: item.freeText ?? '',
        width: item.size?.width ?? 120,
        height: item.size?.height ?? 120,
      }));
      await oeRepo.insert(toInsert);
    }

    if (edges.length) {
      const toInsert = edges.map((e) => ({
        id: e.id,
        chartId,
        sourceNodeId: e.sourceNodeId,
        sourceHandle: e.sourceHandle,
        targetNodeId: e.targetNodeId,
        targetHandle: e.targetHandle,
        sourcePortId: e.sourcePortId ?? null,
        targetPortId: e.targetPortId ?? null,
      }));
      await edgeRepo.insert(toInsert);
    }
  }
}
