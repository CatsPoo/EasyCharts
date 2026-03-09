import { type PortCreate, PortCreateSchema, type PortUpdate, PortUpdateSchema, Permission } from '@easy-charts/easycharts-types';
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
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwdAuthGuard } from '../auth/guards/jwtAuth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { ZodValidationPipe } from '../common/zodValidation.pipe';
import { QueryDto } from '../query/dto/query.dto';
import { PortsService } from './ports.service';
import { DevicesService } from './devices.service';
import { AssetVersionsService } from '../assetVersions/assetVersions.service';

@UseGuards(JwdAuthGuard, PermissionsGuard)
@Controller("ports")
export class PortsController {
  constructor(
    private readonly portsService: PortsService,
    private readonly devicesService: DevicesService,
    private readonly assetVersionsService: AssetVersionsService,
  ) {}

  @RequirePermissions(Permission.ASSET_CREATE)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ZodValidationPipe(PortCreateSchema)) payload: PortCreate,
    @Req() req: { user: string }
  ) {
    const port = await this.portsService.createPort(payload, req.user);
    const device = await this.devicesService.getDeviceById(port.deviceId);
    await this.assetVersionsService.saveVersion("devices", device.id, device, req.user);
    return port;
  }

  @RequirePermissions(Permission.ASSET_READ)
  @Get()
  list(@Query() q: QueryDto) {
    return this.portsService.listPorts(q);
  }

  @RequirePermissions(Permission.ASSET_READ)
  @Get(":id")
  getById(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.portsService.getPortrById(id);
  }

  @RequirePermissions(Permission.ASSET_EDIT)
  @Put(":id")
  async update(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(PortUpdateSchema)) payload: PortUpdate,
    @Req() req: { user: string }
  ) {
    const port = await this.portsService.updatePort(id, payload, req.user);
    const device = await this.devicesService.getDeviceById(port.deviceId);
    await this.assetVersionsService.saveVersion("devices", device.id, device, req.user);
    return port;
  }

  @RequirePermissions(Permission.ASSET_DELETE)
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Req() req: { user: string }
  ) {
    const port = await this.portsService.getPortrById(id);
    await this.portsService.removePort(id);
    const device = await this.devicesService.getDeviceById(port.deviceId);
    await this.assetVersionsService.saveVersion("devices", device.id, device, req.user);
  }
}
