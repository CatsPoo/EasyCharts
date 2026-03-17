import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceTypeEntity } from './entities/deviceType.entity';
import { AssetVersionsService } from '../assetVersions/assetVersions.service';
import { UsersService } from '../auth/user.service';

/** [name, iconUrl?] */
const DEFAULT_DEVICE_TYPES: [string, string?][] = [
  ['Switch',       '/device-types/switch.svg'],
  ['Router',       '/device-types/router.svg'],
  ['Firewall',     '/device-types/firewall.svg'],
  ['Server',       '/device-types/server.svg'],
  ['Access Point', '/device-types/access-point.svg'],
  ['Load Balancer','/device-types/load-balancer.svg'],
  ['UPS',          '/device-types/ups.svg'],
  ['Patch Panel',  '/device-types/patch-panel.svg'],
  ['NAS / SAN',    '/device-types/nas-san.svg'],
  ['IP Phone',     '/device-types/ip-phone.svg'],
  ['Camera',       '/device-types/camera.svg'],
  ['Printer',      '/device-types/printer.svg'],
];

@Injectable()
export class DeviceTypeSeeder implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(DeviceTypeEntity)
    private readonly deviceTypeRepo: Repository<DeviceTypeEntity>,
    private readonly assetVersionsService: AssetVersionsService,
    private readonly usersService: UsersService,
  ) {}

  async onApplicationBootstrap() {
    const count = await this.deviceTypeRepo.count();
    if (count === 0) {
      const users = await this.usersService.getAllUsers();
      const adminId = users[0]?.id ?? null;
      for (const [name, iconUrl] of DEFAULT_DEVICE_TYPES) {
        const entity = this.deviceTypeRepo.create({ name, iconUrl, createdByUserId: adminId });
        const saved = await this.deviceTypeRepo.save(entity);
        if (adminId) {
          await this.assetVersionsService.saveVersion('types', saved.id, saved as unknown as object, adminId);
        }
      }
    }
  }
}
