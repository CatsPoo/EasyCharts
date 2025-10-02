import {
  type ChartCreate,
  ChartCreateSchema,
  ChartMetadata,
  type ChartUpdate,
  Permission,
} from "@easy-charts/easycharts-types";
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { ChartsService } from "./charts.service";
import { ZodValidationPipe } from "../common/zodValidation.pipe";
import { JwdAuthGuard } from "../auth/guards/jwtAuth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermissions } from "../auth/decorators/permissions.decorator";


@UseGuards(JwdAuthGuard, PermissionsGuard)
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
  @Get(":id/metadata")
  async getChartMetadata(
    @Param("id", new ParseUUIDPipe()) id: string
  ): Promise<ChartMetadata> {
    return this.chartService.getChartMetadataById(id);
  }

  @RequirePermissions(Permission.CHART_UPDATE)
  @Get(":id/lock")
  async fetchLock(@Param("id") id: string, @Req() req: { user: string }) {
    return this.chartService.fetchLock(id, req.user);
  }

  @RequirePermissions(Permission.CHART_UPDATE)
  @Patch(":id/lock")
  async lockChart(@Param("id") id: string, @Req() req: { user: string }) {
    return this.chartService.lockChart(id, req.user);
  }

  @RequirePermissions(Permission.CHART_UPDATE)
  @Patch(":id/unlock")
  async unlockChart(@Param("id") id: string, @Req() req: { user: string }) {
    return this.chartService.unlockChart(id, req.user);
  }

  @RequirePermissions(Permission.CHART_READ)
  @Get(":id")
  findOne(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.chartService.getChartById(id);
  }

  @RequirePermissions(Permission.CHART_CREATE)
  @Post()
  @UsePipes(new ZodValidationPipe(ChartCreateSchema))
  create(@Body() dto: ChartCreate, @Req() req: { user: string }) {
    return this.chartService.createChart(req.user, dto);
  }

  @RequirePermissions(Permission.CHART_DELETE)
  @Delete(":id")
  remove(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Req() req: { user: string }) {
    return this.chartService.removeChart(id,req.user);
  }

  @RequirePermissions(Permission.CHART_UPDATE)
  @Patch(":id")
  async updateChart(
    @Param("id") id: string,
    @Body() body: ChartUpdate,
    @Req() req: { user: string }
  ) {
    return this.chartService.updateChart(id, body, req.user);
  }
}
