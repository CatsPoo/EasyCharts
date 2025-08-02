import { Controller, Get } from '@nestjs/common';
import { ChartsService } from './charts.service';

@Controller()
export class ChartsController {
  constructor(private readonly chartsService: ChartsService) {}

  @Get()
  getData() {
    return null
  }
}
