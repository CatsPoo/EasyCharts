import { Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthGuard } from "@nestjs/passport";
import { LocalAuthGuard } from "./guards/localAuth.guard";
import { AuthLoginResponse } from "@easy-charts/easycharts-types";

@Controller('auth')
export class AuthController{
    constructor(private readonly authService:AuthService) { 
    }
    @HttpCode(HttpStatus.OK)
    @UseGuards(LocalAuthGuard)
    @Post('login')
    async login (@Req() req: any) : Promise<AuthLoginResponse>{
        const userId:string = req.user
        const tocken : string = this.authService.login(userId)
        return {userId,tocken}
    
    }
}