import { Injectable } from '@nestjs/common';
import { LineEntity } from './entities/line.entity';
import { Line } from '@easy-charts/easycharts-types';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class LinessService {

    constructor(
        @InjectRepository(LineEntity)
        private readonly linesrepo: Repository<LineEntity>,
    ) {}
    convertLineEntity(lineEntity: LineEntity): Line {
      const { id, sourcePort, targetPort } = lineEntity;
      return {
        id,
        sourcePort,
        targetPort,
      } as Line;
    }

    convertLineToEntity(line:Line) :LineEntity {
      const {id,sourcePort,targetPort} = line
      return {
        id,
        sourcePort,
        sourcePortId:sourcePort.id,
        targetPortId:targetPort.id,
        targetPort
      } as LineEntity
    }
}
