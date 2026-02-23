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

@UseGuards(JwdAuthGuard, PermissionsGuard)
@Controller("ports")
export class PortsController {
  constructor(private readonly portsService: PortsService) {}

  @RequirePermissions(Permission.ASSET_CREATE)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body(new ZodValidationPipe(PortCreateSchema)) payload: PortCreate,
    @Req() req: { user: string }
  ) {
    return this.portsService.createPort(payload, req.user);
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
  update(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(PortUpdateSchema)) payload: PortUpdate,
    @Req() req: { user: string }
  ) {
    return this.portsService.updatePort(id, payload, req.user);
  }

  @RequirePermissions(Permission.ASSET_DELETE)
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.portsService.removePort(id);
  }
}
