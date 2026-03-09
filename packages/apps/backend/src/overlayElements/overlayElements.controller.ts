import {
  Permission,
  type OverlayElementCreate,
  OverlayElementCreateSchema,
  type OverlayElementUpdate,
  OverlayElementUpdateSchema,
  type OverlayElementType,
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
import { OverlayElementsService } from './overlayElements.service';
import { JwdAuthGuard } from '../auth/guards/jwtAuth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@UseGuards(JwdAuthGuard, PermissionsGuard)
@Controller('overlayElements')
export class OverlayElementsController {
  constructor(private readonly overlayElementsService: OverlayElementsService) {}

  @RequirePermissions(Permission.ASSET_CREATE)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body(new ZodValidationPipe(OverlayElementCreateSchema)) payload: OverlayElementCreate,
    @Req() req: { user: string },
  ) {
    return this.overlayElementsService.create(payload, req.user);
  }

  @RequirePermissions(Permission.ASSET_READ)
  @Get()
  list(@Query() q: QueryDto & { type?: OverlayElementType }) {
    return this.overlayElementsService.list(q);
  }

  @RequirePermissions(Permission.ASSET_READ)
  @Get(':id')
  getById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.overlayElementsService.getById(id);
  }

  @RequirePermissions(Permission.ASSET_EDIT)
  @Put(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(OverlayElementUpdateSchema)) payload: OverlayElementUpdate,
    @Req() req: { user: string },
  ) {
    return this.overlayElementsService.update(id, payload, req.user);
  }

  @RequirePermissions(Permission.ASSET_DELETE)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.overlayElementsService.remove(id);
  }
}
