import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { CreateVendorDto, UpdateVendorDto } from '@easy-charts/easycharts-types';
import { QueryDto } from '@easy-charts/easycharts-types';

@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() payload: CreateVendorDto) {
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

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() payload: UpdateVendorDto,
  ) {
    return this.vendorsService.updateVendor(id, payload);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.vendorsService.removeVendor(id);
  }
}
