import { Permission, type VendorCreate, VendorCreateSchema, type VendorUpdate, VendorUpdateSchema } from '@easy-charts/easycharts-types';
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
  UseGuards,
} from "@nestjs/common";
import { ZodValidationPipe } from '../common/zodValidation.pipe';
import { QueryDto } from '../query/dto/query.dto';
import { VendorsService } from "./vendors.service";
import { JwdAuthGuard } from '../auth/guards/jwtAuth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
@UseGuards(JwdAuthGuard,PermissionsGuard)
@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @RequirePermissions(Permission.ASSET_CREATE)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body(new ZodValidationPipe(VendorCreateSchema)) payload: VendorCreate) {
    return this.vendorsService.createVendor(payload);
  }

  @RequirePermissions(Permission.ASSET_READ)
  @Get()
  list(@Query() q: QueryDto) {
    return this.vendorsService.listVendors(q);
  }

  @RequirePermissions(Permission.ASSET_READ)
  @Get(':id')
  getById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.vendorsService.getVendorById(id);
  }

  @RequirePermissions(Permission.ASSET_EDIT)
  @Put(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(VendorUpdateSchema))  payload: VendorUpdate,
  ) {
    return this.vendorsService.updateVendor(id, payload);
  }

  @RequirePermissions(Permission.ASSET_DELETE)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.vendorsService.removeVendor(id);
  }
}
