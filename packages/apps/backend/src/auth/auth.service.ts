import {AuthRefreshResponse, AuthResponse, AuthTokens, User } from "@easy-charts/easycharts-types";
import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from 'bcrypt';
import { AppConfigService } from "../appConfig/appConfig.service";
import { AuthJwtPayload } from "./interfaces/jwt.interfaces";
import { UsersService } from "./user.service";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService:UsersService,
    private readonly appConfigService:AppConfigService,
    private readonly jwtService:JwtService
  ) {}

  async validateUser(username:string,password:string) : Promise<string>{
    const user = await this.usersService.getUserWithPasswordByUsername(username)
    const isPasswordsMatch : boolean = await bcrypt.compare(password, user.password)
    if(!isPasswordsMatch) {
      this.logger.warn(`Login failed for username "${username}": invalid password`);
      throw new UnauthorizedException('Invalid credentials')
    }
    if(!user.isActive) {
      this.logger.warn(`Login failed for username "${username}": account is inactive`);
      throw new UnauthorizedException('Invalid credentials')
    }
    return user.id
  }

  async valudateRefreshToken(userId:string,refreshToken:string) : Promise<User>{
    try{
      const userEntity = await this.usersService.getUserEntityById(userId)
      const isTokensMatch : boolean = await bcrypt.compare(refreshToken, userEntity.refreshTokenHash ?? '')
      if(!isTokensMatch) {
        this.logger.warn(`Refresh token validation failed for userId "${userId}"`);
        throw new UnauthorizedException("Invalid refresh Token");
      }
      return this.usersService.convertUserEntity(userEntity)
    }
    catch{
      throw new UnauthorizedException("Invalid refresh Token");
    }
  }

  async generateTokens(userId:string) : Promise<AuthTokens>{
    const payload : AuthJwtPayload = {sub:userId}
    const [token, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(
        payload,
        this.appConfigService.getConfig().refreshJwt
      ),
    ]);
    return {
      token,
      refreshToken
    }
  }

  async login(userId:string):Promise<AuthResponse>{
    const {token,refreshToken} : AuthTokens = await this.generateTokens(userId)
    await this.usersService.updateUserRefreshToken(userId,refreshToken)
    const user : User = await this.usersService.getUserById(userId)
    this.logger.log(`User "${user.username}" (${userId}) logged in`);
    return {
      user,
      token,
      refreshToken
    }
  }

  async refreshToken(userId:string):Promise<AuthRefreshResponse>{
    const payload : AuthJwtPayload = {sub:userId}
    const user : User = await this.usersService.getUserById(userId)
    const token : string = await this.jwtService.signAsync(payload)
    this.logger.log(`Access token refreshed for userId "${userId}"`);
    return {user,token}
  }

  async logout(userId: string):Promise<void>{
    await this.usersService.updateUserRefreshToken(userId,null);
    this.logger.log(`User "${userId}" logged out`);
  }
}
