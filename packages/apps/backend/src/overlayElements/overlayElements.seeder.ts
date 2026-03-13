import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OverlayElementEntity } from './entities/overlayElement.entity';
import { UsersService } from '../auth/user.service';

/** Inline SVG data-URL for a generic cloud icon used as the default thumbnail. */
const CLOUD_IMAGE_URL = './cloud.png'

@Injectable()
export class OverlayElementsSeeder implements OnApplicationBootstrap {
  private readonly logger = new Logger(OverlayElementsSeeder.name);

  constructor(
    @InjectRepository(OverlayElementEntity)
    private readonly repo: Repository<OverlayElementEntity>,
    private readonly usersService: UsersService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const count = await this.repo.count();
    if (count > 0) return;

    this.logger.log('Overlay elements table is empty — seeding default system elements...');

    const users = await this.usersService.getAllUsers();
    const adminId = users[0]?.id ?? null;

    await this.repo.save(
      this.repo.create({
        name: 'Cloud',
        isSystem: true,
        imageUrl: CLOUD_IMAGE_URL,
        createdByUserId: adminId,
      }),
    );

    this.logger.log('Seeded default Cloud system element.');
  }
}
