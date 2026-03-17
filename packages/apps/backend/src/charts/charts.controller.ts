import {
  type ChartCreate,
  ChartCreateSchema,
  ChartMetadata,
  type ChartUpdate,
  Permission,
  ShareWithUserSchema,
  type ShareWithUser,
  ShareWithGroupSchema,
  type ShareWithGroup,
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
  Patch,
  Post,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { ZodValidationPipe } from "../common/zodValidation.pipe";
import { ChartsService } from "./charts.service";
import { JwdAuthGuard } from "../auth/guards/jwtAuth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermissions } from "../auth/decorators/permissions.decorator";
import { ChartShareGuard } from "./guards/chartShare.guard";
import { RequireChartPrivilege } from "./decorators/requireChartPrivilege.decorator";


@UseGuards(JwdAuthGuard, PermissionsGuard, ChartShareGuard)
@Controller("charts")
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class ChartsController {
  constructor(private readonly chartService: ChartsService) {}

  @RequirePermissions(Permission.CHART_READ)
  @Get()
  findAll() {
    return this.chartService.getAllCharts();
  }

  @RequirePermissions(Permission.CHART_READ)
  @Get("metadata")
  async getAllChartMetadata(
    @Req() req: { user: string }
  ): Promise<ChartMetadata[]> {
    return this.chartService.getAllUserChartsMetadata(req.user);
  }

  @RequirePermissions(Permission.CHART_READ)
  @Get("metadata/unassigned")
  async getUnassignedChartMetadata(
    @Req() req: { user: string }
  ): Promise<ChartMetadata[]> {
    return this.chartService.getUnassignedChartsMetadata(req.user);
  }

  @RequirePermissions(Permission.CHART_READ)
  @RequireChartPrivilege('read')
  @Get(":id/metadata")
  async getChartMetadata(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Req() req: { user: string },
  ): Promise<ChartMetadata> {
    return this.chartService.getChartMetadataById(id, req.user);
  }

  @RequirePermissions(Permission.CHART_UPDATE)
  @RequireChartPrivilege('read')
  @Get(":id/lock")
  async fetchLock(@Param("id") id: string, @Req() req: { user: string }) {
    return this.chartService.fetchLock(id, req.user);
  }

  @RequirePermissions(Permission.CHART_UPDATE)
  @RequireChartPrivilege('canEdit')
  @Patch(":id/lock")
  async lockChart(@Param("id") id: string, @Req() req: { user: string }) {
    return this.chartService.lockChart(id, req.user);
  }

  @RequirePermissions(Permission.CHART_UPDATE)
  @RequireChartPrivilege('canEdit')
  @Patch(":id/unlock")
  async unlockChart(@Param("id") id: string, @Req() req: { user: string }) {
    return this.chartService.unlockChart(id, req.user);
  }

  @RequirePermissions(Permission.CHART_READ)
  @RequireChartPrivilege('read')
  @Get(":id")
  findOne(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.chartService.getChartById(id);
  }

  @RequirePermissions(Permission.CHART_CREATE)
  @Post()
  @UsePipes(new ZodValidationPipe(ChartCreateSchema))
  create(@Body() dto: ChartCreate, @Req() req: { user: string }) {
    return this.chartService.createChart(dto,req.user);
  }

  @RequirePermissions(Permission.CHART_DELETE)
  @RequireChartPrivilege('canDelete')
  @Delete(":id")
  remove(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Req() req: { user: string }) {
    return this.chartService.removeChart(id,req.user);
  }

  @RequirePermissions(Permission.CHART_UPDATE)
  @RequireChartPrivilege('canEdit')
  @Patch(":id")
  async updateChart(
    @Param("id") id: string,
    @Body() body: ChartUpdate,
    @Req() req: { user: string }
  ) {
    return this.chartService.updateChart(id, body, req.user);
  }

  // ─── Sharing ────────────────────────────────────────────────────────────────

  @RequirePermissions(Permission.CHART_SHARE)
  @RequireChartPrivilege('canShare')
  @Get(":id/shares")
  getShares(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.chartService.getChartShares(id);
  }

  @RequirePermissions(Permission.CHART_SHARE)
  @RequireChartPrivilege('canShare')
  @Post(":id/share")
  @HttpCode(HttpStatus.CREATED)
  share(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(ShareWithUserSchema)) body: ShareWithUser,
    @Req() req: { user: string },
  ) {
    return this.chartService.shareChart(id, body.sharedWithUserId, req.user, {
      canEdit: body.canEdit,
      canDelete: body.canDelete,
      canShare: body.canShare,
    });
  }

  @RequirePermissions(Permission.CHART_SHARE)
  @RequireChartPrivilege('canShare')
  @Delete(":id/share/:userId")
  @HttpCode(HttpStatus.NO_CONTENT)
  unshare(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Param("userId", new ParseUUIDPipe()) userId: string,
  ) {
    return this.chartService.unshareChart(id, userId);
  }

  // ─── Group Sharing ──────────────────────────────────────────────────────────

  @RequirePermissions(Permission.CHART_SHARE)
  @RequireChartPrivilege('canShare')
  @Get(":id/group-shares")
  getGroupShares(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.chartService.getChartGroupShares(id);
  }

  @RequirePermissions(Permission.CHART_SHARE)
  @RequireChartPrivilege('canShare')
  @Post(":id/group-share")
  @HttpCode(HttpStatus.CREATED)
  shareWithGroup(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(ShareWithGroupSchema)) body: ShareWithGroup,
    @Req() req: { user: string },
  ) {
    return this.chartService.shareChartWithGroup(id, body.sharedWithGroupId, req.user, {
      canEdit: body.canEdit,
      canDelete: body.canDelete,
      canShare: body.canShare,
    });
  }

  @RequirePermissions(Permission.CHART_SHARE)
  @RequireChartPrivilege('canShare')
  @Delete(":id/group-share/:groupId")
  @HttpCode(HttpStatus.NO_CONTENT)
  unshareGroup(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Param("groupId", new ParseUUIDPipe()) groupId: string,
  ) {
    return this.chartService.unshareChartFromGroup(id, groupId);
  }
}
