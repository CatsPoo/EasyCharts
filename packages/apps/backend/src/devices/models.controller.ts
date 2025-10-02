import {
  ModelCreateSchema,
  ModelUpdateSchema,
  Permission,
  type ModelCreate,
  type ModelUpdate,
} from "@easy-charts/easycharts-types";
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
  UseGuards
} from "@nestjs/common";
import { ZodValidationPipe } from "../common/zodValidation.pipe";
import { ListModelsQueryDto } from "../query/dto/query.dto";
import { ModelsService } from "./model.service";
import { JwdAuthGuard } from "../auth/guards/jwtAuth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermissions } from "../auth/decorators/permissions.decorator";
@UseGuards(JwdAuthGuard,PermissionsGuard)
@Controller("models")
export class ModelsController {
  constructor(private readonly modelsService: ModelsService) {}

  @RequirePermissions(Permission.ASSET_CREATE)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body(new ZodValidationPipe(ModelCreateSchema)) payload: ModelCreate) {
    return this.modelsService.createModel(payload);
  }

  @RequirePermissions(Permission.ASSET_READ)
  @Get()
  list(@Query() q: ListModelsQueryDto) {
    return this.modelsService.listModels(q);
  }

  @RequirePermissions(Permission.ASSET_READ)
  @Get(":id")
  getById(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.modelsService.getModelById(id);
  }

  @RequirePermissions(Permission.ASSET_EDIT)
  @Put(":id")
  update(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(ModelUpdateSchema)) payload: ModelUpdate
  ) {
    return this.modelsService.updateModel(id, payload);
  }

  @RequirePermissions(Permission.ASSET_DELETE)
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.modelsService.removeModel(id);
  }
}
