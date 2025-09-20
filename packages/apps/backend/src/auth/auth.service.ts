import { AuthLoginResponse, AuthRefreshResponse, User } from "@easy-charts/easycharts-types";
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
    const user = await this.usersService.getsUerWithPasswordByUsername(username)
    const isPasswordsMatch : boolean = await bcrypt.compare(password,await user.password)
    if(!isPasswordsMatch || !user.isActive) throw new UnauthorizedException('Invalid cradentials')
    return user.id

  }

  async valudateRefreshToken(userId:string,refreshToken:string) : Promise<user>{
    try{
      const user : User = await this.usersService.getUserById(userId)
      const isTokensMatch : boolean = await bcrypt.compare(refreshToken,await user.refreshTokenHash)
      if(!isTokensMatch) throw new UnauthorizedException("Invalid refresh Token");
      return user
    }
    catch{
      throw new UnauthorizedException("Invalid refresh Token");
    }

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
    await this.usersService.updateUserRefreshToken(userId,refreshTocken)
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

  async logout(userId: string):Promise<void>{
    this.usersService.updateUserRefreshToken(userId,null);
  }
}