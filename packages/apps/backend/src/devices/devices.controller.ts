import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { type UpdateDevicePayload, type CreateDevicePayload } from './dto/devices.dto';

@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post()
  create(@Body() createDevicePayload: CreateDevicePayload) {
    return this.devicesService.createDevice(createDevicePayload);
  }

  @Get()
  getAllDevices() {
    return this.devicesService.getAllDevices();
  }

  @Get(':id')
  getDeviceById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.devicesService.getDeviceById(id);
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateDevicePayload: UpdateDevicePayload,
  ) {
    return this.devicesService.updateDevice(id, updateDevicePayload);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.devicesService.removeDevice(id);
  }
}
