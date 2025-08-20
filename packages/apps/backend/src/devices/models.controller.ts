import {
  ModelCreateSchema,
  type ModelUpdate,
  ModelUpdateSchema,
  type ModelCreate,
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
  Query,
  UsePipes,
} from "@nestjs/common";
import { ListModelsQueryDto } from "../query/dto/query.dto";
import { ModelsService } from "./model.service";
import { ZodValidationPipe } from "../common/zodValidation.pipe";
@Controller("models")
export class ModelsController {
  constructor(private readonly modelsService: ModelsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(ModelCreateSchema))
  create(@Body() payload: ModelCreate) {
    return this.modelsService.createModel(payload);
  }

  // GET /vendors?page=&pageSize=&search=&sortBy=&sortDir=
  @Get()
  list(@Query() q: ListModelsQueryDto) {
    return this.modelsService.listModels(q);
  }

  @Get(":id")
  getById(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.modelsService.getModelById(id);
  }

  @Put(":id")
  @UsePipes(new ZodValidationPipe(ModelUpdateSchema))
  update(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() payload: ModelUpdate
  ) {
    return this.modelsService.updateModel(id, payload);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.modelsService.removeModel(id);
  }
}
