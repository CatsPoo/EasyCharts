// src/charts/instance/devices-on-chart.service.ts
import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { EntityManager, In } from "typeorm";
import type { Device, DeviceOnChart, Handles, Position } from "@easy-charts/easycharts-types";
import { PortOnChartEntity } from "./entities/portOnChart.entity";
import { DeviceEntity } from "../devices/entities/device.entity";
import { DeviceOnChartEntity } from "./entities/deviceOnChart.entity";
import { PortEntity } from "../devices/entities/port.entity";
import { DevicesService } from "../devices/devices.service";
import { PortsOnChartService } from "./portsOnChart.service";
import { PortsService } from "../devices/ports.service";
import { AssetVersionsService } from "../assetVersions/assetVersions.service";

@Injectable()
export class DevicesOnChartService {
  constructor(
    private readonly devicesService: DevicesService,
    private readonly portsOnChartService: PortsOnChartService,
    private readonly portsService:PortsService,
    private readonly assetVersionsService: AssetVersionsService,
  ) {}

  convertDeviceOnChartEntity = async (
    deviceonChartEntity: DeviceOnChartEntity
  ): Promise<DeviceOnChart> => {
    const { chartId, position, device, portPlacements } = deviceonChartEntity;
    return {
      chartId,
      device: this.devicesService.convertDeviceEntity(device),
      position,
      handles: this.portsOnChartService.rowsToHandles(portPlacements ?? []),
    } as DeviceOnChart;
  };

  /**
   * Upsert placements (DeviceOnChart) + replace handles (PortOnChart) for ALL devices in one shot.
   * Does not touch global devices/ports (no creation, no updates) — instance-only.
   */
  async syncPlacementsAndHandles(
    manager: EntityManager,
    chartId: string,
    placements: Array<{
      device: Device;
      position: Position;
      handles?: Handles;
    }>,
    updatedByUserId:string
  ): Promise<void> {
    const docRepo = manager.getRepository(DeviceOnChartEntity);
    const pocRepo = manager.getRepository(PortOnChartEntity);
    const deviceRepo = manager.getRepository(DeviceEntity);
    const portRepo = manager.getRepository(PortEntity);


    // Validate devices exist (global)
    const uniqDeviceIds = [...new Set(placements.map((d) => d.device.id))];
    if (uniqDeviceIds.length) {
      const count = await deviceRepo.count({
        where: { id: In(uniqDeviceIds) },
      });
      if (count !== uniqDeviceIds.length)
        throw new NotFoundException("One or more devices do not exist");
    }

    // Upsert instance placements
    await docRepo.upsert(
      placements.map((d) => ({
        chartId,
        deviceId: d.device.id,
        position: d.position,
      })),
      ["chartId", "deviceId"]
    );

    // Remove placements not present
    const desiredIds = new Set(placements.map((d) => d.device.id));
    const existing = await docRepo.find({ where: { chartId } });
    const toRemove = existing.filter((e) => !desiredIds.has(e.deviceId));
    if (toRemove.length) await docRepo.remove(toRemove);

    // Replace handles per device
    for (const d of placements) {

    const portsChanged = await this.portsService.upsertPortsForDevice(d.device.id, d.device.ports, updatedByUserId, manager);
      if (portsChanged) {
        await this.assetVersionsService.saveVersion("devices", d.device.id, d.device, updatedByUserId);
      }
      const desiredRows = this.portsOnChartService.handlesToRows(
        chartId,
        d.device.id,
        d.handles
      );

      // Validate that every port belongs to the device (global invariant)
      if (desiredRows.length) {
        const distinct = [...new Set(desiredRows.map((r) => r.portId))];
        const cnt = await portRepo.count({
          where: { id: In(distinct), deviceId: d.device.id },
        });
        if (cnt !== distinct.length) {
          throw new BadRequestException(
            "One or more ports do not belong to this device"
          );
        }
      }

      await pocRepo.delete({ chartId, deviceId: d.device.id });
      if (desiredRows.length) await pocRepo.insert(desiredRows);
    }
  }
}
