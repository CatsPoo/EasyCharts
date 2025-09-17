import { Injectable } from '@nestjs/common';
import { LineEntity } from './entities/line.entity';
import { Line } from '@easy-charts/easycharts-types';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LineOnChartEntity } from '../charts/entities/lineonChart.emtity';

@Injectable()
export class LinessService {
  constructor(
    @InjectRepository(LineEntity)
    private readonly linesrepo: Repository<LineEntity>
  ) {}
  convertLineEntity(lineEntity: LineEntity): Line {
    const { id, sourcePort, targetPort } = lineEntity;
    return {
      id,
      sourcePort,
      targetPort,
    } as Line;
  }

  convertLineToEntity(line: Line): LineEntity {
    const { id, sourcePort, targetPort } = line;
    return {
      id,
      sourcePort,
      sourcePortId: sourcePort.id,
      targetPortId: targetPort.id,
      targetPort,
    } as LineEntity;
  }

  async deleteOrphanLines(): Promise<number> {
    return this.linesrepo.manager.transaction(async (m) => {
      const usedLinesSub = m
        .createQueryBuilder()
        .subQuery()
        .select("loc.lineId")
        .from(LineOnChartEntity, "loc")
        .getQuery(); // -> (SELECT loc.lineId FROM lines_on_chart loc)

      const res = await m
        .createQueryBuilder()
        .delete()
        .from(LineEntity)
        .where(`id NOT IN ${usedLinesSub}`)
        .execute();

      return res.affected ?? 0;
    });
  }
}
