import { Injectable, UnauthorizedException } from "@nestjs/common";
import { UsersService } from "./user.service";
import * as bcrypt from 'bcrypt';
import { JwtService } from "@nestjs/jwt";
import { AuthJwtPayload } from "./interfaces/jwt.interfaces";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService:UsersService,
    private readonly jwtService:JwtService
  ) {}

  async validateUser(username:string,password:string) : Promise<string>{
    const user = await this.usersService.getsUerByUsername(username)
    const isPasswordsMatch : boolean = await bcrypt.compare(password,(await user).password)
    if(!isPasswordsMatch || !user.isActive) throw new UnauthorizedException('Invalid cradentials')
    return user.id

  }

  async login(userId:string):Promise<string>{
    const payload : AuthJwtPayload = {sub:userId}
    return await this.jwtService.sign(payload)
  }
}