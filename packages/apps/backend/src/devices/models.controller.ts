import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Put,
  Post,
  Query,
} from '@nestjs/common';
import { ListModelsQueryDto, QueryDto } from '../query/dto/query.dto';
import { ModelsService } from './model.service';
import { CreateModelDto, UpdateModelDto } from './dto/model.dto';

@Controller('models')
export class ModelsController {
  constructor(private readonly modelsService: ModelsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() payload: CreateModelDto) {
    return this.modelsService.createModel(payload);
  }

  // GET /vendors?page=&pageSize=&search=&sortBy=&sortDir=
  @Get()
  list(@Query() q: ListModelsQueryDto) {
    return this.modelsService.listModels(q);
  }

  @Get(':id')
  getById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.modelsService.getModelById(id);
  }

  @Put(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() payload: UpdateModelDto,
  ) {
    return this.modelsService.updateModel(id, payload);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.modelsService.removeModel(id);
  }
}
