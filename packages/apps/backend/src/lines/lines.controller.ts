import { Controller, Get } from '@nestjs/common';
import { LinessService } from './lines.service';

@Controller()
export class LinesController {
  constructor(private readonly linesService: LinessService) {}

  @Get()
  getData() {
    return null
  }
}
