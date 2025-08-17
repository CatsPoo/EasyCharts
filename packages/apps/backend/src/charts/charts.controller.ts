import {
  type ChartCreate,
  ChartCreateSchema,
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
import { ChartsService } from "./charts.service";
import { ZodValidationPipe } from "../common/zodValidation.pipe";

@Controller("charts")
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class ChartsController {
  constructor(private readonly chartsService: ChartsService) {}

  @Get()
  findAll() {
    return this.chartsService.getAllCharts();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.chartsService.getChartById(id);
  }

  @Post()
  @UsePipes(new ZodValidationPipe(ChartCreateSchema))
  create(@Body() dto: ChartCreate) {
    return this.chartsService.createChart(dto);
  }

  // @Put(':id')
  //@UsePipes(new ZodValidationPipe(ChartUpdateSchema))
  // update(@Param('id') id: string, @Body() dto: ChartUpdate) {
  //   return this.chartsService.update(id, dto);
  // }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.chartsService.removeChart(id);
  }
}
