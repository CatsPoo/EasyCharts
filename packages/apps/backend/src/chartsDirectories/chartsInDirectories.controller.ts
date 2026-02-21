// apps/api/src/directories/charts-in-directories.controller.ts
import { Permission } from "@easy-charts/easycharts-types";
import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { RequirePermissions } from "../auth/decorators/permissions.decorator"
import { JwdAuthGuard } from "../auth/guards/jwtAuth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { ChartsDirectoriesService } from "./chartsDirectories.service";

@UseGuards(JwdAuthGuard, PermissionsGuard)
@Controller("chartsDirectories/:directoryId/charts")
export class ChartsInDirectoriesController {
  constructor(
    private readonly chartsDirsService: ChartsDirectoriesService
  ) {}

  // ---------- READ ----------
  /** Full membership rows */
  @RequirePermissions(Permission.CHART_READ)
  @Get()
  listCharts(
    @Param("directoryId", new ParseUUIDPipe()) directoryId: string
  ) {
    return this.chartsDirsService.listCharts(directoryId);
  }

  /** Lightweight list of just chart IDs */
  @RequirePermissions(Permission.CHART_READ)
  @Get("ids")
  listChartIds(
    @Param("directoryId", new ParseUUIDPipe()) directoryId: string
  ) {
    return this.chartsDirsService.listChartIds(directoryId);
  }

  /** Chart metadata for charts in the directory that the user can access */
  @RequirePermissions(Permission.CHART_READ)
  @Get("metadata")
  listChartsMetadata(
    @Param("directoryId", new ParseUUIDPipe()) directoryId: string,
    @Req() req: { user: string },
  ) {
    return this.chartsDirsService.listChartsMetadata(directoryId, req.user);
  }

  // ---------- WRITE ----------
  /** Add/Upsert a chart into the directory */
  @RequirePermissions(Permission.CHART_UPDATE)
  @Post(":chartId")
  @HttpCode(HttpStatus.CREATED)
  async addChart(
    @Param("directoryId", new ParseUUIDPipe()) directoryId: string,
    @Param("chartId", new ParseUUIDPipe()) chartId: string,
    @Req() req: { user: string }
  ) {
    await this.chartsDirsService.addChart(directoryId, chartId, req.user);
    return { directoryId, chartId, addedByUserId: req.user };
  }

  /** Remove a chart from the directory */
  @RequirePermissions(Permission.CHART_UPDATE)
  @Delete(":chartId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeChart(
    @Param("directoryId", new ParseUUIDPipe()) directoryId: string,
    @Param("chartId", new ParseUUIDPipe()) chartId: string
  ) {
    await this.chartsDirsService.removeChart(directoryId, chartId);
  }
}
