import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { FilesService } from "./files.service";
import { FilesController } from "./files.controller";
@Module({
  imports: [
    // MulterModule.registerAsync({
    //   useFactory: () => ({
    //     storage: diskStorage({
    //       destination: "./uploads",
    //       filename: (req, file, cb) => {
    //         const filename = `${Date.now()}-${file.originalname}`;
    //         cb(null, filename);
    //       },
    //     }),
    //   }),
    // }),
    MulterModule.register({
      dest: "./uploads",
    }),
  ],
  controllers: [FilesController],
  providers: [FilesService],
})
export class FilesModule {}
