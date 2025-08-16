import { type CreateChartDto,type  UpdateChartDto } from '@easy-charts/easycharts-types';
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
} from '@nestjs/common';
import { ChartsService } from './charts.service';

@Controller('charts')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class ChartsController {
  constructor(private readonly chartsService: ChartsService) {}

  @Get()
  findAll() {
    return this.chartsService.getAllCharts();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.chartsService.getChartById(id);
  }

  @Post()
  create(@Body() dto: CreateChartDto) {
    return this.chartsService.createChart(dto);
  }

  // @Put(':id')
  // update(@Param('id') id: string, @Body() dto: UpdateChartDto) {
  //   return this.chartsService.update(id, dto);
  // }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.chartsService.removeChart(id);
  }
}