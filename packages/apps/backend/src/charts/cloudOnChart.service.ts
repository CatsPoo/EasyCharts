import { Injectable } from "@nestjs/common";
import { EntityManager } from "typeorm";
import type { CloudOnChart } from "@easy-charts/easycharts-types";
import { CloudOnChartEntity, CloudConnectionOnChartEntity } from "./entities/cloudOnChart.entity";
import { Position } from "./entities/position.entity";

@Injectable()
export class CloudsOnChartService {
  convertCloudOnChartEntity(entity: CloudOnChartEntity): CloudOnChart {
    return {
      cloudId: entity.cloudId,
      cloud: entity.cloud as any,
      position: { x: entity.position.x, y: entity.position.y },
      size: { width: entity.width ?? 180, height: entity.height ?? 90 },
      connections: (entity.connections ?? []).map((c) => ({
        id: c.id,
        deviceId: c.deviceId,
        portId: c.portId,
        cloudHandle: c.cloudHandle,
      })),
    } as CloudOnChart;
  }

  async syncCloudsOnChart(
    manager: EntityManager,
    chartId: string,
    cloudsOnChart: CloudOnChart[]
  ): Promise<void> {
    const cocRepo = manager.getRepository(CloudOnChartEntity);
    const connRepo = manager.getRepository(CloudConnectionOnChartEntity);

    if (cloudsOnChart.length === 0) {
      await cocRepo.delete({ chartId });
      return;
    }

    // Upsert cloud placements (unique by chartId + cloudId)
    const desiredClouds = cloudsOnChart.map((c) => ({
      chartId,
      cloudId: c.cloudId,
      position: { x: c.position.x, y: c.position.y } as Position,
      width: c.size?.width ?? 180,
      height: c.size?.height ?? 90,
    }));
    await cocRepo.upsert(desiredClouds, {
      conflictPaths: ["chartId", "cloudId"],
    });

    // Delete removed clouds (cascade also removes their connections)
    const keepCloudIds = cloudsOnChart.map((c) => c.cloudId);
    await cocRepo
      .createQueryBuilder()
      .delete()
      .where("chartId = :chartId", { chartId })
      .andWhere("cloudId NOT IN (:...keepCloudIds)", { keepCloudIds })
      .execute();

    // Reload to get stable IDs for the upserted cloud_on_chart rows
    const savedClouds = await cocRepo.find({ where: { chartId } });
    const cocByCloudId = new Map(savedClouds.map((s) => [s.cloudId, s.id]));

    // Delete all existing connections for this chart then reinsert
    await connRepo.delete({ chartId });

    const newConns: Partial<CloudConnectionOnChartEntity>[] = [];
    for (const c of cloudsOnChart) {
      const cloudOnChartId = cocByCloudId.get(c.cloudId);
      if (!cloudOnChartId) continue;
      for (const conn of c.connections ?? []) {
        newConns.push({
          id: conn.id,
          chartId,
          cloudOnChartId,
          deviceId: conn.deviceId,
          portId: conn.portId,
          cloudHandle: conn.cloudHandle,
        });
      }
    }
    if (newConns.length) {
      await connRepo.insert(newConns);
    }
  }
}
