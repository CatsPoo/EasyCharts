import { User } from "@easy-charts/easycharts-types";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AppConfigService } from "../../appConfig/appConfig.service";
import { AuthService } from "../auth.service";
import { AuthJwtPayload } from "../interfaces/jwt.interfaces";

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, "refresh-jwt") {
  constructor(
    appConfigService: AppConfigService,
    private readonly authService: AuthService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: appConfigService.getConfig().refreshJwt.secret,
      ignoreExperation: false,
      passRectoCallback: true,
    });
  }

  validate(req: Request, payload: AuthJwtPayload): Promise<User> {
    const refreshToken: string | undefined = req.headers
      .get("authorization")
      ?.replace("Bearer", "")
      .trim();
    if (!refreshToken) throw new UnauthorizedException();
    const userId: string = payload.sub;
    return this.authService.valudateRefreshToken(userId, refreshToken);
  }
}