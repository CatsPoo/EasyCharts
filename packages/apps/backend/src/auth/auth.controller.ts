import {AuthRefreshResponse, AuthResponse, LoginPayloadSchema } from "@easy-charts/easycharts-types";
import { Controller, HttpCode, HttpStatus, Post, Req, UseGuards, UsePipes } from "@nestjs/common";
import { ZodValidationPipe } from "../common/zodValidation.pipe";
import { AuthService } from "./auth.service";
import { JwdAuthGuard } from "./guards/jwtAuth.guard";
import { LocalAuthGuard } from "./guards/localAuth.guard";
import { RefreshAuthGuard } from "./guards/refreshAuth.guard";

@Controller('auth')
export class AuthController{
    constructor(private readonly authService:AuthService) { 
    }

    @HttpCode(HttpStatus.OK)
    @UsePipes(new ZodValidationPipe(LoginPayloadSchema))
    @UseGuards(LocalAuthGuard)
    @Post('login')
    async login (@Req() req: {user:string}) : Promise<AuthResponse>{
        const userId: string = req.user;
        return this.authService.login(userId)
    
    }

    @HttpCode(HttpStatus.OK)
    @UseGuards(RefreshAuthGuard)
    @Post('refresh')
    async refresh(@Req() req : {user:string}) : Promise<AuthRefreshResponse>{
        return this.authService.refreshToken(req.user)
    }

    @HttpCode(HttpStatus.OK)
    @UseGuards(JwdAuthGuard)
    @Post('logout')
    async logout(@Req() req : {user:string}) : Promise<void>{
        this.authService.logout(req.user)
    }
        
}