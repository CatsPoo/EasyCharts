import { PassportStrategy } from "@nestjs/passport";
import { Strategy, ExtractJwt, StrategyOptions } from "passport-jwt";
import { AppConfigService } from "../../appConfig/appConfig.service";
import { AuthJwtPayload } from "../interfaces/jwt.interfaces";
import { Injectable } from "@nestjs/common";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(appConfigService: AppConfigService) {
    const strategyOptions: StrategyOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: appConfigService.getConfig().jwt.secret,
      ignoreExpiration: false,
    };
    super(strategyOptions);
  }

  validate(payload: AuthJwtPayload): string {
    return payload.sub;
  }
}
