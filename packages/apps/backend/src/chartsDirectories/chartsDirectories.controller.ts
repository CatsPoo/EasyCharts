import {
  type CreateChartDirectory,
  CreateChartDirectorySchema,
  Permission,
  ShareDirectoryRequestSchema,
  type ShareDirectoryRequest,
  type UpadateChartDirectory,
  UpdateChartsDirectorySchema,
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
  UseGuards,
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

  @RequirePermissions(Permission.CHART_CREATE)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body(new ZodValidationPipe(CreateChartDirectorySchema))
    payload: CreateChartDirectory,
    @Req() req: { user: string },
  ) {
    return this.chartsDirectoriesService.createChartsDirectory(payload, req.user);
  }

  @RequirePermissions(Permission.CHART_READ)
  @Get()
  listRootsDirectories(@Req() req: { user: string }) {
    return this.chartsDirectoriesService.listRoots(req.user);
  }

  @RequirePermissions(Permission.CHART_READ)
  @Get(":id")
  getById(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.chartsDirectoriesService.getChartsDirectoryById(id);
  }

  @RequirePermissions(Permission.CHART_READ)
  @Get(":id/children")
  listChildren(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Req() req: { user: string },
  ) {
    return this.chartsDirectoriesService.listChildren(id, req.user);
  }

  @RequirePermissions(Permission.CHART_UPDATE)
  @Put(":id")
  update(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(UpdateChartsDirectorySchema))
    payload: UpadateChartDirectory,
    @Req() req: { user: string },
  ) {
    return this.chartsDirectoriesService.updateChartsDirectory(id, payload, req.user);
  }

  @RequirePermissions(Permission.CHART_DELETE)
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Req() req: { user: string },
  ) {
    return this.chartsDirectoriesService.remove(id, req.user);
  }

  // ─── Sharing ────────────────────────────────────────────────────────────────

  @RequirePermissions(Permission.CHART_SHARE)
  @Get(":id/shares")
  getShares(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.chartsDirectoriesService.getDirectoryShares(id);
  }

  @RequirePermissions(Permission.CHART_SHARE)
  @Post(":id/share")
  @HttpCode(HttpStatus.CREATED)
  share(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(ShareDirectoryRequestSchema)) body: ShareDirectoryRequest,
    @Req() req: { user: string },
  ) {
    return this.chartsDirectoriesService.shareDirectory(
      id,
      body.sharedWithUserId,
      req.user,
      { canEdit: body.canEdit, canDelete: body.canDelete, canShare: body.canShare },
      body.includeContent,
    );
  }

  @RequirePermissions(Permission.CHART_SHARE)
  @Delete(":id/share/:userId")
  @HttpCode(HttpStatus.NO_CONTENT)
  unshare(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Param("userId", new ParseUUIDPipe()) userId: string,
  ) {
    return this.chartsDirectoriesService.unshareDirectory(id, userId);
  }
}
