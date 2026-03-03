import { type Chart, type ChartVersion, type ChartVersionMeta, Permission } from "@easy-charts/easycharts-types";
import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { JwdAuthGuard } from "../auth/guards/jwtAuth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermissions } from "../auth/decorators/permissions.decorator";
import { ChartsService } from "./charts.service";
import { ChartVersionsService } from "./chartVersions.service";
import { ChartShareGuard } from "./guards/chartShare.guard";
import { RequireChartPrivilege } from "./decorators/requireChartPrivilege.decorator";

@UseGuards(JwdAuthGuard, PermissionsGuard, ChartShareGuard)
@Controller("charts")
export class ChartVersionsController {
  constructor(
    private readonly chartVersionsService: ChartVersionsService,
    private readonly chartsService: ChartsService,
  ) {}

  @RequirePermissions(Permission.CHART_READ)
  @RequireChartPrivilege('read')
  @Get(":chartId/versions")
  listVersions(
    @Param("chartId", new ParseUUIDPipe()) chartId: string,
  ): Promise<ChartVersionMeta[]> {
    return this.chartVersionsService.listVersions(chartId);
  }

  @RequirePermissions(Permission.CHART_READ)
  @RequireChartPrivilege('read')
  @Get(":chartId/versions/:versionId")
  getVersion(
    @Param("chartId", new ParseUUIDPipe()) chartId: string,
    @Param("versionId", new ParseUUIDPipe()) versionId: string,
  ): Promise<ChartVersion> {
    return this.chartVersionsService.getVersion(chartId, versionId);
  }

  @RequirePermissions(Permission.CHART_UPDATE)
  @RequireChartPrivilege('canEdit')
  @Post(":chartId/versions/:versionId/rollback")
  @HttpCode(HttpStatus.OK)
  async rollback(
    @Param("chartId", new ParseUUIDPipe()) chartId: string,
    @Param("versionId", new ParseUUIDPipe()) versionId: string,
    @Req() req: { user: string },
  ): Promise<Chart> {
    const version = await this.chartVersionsService.getVersion(chartId, versionId);
    const snap = version.snapshot as Chart;

    // When rolling back, any field not present in the old snapshot (added later)
    // is explicitly set to its empty default so it gets cleared rather than left as-is.
    return this.chartsService.updateChart(
      chartId,
      {
        name: snap.name,
        description: snap.description,
        devicesOnChart: snap.devicesOnChart ?? [],
        linesOnChart: snap.linesOnChart ?? [],
        bondsOnChart: snap.bondsOnChart ?? [],
        notesOnChart: snap.notesOnChart ?? [],
        zonesOnChart: snap.zonesOnChart ?? [],
        cloudsOnChart: snap.cloudsOnChart ?? [],
        versionLabel: `Rollback to v${version.versionNumber}`,
      },
      req.user,
    );
  }
}
