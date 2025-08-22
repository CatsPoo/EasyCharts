import { type PortCreate, PortCreateSchema, type PortUpdate, PortUpdateSchema} from '@easy-charts/easycharts-types';
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
  Query
} from '@nestjs/common';
import { ZodValidationPipe } from '../common/zodValidation.pipe';
import { QueryDto } from '../query/dto/query.dto';
import { PortsService } from './ports.service';

@Controller('ports')
export class PortsController {
  constructor(private readonly portsService: PortsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body(new ZodValidationPipe(PortCreateSchema)) payload: PortCreate) {
    return this.portsService.createPort(payload);
  }

  // GET /vendors?page=&pageSize=&search=&sortBy=&sortDir=
  @Get()
  list(@Query() q: QueryDto) {
    return this.portsService.listPorts(q);
  }

  @Get(':id')
  getById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.portsService.getPortrById(id);
  }

  @Put(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(PortUpdateSchema))  payload: PortUpdate,
  ) {
    return this.portsService.updatePort(id, payload);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.portsService.removePort(id);
  }
}
