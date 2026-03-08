// src/charts/instance/lines-on-chart.service.ts
import { Injectable } from "@nestjs/common";
import { EntityManager } from "typeorm";
import type { LineOnChart } from "@easy-charts/easycharts-types";
import { LineOnChartEntity } from "./entities/lineonChart.emtity";
import { LinessService } from "../lines/lines.service";

@Injectable()
export class LinesOnChartService {
  /**
   *
   */
  constructor(private readonly linesService: LinessService) {}
  convertLineonChartEntity = async (
    lineOnChartEntity: LineOnChartEntity
  ): Promise<LineOnChart> => {
    const { line: lineEntity, label, type, chartId, cableType, color } = lineOnChartEntity;
    return {
      label,
      type,
      chartId,
      cableType: cableType ?? undefined,
      color: color ?? undefined,
      line: this.linesService.convertLineEntity(lineEntity),
    } as LineOnChart;
  };
  /**
   * Sync chart<->line links (LineOnChart) only.
   * Assumes global LineEntity already exists/was upserted by the global Lines service.
   */
  async syncLinks(
    manager: EntityManager,
    chartId: string,
    items: LineOnChart[]
  ): Promise<void> {
    const locRepo = manager.getRepository(LineOnChartEntity);

    // Upsert all links
    await locRepo.upsert(
      items.map(
        (l) =>
          ({
            chartId,
            lineId: l.line.id,
            label: l.label,
            type: l.type,
            cableType: l.cableType ?? null,
            color: l.color ?? null,
          } as LineOnChartEntity)
      ),
      {
        conflictPaths: ["chartId", "lineId"],
        skipUpdateIfNoValuesChanged: true,
      }
    );

    // Delete removed links (safe for empty keep list)
    const keep = items.map((i) => i.line.id);
    if (keep.length) {
      await locRepo
        .createQueryBuilder()
        .delete()
        .where("chartId = :chartId", { chartId })
        .andWhere("lineId NOT IN (:...keep)", { keep })
        .execute();
    } else {
      await locRepo.delete({ chartId });
    }
  }
}
