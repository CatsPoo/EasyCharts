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
  UseGuards,
} from "@nestjs/common";
import { ZodValidationPipe } from "../common/zodValidation.pipe";
import { DeviceTypeService } from "./deviceType.service";
import { JwdAuthGuard } from "../auth/guards/jwtAuth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermissions } from "../auth/decorators/permissions.decorator";
import {
  type DeviceTypeCreate,
  DeviceTypeCreateSchema,
  type DeviceTypeUpdate,
  DeviceTypeUpdateSchema,
  Permission,
} from "@easy-charts/easycharts-types";
import { QueryDto } from "../query/dto/query.dto";
@UseGuards(JwdAuthGuard, PermissionsGuard)
@Controller("deviceTypes")
export class DeviceTypeController {
  constructor(private readonly DeviceTypeService: DeviceTypeService) {}

  @RequirePermissions(Permission.ASSET_CREATE)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body(new ZodValidationPipe(DeviceTypeCreateSchema))
    payload: DeviceTypeCreate
  ) {
    return this.DeviceTypeService.createDeviceType(payload);
  }

  @RequirePermissions(Permission.ASSET_READ)
  @Get()
  list(@Query() q: QueryDto) {
    return this.DeviceTypeService.listDeviceType(q);
  }

  @RequirePermissions(Permission.ASSET_READ)
  @Get(":id")
  getById(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.DeviceTypeService.getDeviceTypeById(id);
  }

  @RequirePermissions(Permission.ASSET_EDIT)
  @Put(":id")
  update(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(DeviceTypeUpdateSchema))
    payload: DeviceTypeUpdate
  ) {
    return this.DeviceTypeService.updateDeviceType(id, payload);
  }

  @RequirePermissions(Permission.ASSET_DELETE)
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.DeviceTypeService.removeDeviceType(id);
  }
}
