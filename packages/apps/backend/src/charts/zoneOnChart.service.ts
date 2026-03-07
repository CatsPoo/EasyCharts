import { Injectable } from "@nestjs/common";
import { EntityManager } from "typeorm";
import type { ZoneOnChart } from "@easy-charts/easycharts-types";
import { ZoneOnChartEntity } from "./entities/zoneOnChart.entity";
import { Position } from "./entities/position.entity";

@Injectable()
export class ZonesOnChartService {
  convertZoneOnChartEntity(entity: ZoneOnChartEntity): ZoneOnChart {
    return {
      id: entity.id,
      label: entity.label,
      shape: entity.shape as ZoneOnChart["shape"],
      color: entity.color,
      fillColor: entity.fillColor ?? "",
      fillOpacity: entity.fillOpacity,
      borderStyle: entity.borderStyle as ZoneOnChart["borderStyle"],
      borderWidth: entity.borderWidth,
      position: { x: entity.position.x, y: entity.position.y },
      size: { width: entity.width, height: entity.height },
    } as ZoneOnChart;
  }

  async syncZones(
    manager: EntityManager,
    chartId: string,
    zones: ZoneOnChart[]
  ): Promise<void> {
    const repo = manager.getRepository(ZoneOnChartEntity);

    if (zones.length) {
      const desired = zones.map((z) => ({
        id: z.id,
        chartId,
        label: z.label,
        shape: z.shape,
        color: z.color,
        fillColor: z.fillColor ?? "",
        fillOpacity: z.fillOpacity,
        borderStyle: z.borderStyle,
        borderWidth: z.borderWidth,
        position: { x: z.position.x, y: z.position.y } as Position,
        width: z.size.width,
        height: z.size.height,
      }));

      await repo.upsert(desired, {
        conflictPaths: ["id"],
        skipUpdateIfNoValuesChanged: true,
      });

      const keepIds = zones.map((z) => z.id);
      await repo
        .createQueryBuilder()
        .delete()
        .where("chartId = :chartId", { chartId })
        .andWhere("id NOT IN (:...keepIds)", { keepIds })
        .execute();
    } else {
      await repo.delete({ chartId });
    }
  }
}
