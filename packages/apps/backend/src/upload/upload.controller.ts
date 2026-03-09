import {
  BadRequestException,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { JwdAuthGuard } from '../auth/guards/jwtAuth.guard';

const UPLOAD_BASE = join(process.cwd(), 'public', 'uploads');
const ALLOWED_FOLDER_RE = /^[a-z0-9-]+$/; // prevent path traversal

@UseGuards(JwdAuthGuard)
@Controller('upload')
export class UploadController {
  @Post()
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, _file, cb) => {
          const folder = (req.query?.['folder'] as string) || 'general';
          if (!ALLOWED_FOLDER_RE.test(folder)) {
            return cb(new BadRequestException('Invalid folder name'), '');
          }
          const dest = join(UPLOAD_BASE, folder);
          if (!existsSync(dest)) mkdirSync(dest, { recursive: true });
          cb(null, dest);
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
  uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder = 'general',
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const safeFolder = ALLOWED_FOLDER_RE.test(folder) ? folder : 'general';
    return { url: `/uploads/${safeFolder}/${file.filename}` };
  }
}
