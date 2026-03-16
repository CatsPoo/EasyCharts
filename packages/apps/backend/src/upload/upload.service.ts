import { BadRequestException, Injectable } from '@nestjs/common';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { diskStorage } from 'multer';

export const UPLOAD_BASE = join(process.cwd(), 'public', 'uploads');
export const ALLOWED_FOLDER_RE = /^[a-z0-9-]+$/;

export const multerOptions = {
  storage: diskStorage({
    destination: (req: any, _file: any, cb: any) => {
      const folder = (req.query?.['folder'] as string) || 'general';
      if (!ALLOWED_FOLDER_RE.test(folder)) {
        return cb(new BadRequestException('Invalid folder name'), '');
      }
      const dest = join(UPLOAD_BASE, folder);
      if (!existsSync(dest)) mkdirSync(dest, { recursive: true });
      cb(null, dest);
    },
    filename: (_req: any, file: any, cb: any) => {
      const ext = extname(file.originalname).toLowerCase();
      cb(null, `${uuidv4()}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req: any, file: any, cb: any) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new BadRequestException('Only image files are allowed'), false);
      return;
    }
    cb(null, true);
  },
};

@Injectable()
export class UploadService {
  getFileUrl(folder: string, filename: string): string {
    const safeFolder = ALLOWED_FOLDER_RE.test(folder) ? folder : 'general';
    return `/uploads/${safeFolder}/${filename}`;
  }
}
