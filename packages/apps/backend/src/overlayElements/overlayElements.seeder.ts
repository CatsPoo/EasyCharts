import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OverlayElementEntity } from '../devices/entities/overlayElement.entity';
import { UsersService } from '../auth/user.service';

/** Inline SVG data-URL for a generic cloud icon used as the default thumbnail. */
const CLOUD_IMAGE_URL =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%236366f1">' +
    '<path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04' +
    'A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5' +
    ' 0-2.64-2.05-4.78-4.65-4.96z"/>' +
    '</svg>',
  );

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
