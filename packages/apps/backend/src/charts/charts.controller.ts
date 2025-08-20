import { type ChartCreate, ChartCreateSchema, ChartMetadata } from "@easy-charts/easycharts-types";
import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, UsePipes, ValidationPipe } from "@nestjs/common";
import { ChartsService } from "./charts.service";
import { ZodValidationPipe } from "../common/zodValidation.pipe";

@Controller("charts")
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class ChartsController {
  constructor(private readonly chartService: ChartsService) {}

  @Get()
  findAll() {
    return this.chartService.getAllCharts();
  }

  @Get("metadata")
  async getAllChartMetadata(): Promise<ChartMetadata[]> {
    return this.chartService.getAllChartsMetadata();
  }

  @Get(":id/metadata")
  async getChartMetadata(@Param("id", new ParseUUIDPipe()) id: string): Promise<ChartMetadata> {
    return this.chartService.getChartMetadataById(id);
  }

  @Get(":id")
  findOne(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.chartService.getChartById(id);
  }

  @Post()
  @UsePipes(new ZodValidationPipe(ChartCreateSchema))
  create(@Body() dto: ChartCreate) {
    return this.chartService.createChart(dto);
  }

  @Delete(":id")
  remove(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.chartService.removeChart(id);
  }
}
