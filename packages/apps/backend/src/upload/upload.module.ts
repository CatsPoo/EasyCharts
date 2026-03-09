import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [UploadController],
})
export class UploadModule {}
