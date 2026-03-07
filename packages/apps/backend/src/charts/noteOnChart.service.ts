import { Injectable } from "@nestjs/common";
import { EntityManager } from "typeorm";
import type { NoteOnChart } from "@easy-charts/easycharts-types";
import { NoteOnChartEntity } from "./entities/noteOnChart.entity";
import { Position } from "./entities/position.entity";

@Injectable()
export class NotesOnChartService {
  convertNoteOnChartEntity(entity: NoteOnChartEntity): NoteOnChart {
    return {
      id: entity.id,
      content: entity.content,
      color: entity.color,
      position: { x: entity.position.x, y: entity.position.y },
      size: { width: entity.width, height: entity.height },
    } as NoteOnChart;
  }

  async syncNotes(
    manager: EntityManager,
    chartId: string,
    notes: NoteOnChart[]
  ): Promise<void> {
    const repo = manager.getRepository(NoteOnChartEntity);

    if (notes.length) {
      const desired = notes.map((n) => ({
        id: n.id,
        chartId,
        content: n.content,
        color: n.color,
        position: { x: n.position.x, y: n.position.y } as Position,
        width: n.size.width,
        height: n.size.height,
      }));

      await repo.upsert(desired, {
        conflictPaths: ["id"],
        skipUpdateIfNoValuesChanged: true,
      });

      const keepIds = notes.map((n) => n.id);
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
