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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { ZodValidationPipe } from '../common/zodValidation.pipe';
import { QueryDto } from '../query/dto/query.dto';
import { CustomElementsService } from './customElements.service';
import { JwdAuthGuard } from '../auth/guards/jwtAuth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

const uploadsDir = join(process.cwd(), 'public', 'uploads', 'custom-elements');
if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });

@UseGuards(JwdAuthGuard, PermissionsGuard)
@Controller('customElements')
export class CustomElementsController {
  constructor(private readonly service: CustomElementsService) {}

  @RequirePermissions(Permission.ASSET_CREATE)
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: uploadsDir,
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
          cb(null, `${unique}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    return { url: `/uploads/custom-elements/${file.filename}` };
  }

  @RequirePermissions(Permission.ASSET_CREATE)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body(new ZodValidationPipe(CustomElementCreateSchema)) payload: CustomElementCreate,
    @Req() req: { user: string },
  ) {
    return this.service.create(payload, req.user);
  }

  @RequirePermissions(Permission.ASSET_READ)
  @Get()
  list(@Query() q: QueryDto) {
    return this.service.list(q);
  }

  @RequirePermissions(Permission.ASSET_READ)
  @Get(':id')
  getById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.getById(id);
  }

  @RequirePermissions(Permission.ASSET_EDIT)
  @Put(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(CustomElementUpdateSchema)) payload: CustomElementUpdate,
    @Req() req: { user: string },
  ) {
    return this.service.update(id, payload, req.user);
  }

  @RequirePermissions(Permission.ASSET_DELETE)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.remove(id);
  }
}
