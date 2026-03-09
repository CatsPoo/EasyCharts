import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceTypeEntity } from './entities/deviceType.entity';
import { AssetVersionsService } from '../assetVersions/assetVersions.service';
import { UsersService } from '../auth/user.service';

const DEFAULT_DEVICE_TYPES = [
  'Switch',
  'Router',
  'Firewall',
  'Server',
  'Access Point',
  'Load Balancer',
  'UPS',
  'Patch Panel',
  'NAS / SAN',
  'IP Phone',
  'Camera',
  'Printer',
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
      for (const name of DEFAULT_DEVICE_TYPES) {
        const entity = this.deviceTypeRepo.create({ name, createdByUserId: adminId });
        const saved = await this.deviceTypeRepo.save(entity);
        if (adminId) {
          await this.assetVersionsService.saveVersion('types', saved.id, saved as unknown as object, adminId);
        }
      }
    }
  }
}
