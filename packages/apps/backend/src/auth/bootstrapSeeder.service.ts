// src/auth/bootstrap-seeder.service.ts
import { Permission, User, UserCreate } from "@easy-charts/easycharts-types";
import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { randomBytes } from "crypto";
import { UsersService } from "./user.service";
import { AppConfigService } from "../appConfig/appConfig.service";

@Injectable()
export class BootstrapSeederService implements OnApplicationBootstrap {
  private readonly log = new Logger(BootstrapSeederService.name);
  constructor(
    private readonly appConfigService : AppConfigService,
    private readonly usersService:UsersService
  ) {}

  async onApplicationBootstrap() {
    const users: User[] = await this.usersService.getAllUsers()
    if(users && users.length > 0) return

    const adminUsername = this.appConfigService.getConfig().defaultAdminUser.username
    const plainPassword = this.appConfigService.getConfig().defaultAdminUser.password

    const admin : User = await  this.usersService.createUser({
        username:adminUsername,
        password:plainPassword,
        displayName:adminUsername,
        isActive:true,
        permissions: Object.values(Permission),
    } as UserCreate)

    this.log.warn(
      `Created default admin "${adminUsername}". ${process.env.ADMIN_PASSWORD ? "" : `Generated password: ${plainPassword}`}`
    );
  }
}
