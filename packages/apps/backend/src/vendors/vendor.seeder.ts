import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VendorEntity } from './entities/vendor.entity';
import { AssetVersionsService } from '../devices/assetVersions.service';
import { UsersService } from '../auth/user.service';

const DEFAULT_VENDORS = [
  'Cisco',
  'Checkpoint',
  'Juniper',
  'HP',
  'F5',
  'Palo Alto',
  'Fortinet',
  'Arista',
  'Dell',
  'Aruba',
  'Ruckus',
  'Extreme Networks',
  'Netscout',
  'VMware',
  'Huawei',
];

@Injectable()
export class VendorSeeder implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(VendorEntity)
    private readonly vendorsRepo: Repository<VendorEntity>,
    private readonly assetVersionsService: AssetVersionsService,
    private readonly usersService: UsersService,
  ) {}

  async onApplicationBootstrap() {
    const count = await this.vendorsRepo.count();
    if (count === 0) {
      const users = await this.usersService.getAllUsers();
      const adminId = users[0]?.id ?? null;
      for (const name of DEFAULT_VENDORS) {
        const entity = this.vendorsRepo.create({ name, createdByUserId: adminId });
        const saved = await this.vendorsRepo.save(entity);
        if (adminId) {
          await this.assetVersionsService.saveVersion('vendors', saved.id, saved as unknown as object, adminId);
        }
      }
    }
  }
}
