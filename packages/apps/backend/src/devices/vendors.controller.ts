import  { type VendorCreate, VendorCreateSchema,type  VendorUpdate, VendorUpdateSchema } from '@easy-charts/easycharts-types';
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
} from '@nestjs/common';
import { QueryDto } from '../query/dto/query.dto';
import { VendorsService } from './vendors.service';
import { ZodValidationPipe } from '../common/zodValidation.pipe';

@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(VendorCreateSchema))
  @HttpCode(HttpStatus.CREATED)
  create(@Body() payload: VendorCreate) {
    return this.vendorsService.createVendor(payload);
  }

  // GET /vendors?page=&pageSize=&search=&sortBy=&sortDir=
  @Get()
  list(@Query() q: QueryDto) {
    return this.vendorsService.listVendors(q);
  }

  @Get(':id')
  getById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.vendorsService.getVendorById(id);
  }

  @Put(':id')
  @UsePipes(new ZodValidationPipe(VendorUpdateSchema))
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() payload: VendorUpdate,
  ) {
    return this.vendorsService.updateVendor(id, payload);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.vendorsService.removeVendor(id);
  }
}
