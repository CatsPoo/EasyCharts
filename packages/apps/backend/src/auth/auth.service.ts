import { AuthLoginResponse, AuthRefreshResponse } from "@easy-charts/easycharts-types";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from 'bcrypt';
import { AppConfigService } from "../appConfig/appConfig.service";
import { AuthJwtPayload } from "./interfaces/jwt.interfaces";
import { UsersService } from "./user.service";

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

  async generateTockens(userId:string) : Promise<AuthLoginResponse>{
    const payload : AuthJwtPayload = {sub:userId}
    const [tocken, refreshTocken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(
        payload,
        this.appConfigService.getConfig().refreshJwt
      ),
    ]);
    return {
      userId,
      tocken,
      refreshTocken
    }
  }

  async login(userId:string):Promise<AuthLoginResponse>{
    const {tocken,refreshTocken} : AuthLoginResponse = await this.generateTockens(userId)
    return {
      userId,
      tocken,
      refreshTocken
    }
  }

  async refreshTocken(userId:string):Promise<AuthRefreshResponse>{
    const payload : AuthJwtPayload = {sub:userId}
    const tocken : string = this.jwtService.sign(payload)
    return {userId,tocken}
  }
}