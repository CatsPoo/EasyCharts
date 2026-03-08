import {
  Permission,
  type CustomElementCreate,
  CustomElementCreateSchema,
  type CustomElementUpdate,
  CustomElementUpdateSchema,
} from '@easy-charts/easycharts-types';
import {
  BadRequestException,
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
import { v4 as uuidv4 } from 'uuid';
import { ZodValidationPipe } from '../common/zodValidation.pipe';
import { QueryDto } from '../query/dto/query.dto';
import { CustomElementsService } from './customElements.service';
import { JwdAuthGuard } from '../auth/guards/jwtAuth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'custom-elements');

function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

@UseGuards(JwdAuthGuard, PermissionsGuard)
@Controller('customElements')
export class CustomElementsController {
  constructor(private readonly customElementsService: CustomElementsService) {}

  @RequirePermissions(Permission.ASSET_CREATE)
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          ensureUploadDir();
          cb(null, UPLOAD_DIR);
        },
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname).toLowerCase();
          cb(null, `${uuidv4()}${ext}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          cb(new BadRequestException('Only image files are allowed'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  @HttpCode(HttpStatus.OK)
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    const url = `/uploads/custom-elements/${file.filename}`;
    return { url };
  }

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
