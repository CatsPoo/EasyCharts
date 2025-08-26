import { Module } from '@nestjs/common';
import { LinesController } from './lines.controller';
import { LinessService } from './lines.service';

@Module({
  imports: [],
  controllers: [LinesController],
  providers: [LinessService],
})
export class LinesModule {}
