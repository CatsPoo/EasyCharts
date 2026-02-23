import { Body, Controller, Post } from '@nestjs/common';
import { type BondPortSiblingsResult, LinessService } from './lines.service';
import type { Port } from '@easy-charts/easycharts-types';

@Controller('lines')
export class LinesController {
  constructor(private readonly linesService: LinessService) {}

  @Post('connected-port-ids')
  async getConnectedPortIds(
    @Body() body: { portIds: string[] },
  ): Promise<Record<string, string>> {
    const map = await this.linesService.getConnectedPortIdMap(body.portIds ?? []);
    return Object.fromEntries(map);
  }

  @Post('bond-port-siblings')
  async getBondPortSiblings(
    @Body() body: { portId: string; deviceId: string },
  ): Promise<BondPortSiblingsResult | null> {
    return this.linesService.getBondPortSiblings(body.portId, body.deviceId);
  }

  @Post('connected-port-info')
  async getConnectedPortInfo(
    @Body() body: { portId: string },
  ): Promise<Port | null> {
    return this.linesService.getConnectedPortInfo(body.portId);
  }
}
