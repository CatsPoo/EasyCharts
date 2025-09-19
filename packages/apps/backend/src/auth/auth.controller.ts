import { AuthLoginResponse, AuthRefreshResponse } from "@easy-charts/easycharts-types";
import { Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LocalAuthGuard } from "./guards/localAuth.guard";
import { LoginResponse } from "./interfaces/auth.interfaces";
import { RefreshAuthGuard } from "./guards/refreshAuth.guard";

@Controller('auth')
export class AuthController{
    constructor(private readonly authService:AuthService) { 
    }

    @HttpCode(HttpStatus.OK)
    @UseGuards(LocalAuthGuard)
    @Post('login')
    async login (@Req() req: {user:string}) : Promise<AuthLoginResponse>{
        const userId:string = req.user
        return this.authService.login(userId)
    
    }

    @HttpCode(HttpStatus.OK)
    @UseGuards(RefreshAuthGuard)
    @Post('refresh')
    async refresh(@Req() req : {user:string}) : Promise<AuthRefreshResponse>{
        return this.authService.refreshTocken(req.user)
    }
}