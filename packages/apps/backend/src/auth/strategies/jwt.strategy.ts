import { PassportStrategy } from "@nestjs/passport";
import {Strategy,ExtractJwt} from 'passport-jwt'
import { AppConfigService } from "../../appConfig/appConfig.service";
import { AuthJwtPayload, JwtValidateResponse } from "../interfaces/jwt.interfaces";

export class JwtStrategy extends PassportStrategy(Strategy){
    constructor(
        appConfigService:AppConfigService
    ){
        super({
          jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
          secretOrKey: appConfigService.getConfig().jwt.secret
        });
    }

    validate(payload: AuthJwtPayload) : string {
    return payload.sub;
  }
}