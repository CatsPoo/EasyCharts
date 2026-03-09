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
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  type PortTypeCreate,
  PortTypeCreateSchema,
  type PortTypeUpdate,
  PortTypeUpdateSchema,
  Permission,
} from "@easy-charts/easycharts-types";
import { ZodValidationPipe } from "../common/zodValidation.pipe";
import { JwdAuthGuard } from "../auth/guards/jwtAuth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermissions } from "../auth/decorators/permissions.decorator";
import { PortTypesService } from "./portTypes.service";

@UseGuards(JwdAuthGuard, PermissionsGuard)
@Controller("portTypes")
export class PortTypesController {
  constructor(private readonly portTypesService: PortTypesService) {}

  @RequirePermissions(Permission.ASSET_READ)
  @Get()
  async list() {
    const rows = await this.portTypesService.list();
    return { rows, total: rows.length };
  }

  @RequirePermissions(Permission.ASSET_READ)
  @Get(":id")
  getById(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.portTypesService.getById(id);
  }

  @RequirePermissions(Permission.ASSET_CREATE)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body(new ZodValidationPipe(PortTypeCreateSchema)) dto: PortTypeCreate,
    @Req() req: { user: string }
  ) {
    return this.portTypesService.create(dto, req.user);
  }

  @RequirePermissions(Permission.ASSET_EDIT)
  @Put(":id")
  update(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(PortTypeUpdateSchema)) dto: PortTypeUpdate,
    @Req() req: { user: string }
  ) {
    return this.portTypesService.update(id, dto, req.user);
  }

  @RequirePermissions(Permission.ASSET_DELETE)
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.portTypesService.remove(id);
  }
}
