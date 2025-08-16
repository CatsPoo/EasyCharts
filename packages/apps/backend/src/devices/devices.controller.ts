import type { CreateDeviceDto, UpdateDeviceDto } from '@easy-charts/easycharts-types';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { QueryDto } from '../query/dto/query.dto';
import { DevicesService } from './devices.service';

@Controller("devices")
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() payload: CreateDeviceDto) {
    return this.devicesService.createDevice(payload);
  }

  // GET /devices?page=&pageSize=&search=&sortBy=&sortDir=
  @Get()
  list(@Query() q: QueryDto) {
    return this.devicesService.listDevices(q);
  }

  @Get(":id")
  getById(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.devicesService.getDeviceById(id);
  }

  @Put(":id")
  update(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() payload: UpdateDeviceDto
  ) {
    return this.devicesService.updateDevice(id, payload);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.devicesService.removeDevice(id);
  }
}
