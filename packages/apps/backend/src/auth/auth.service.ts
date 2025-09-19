import { Injectable, UnauthorizedException } from "@nestjs/common";
import { UsersService } from "./user.service";
import * as bcrypt from 'bcrypt';
import { JwtService, JwtSignOptions } from "@nestjs/jwt";
import { AuthJwtPayload } from "./interfaces/jwt.interfaces";
import { AppConfigService } from "../appConfig/appConfig.service";
import { LoginResponse } from "./interfaces/auth.interfaces";
import { AuthLoginResponse, AuthRefreshResponse } from "@easy-charts/easycharts-types";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService:UsersService,
    private readonly appConfigService:AppConfigService,
    private readonly jwtService:JwtService
  ) {}

  async validateUser(username:string,password:string) : Promise<string>{
    const user = await this.usersService.getsUerByUsername(username)
    const isPasswordsMatch : boolean = await bcrypt.compare(password,(await user).password)
    if(!isPasswordsMatch || !user.isActive) throw new UnauthorizedException('Invalid cradentials')
    return user.id

  }

  async login(userId:string):Promise<AuthLoginResponse>{
    const payload : AuthJwtPayload = {sub:userId}
    const tocken : string = this.jwtService.sign(payload)
    const refreshTocken : string = this.jwtService.sign(payload,this.appConfigService.getConfig().refreshJwt)
    return {userId,tocken,refreshTocken}
  }

  async refreshTocken(userId:string):Promise<AuthRefreshResponse>{
    const payload : AuthJwtPayload = {sub:userId}
    const tocken : string = this.jwtService.sign(payload)
    return {userId,tocken}
  }
}