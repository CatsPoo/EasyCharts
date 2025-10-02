import { BadGatewayException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { LineEntity } from './entities/line.entity';
import { Bond, BondCreate, BondUpdate, Line } from '@easy-charts/easycharts-types';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { LineOnChartEntity } from '../charts/entities/lineonChart.emtity';
import { BondEntity } from './entities/bond.entity';

@Injectable()
export class LinessService {
  constructor(
    @InjectRepository(LineEntity)
    private readonly linesrepo: Repository<LineEntity>,
    @InjectRepository(BondEntity)
    private readonly bondRepo: Repository<BondEntity>
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

  convertBondEntitytoBond(bondEntity: BondEntity): Bond {
    return {
      id: bondEntity.id,
      name: bondEntity.name,
      membersLines: bondEntity.members.map((m) => m.id),
    } as Bond;
  }
  async createEmptyBond(bondCreate: BondCreate): Promise<Bond> {
    const newBond : BondEntity = await this.bondRepo.save({
      id: bondCreate.id,
      name: bondCreate.name,
    });
    return this.convertBondEntitytoBond(newBond)
  }

  async getBondById(id: string): Promise<Bond> {
    const bond: BondEntity | null = await this.bondRepo.findOne({
      where: { id },
    });
    if (!bond) throw new NotFoundException(`Bond ${id} not found`);
    return this.convertBondEntitytoBond(bond);
  }

  async updateBond(id: string, bondUpdate: BondUpdate): Promise<Bond> {
    const bond: BondEntity | null = await this.bondRepo.findOne({
      where: { id },
    });
    if (!bond) throw new NotFoundException(`Bond ${id} not found`);
    if (bondUpdate.name) bond.name = bondUpdate.name;

    if (bondUpdate.membersLines) {
      const requestedLines: LineEntity[] = await this.linesrepo.findBy({
        id: In(bondUpdate.membersLines),
      });

      for (const line of requestedLines) {
        if (line.bondId !== null)
          throw new BadGatewayException(
            `Line ${line.id} already member of bond ${line.bondId}`
          );
      }

      bond.members = requestedLines;
    }
    const updatedBond: BondEntity | null = await this.bondRepo.save(bond);
    if (!updatedBond)
      throw new InternalServerErrorException(`Cannot update bond ${id}`);
    return this.convertBondEntitytoBond(updatedBond);
  }

  async deleteBond(id: string): Promise<void> {
    this.bondRepo.delete(id);
  }
}
