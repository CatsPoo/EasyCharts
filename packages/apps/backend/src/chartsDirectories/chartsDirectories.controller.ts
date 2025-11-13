import {
  type CreateChartDirectory,
  CreateChartDirectorySchema,
  Permission,
  type UpadateChartDirectory,
  UpdateChartsDirectorySchema
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
  Req,
  UseGuards
} from "@nestjs/common";
import { RequirePermissions } from "../auth/decorators/permissions.decorator";
import { JwdAuthGuard } from "../auth/guards/jwtAuth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { ZodValidationPipe } from "../common/zodValidation.pipe";
import { ChartsDirectoriesService } from "./chartsDirectories.service";
@UseGuards(JwdAuthGuard, PermissionsGuard)
@Controller("chartsDirectories")
export class ChartsDirectoriesController {
  constructor(private readonly chartsDirectoriesService: ChartsDirectoriesService) {}

  @RequirePermissions(Permission.ASSET_CREATE)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body(new ZodValidationPipe(CreateChartDirectorySchema))
    payload: CreateChartDirectory,
    @Req() req: {user:string}
  ) {
    return this.chartsDirectoriesService.createChartsDirectory(payload,req.user);
  }

  @RequirePermissions(Permission.ASSET_READ)
  @Get()
  listRootsDirectories() {
    return this.chartsDirectoriesService.listRoots();
  }

  @RequirePermissions(Permission.ASSET_READ)
  @Get(":id")
  getById(@Param("id", new ParseUUIDPipe(),) id: string,) {
    return this.chartsDirectoriesService.getChartsDirectoryById(id);
  }

  @RequirePermissions(Permission.ASSET_EDIT)
  @Put(":id")
  update(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(UpdateChartsDirectorySchema))
    payload: UpadateChartDirectory,
    @Req() req: {user:string}
  ) {
    return this.chartsDirectoriesService.updateChartsDirectory(id, payload,req.user);
  }

  @RequirePermissions(Permission.ASSET_DELETE)
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.chartsDirectoriesService.remove(id);
  }
}
