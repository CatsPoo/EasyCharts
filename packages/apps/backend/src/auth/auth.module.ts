import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersController } from "./user.controller";
import { UsersService } from "./user.service";
import { UserEntity } from "./entities/user.entity";
import { AuthService } from "./auth.service";
import { LocalStrategy } from "./strategies/local.strategy";
import { AuthController } from "./auth.controller";
import {JwtModule} from '@nestjs/jwt'
import { AppConfigModule } from "../appConfig/appConfig.module";
import { AppConfigService } from "../appConfig/appConfig.service";
@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    AppConfigModule,
     JwtModule.registerAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (cfg: AppConfigService) => ({
        secret: cfg.getConfig().jwt.secret,
        signOptions:{
          expiresIn:cfg.getConfig().jwt.expireIn
        }
      }),
    }),
],
  controllers: [UsersController, AuthController],
  providers: [UsersService, AuthService, LocalStrategy],
  exports: [UsersService],
})
export class AuthModule {}
