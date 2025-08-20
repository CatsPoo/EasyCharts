import {
  type ChartCreate,
  ChartCreateSchema,
  ChartMetadata,
  type ChartUpdate,
  ChartUpdateSchema,
} from "@easy-charts/easycharts-types";
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { chartService } from "./charts.service";
import { ZodValidationPipe } from "../common/zodValidation.pipe";

@Controller("charts")
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class ChartsController {
  constructor(private readonly chartService: chartService) {}

  @Get()
  findAll() {
    return this.chartService.getAllCharts();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.chartService.getChartById(id);
  }

  @Post()
  @UsePipes(new ZodValidationPipe(ChartCreateSchema))
  create(@Body() dto: ChartCreate) {
    return this.chartService.createChart(dto);
  }

  // @Put(':id')
  //@UsePipes(new ZodValidationPipe(ChartUpdateSchema))
  // update(@Param('id') id: string, @Body() dto: ChartUpdate) {
  //   return this.chartService.update(id, dto);
  // }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.chartService.removeChart(id);
  }

  @Get(":id/metadata")
  async getChartMetadata(@Param("id") id: string): Promise<ChartMetadata> {
    return this.chartService.getChartMetadataById(id);
  }

  @Get("metadata")
  async getAllChartMetadata(): Promise<ChartMetadata[]> {
    return this.chartService.getAllChartMetadata();
  }
}
