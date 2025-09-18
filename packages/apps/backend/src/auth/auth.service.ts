import { Injectable, UnauthorizedException } from "@nestjs/common";
import { UsersService } from "./user.service";
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService:UsersService
  ) {}

  async validateUser(username:string,password:string) : Promise<string>{
    const user = this.usersService.getsUerByUsername(username)
    const isPasswordsMatch : boolean = await bcrypt.compare(password,(await user).password)
    if(!isPasswordsMatch) throw new UnauthorizedException('Invalid cradentials')
    return (await user).id

  }
}