import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersController } from "./user.controller";
import { UsersService } from "./user.service";
import { UserEntity } from "./entities/user.entity";
import { AuthService } from "./auth.service";
import { LocalStrategy } from "./strategies/local.strategy";
import { AuthController } from "./auth.controller";

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  controllers: [UsersController, AuthController],
  providers: [UsersService, AuthService, LocalStrategy],
  exports: [UsersService],
})
export class AuthModule {}
