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
  type CableTypeCreate,
  CableTypeCreateSchema,
  type CableTypeUpdate,
  CableTypeUpdateSchema,
  Permission,
} from "@easy-charts/easycharts-types";
import { ZodValidationPipe } from "../common/zodValidation.pipe";
import { JwdAuthGuard } from "../auth/guards/jwtAuth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermissions } from "../auth/decorators/permissions.decorator";
import { CableTypesService } from "./cableTypes.service";

@UseGuards(JwdAuthGuard, PermissionsGuard)
@Controller("cableTypes")
export class CableTypesController {
  constructor(private readonly cableTypesService: CableTypesService) {}

  @RequirePermissions(Permission.ASSET_READ)
  @Get()
  async list() {
    const rows = await this.cableTypesService.list();
    return { rows, total: rows.length };
  }

  @RequirePermissions(Permission.ASSET_READ)
  @Get(":id")
  getById(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.cableTypesService.getById(id);
  }

  @RequirePermissions(Permission.ASSET_CREATE)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body(new ZodValidationPipe(CableTypeCreateSchema)) dto: CableTypeCreate,
    @Req() req: { user: string }
  ) {
    return this.cableTypesService.create(dto, req.user);
  }

  @RequirePermissions(Permission.ASSET_EDIT)
  @Put(":id")
  update(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(CableTypeUpdateSchema)) dto: CableTypeUpdate,
    @Req() req: { user: string }
  ) {
    return this.cableTypesService.update(id, dto, req.user);
  }

  @RequirePermissions(Permission.ASSET_DELETE)
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.cableTypesService.remove(id);
  }
}
