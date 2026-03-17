import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VendorEntity } from './entities/vendor.entity';
import { AssetVersionsService } from '../assetVersions/assetVersions.service';
import { UsersService } from '../auth/user.service';

// [name, iconUrl?]
const DEFAULT_VENDORS: [string, string?][] = [
  ['Cisco', '/vendors/cisco.svg'],
  ['Checkpoint', '/vendors/checkpoint.svg'],
  ['Juniper', '/vendors/juniper.svg'],
  ['HP', '/vendors/hp.svg'],
  ['F5', '/vendors/f5.svg'],
  ['Palo Alto', '/vendors/paloalto.svg'],
  ['Fortinet', '/vendors/fortinet.svg'],
  ['Arista', '/vendors/arista.svg'],
  ['Dell', '/vendors/dell.svg'],
  ['Aruba', '/vendors/aruba.svg'],
  ['Ruckus', '/vendors/ruckus.svg'],
  ['Extreme Networks', '/vendors/extreme-networks.svg'],
  ['Netscout', '/vendors/netscout.svg'],
  ['VMware', '/vendors/vmware.svg'],
  ['Huawei', '/vendors/huawei.svg'],
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
    await this.seed();
  }

  async seed() {
    const count = await this.vendorsRepo.count();
    if (count === 0) {
      const users = await this.usersService.getAllUsers();
      const adminId = users[0]?.id ?? null;
      for (const [name, iconUrl] of DEFAULT_VENDORS) {
        const entity = this.vendorsRepo.create({ name, iconUrl, createdByUserId: adminId });
        const saved = await this.vendorsRepo.save(entity);
        if (adminId) {
          await this.assetVersionsService.saveVersion('vendors', saved.id, saved as unknown as object, adminId);
        }
      }
    }
  }
}
