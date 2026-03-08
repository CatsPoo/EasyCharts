import {
  Permission,
  type CustomElementCreate,
  CustomElementCreateSchema,
  type CustomElementUpdate,
  CustomElementUpdateSchema,
} from '@easy-charts/easycharts-types';
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
  Req,
  UseGuards,
} from '@nestjs/common';
import { ZodValidationPipe } from '../common/zodValidation.pipe';
import { QueryDto } from '../query/dto/query.dto';
import { CustomElementsService } from './customElements.service';
import { JwdAuthGuard } from '../auth/guards/jwtAuth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@UseGuards(JwdAuthGuard, PermissionsGuard)
@Controller('customElements')
export class CustomElementsController {
  constructor(private readonly customElementsService: CustomElementsService) {}

  @RequirePermissions(Permission.ASSET_CREATE)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body(new ZodValidationPipe(CustomElementCreateSchema)) payload: CustomElementCreate,
    @Req() req: { user: string },
  ) {
    return this.customElementsService.create(payload, req.user);
  }

  @RequirePermissions(Permission.ASSET_READ)
  @Get()
  list(@Query() q: QueryDto) {
    return this.customElementsService.list(q);
  }

  @RequirePermissions(Permission.ASSET_READ)
  @Get(':id')
  getById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.customElementsService.getById(id);
  }

  @RequirePermissions(Permission.ASSET_EDIT)
  @Put(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(CustomElementUpdateSchema)) payload: CustomElementUpdate,
    @Req() req: { user: string },
  ) {
    return this.customElementsService.update(id, payload, req.user);
  }

  @RequirePermissions(Permission.ASSET_DELETE)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.customElementsService.remove(id);
  }
}
