
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { DevicesService } from './devices.service';
import type { CreateDeviceDto, UpdateDeviceDto } from '@easy-charts/easycharts-types';
import { QueryDto } from '@easy-charts/easycharts-types';

@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDevicePayload: CreateDeviceDto) {
    return this.devicesService.createDevice(createDevicePayload);
  }

  // GET /devices?page=0&pageSize=25&search=...&sortBy=name&sortDir=asc
  @Get()
  async list(@Query() q: QueryDto) {
    // service should implement pagination, optional search and sorting
    // and return: { rows: DeviceEntity[], total: number }
    return this.devicesService.listDevices(q);
  }

  @Get(':id')
  getById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.devicesService.getDeviceById(id);
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateDevicePayload: UpdateDeviceDto,
  ) {
    return this.devicesService.updateDevice(id, updateDevicePayload);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.devicesService.removeDevice(id);
  }
}
