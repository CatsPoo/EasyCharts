import { Device, DeviceOnChart, HandleInfo, Handles, Side, SIDES } from "@easy-charts/easycharts-types";
import { BadRequestException, Injectable } from "@nestjs/common";
import { PortsService } from "../devices/ports.service";
import { PortOnChartEntity } from "./entities/portOnChart.entity";
import { PortEntity } from "../devices/entities/port.entity";
import { In } from "typeorm";
import { DeviceOnChartEntity } from "./entities/deviceOnChart.entity";

@Injectable()
export class PortsOnChartService {
  constructor(private readonly portsService: PortsService) {}

  public handlesToRows(
    chartId: string,
    deviceId: string,
    handles?: Handles
  ): Array<
    Pick<PortOnChartEntity, "chartId" | "deviceId" | "portId" | "side">
  > {
    if (!handles) return [];
    const rows: Array<
      Pick<PortOnChartEntity, "chartId" | "deviceId" | "portId" | "side">
    > = [];
    SIDES.forEach((side) => {
      const arr = handles[side] ?? [];
      for (const h of arr)
        rows.push({ chartId, deviceId, portId: h.port.id, side });
    });
    return rows;
  }

  rowsToHandles(placements: PortOnChartEntity[]): Handles {
    const bySide: Record<Side, HandleInfo[]> = {
      left: [],
      right: [],
      top: [],
      bottom: [],
    };
    for (const r of placements) {
      bySide[r.side].push({
        port: this.portsService.convertPortEntityToPort(r.port),
      });
    }
    return bySide;
  }
}