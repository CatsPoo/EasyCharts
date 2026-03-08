import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import type { CustomElementOnChart, CustomElementEdgeOnChart } from '@easy-charts/easycharts-types';
import { CustomElementOnChartEntity, CustomElementEdgeOnChartEntity } from './entities/customElementOnChart.entity';
import { Position } from './entities/position.entity';

@Injectable()
export class CustomElementsOnChartService {
  convertEntity(entity: CustomElementOnChartEntity): CustomElementOnChart {
    return {
      id: entity.id,
      customElementId: entity.customElementId,
      customElement: entity.customElement as any,
      position: { x: entity.position.x, y: entity.position.y },
      freeText: entity.freeText ?? '',
      size: { width: entity.width ?? 120, height: entity.height ?? 120 },
    } as CustomElementOnChart;
  }

  async syncCustomElementsOnChart(
    manager: EntityManager,
    chartId: string,
    items: CustomElementOnChart[],
    edges: CustomElementEdgeOnChart[],
  ): Promise<void> {
    const ceRepo = manager.getRepository(CustomElementOnChartEntity);
    const edgeRepo = manager.getRepository(CustomElementEdgeOnChartEntity);

    // Delete all existing then reinsert (simple replace strategy)
    await ceRepo.delete({ chartId });
    await edgeRepo.delete({ chartId });

    if (items.length) {
      const toInsert = items.map((item) => ({
        id: item.id,
        chartId,
        customElementId: item.customElementId,
        position: { x: item.position.x, y: item.position.y } as Position,
        freeText: item.freeText ?? '',
        width: item.size?.width ?? 120,
        height: item.size?.height ?? 120,
      }));
      await ceRepo.insert(toInsert);
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
