// src/charts/instance/bonds-on-chart.service.ts
import { Injectable } from "@nestjs/common";
import { EntityManager } from "typeorm";
import type { BondOnChart } from "@Easy-charts/easycharts-types";
import { BondOnChartEntity } from "./entities/BondOnChart.emtity";
import { LinessService } from "../lines/lines.service";

@Injectable()
export class BondsOnChartService {
  /**
   *
   */
  constructor(private readonly linesService: LinessService) {}
  convertBondOnChartEntity(bondonChartEntity: BondOnChartEntity): BondOnChart {
    return {
      bond: this.linesService.convertBondEntitytoBond(bondonChartEntity.bond),
      chartId: bondonChartEntity.chartId,
    } as BondOnChart;
  }
  /**
   * Sync chart<->bond links (BondOnChart) only.
   * Assumes global BondEntity (and its members) already exists/was upserted by the global Lines service.
   */
  async syncLinks(
    manager: EntityManager,
    chartId: string,
    items: BondOnChart[]
  ): Promise<void> {
    const bocRepo = manager.getRepository(BondOnChartEntity);

    const desired = items.map((b) => ({ chartId, bondId: b.bond.id }));
    if (desired.length) {
      await bocRepo.upsert(desired, {
        conflictPaths: ["chartId", "bondId"],
        skipUpdateIfNoValuesChanged: true,
      });
      const keep = items.map((b) => b.bond.id);
      await bocRepo
        .createQueryBuilder()
        .delete()
        .where("chartId = :chartId", { chartId })
        .andWhere("bondId NOT IN (:...keep)", { keep })
        .execute();
    } else {
      await bocRepo.delete({ chartId });
    }
  }
}
