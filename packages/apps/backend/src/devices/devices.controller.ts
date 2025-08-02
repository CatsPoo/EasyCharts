import { Controller, Get } from '@nestjs/common';
import { DevicesService } from './devices.service';

@Controller()
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get()
  getData() {
    return null
  }
}
