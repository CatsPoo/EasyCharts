import { PassportStrategy } from "@nestjs/passport";
import {Strategy,ExtractJwt} from 'passport-jwt'
import { AppConfigService } from "../../appConfig/appConfig.service";
import { AuthJwtPayload } from "../interfaces/jwt.interfaces";
import { Injectable } from "@nestjs/common";

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy,'refresh-jwt'){
    constructor(
      appConfigService:AppConfigService
    ){
        super({
          jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
          secretOrKey: appConfigService.getConfig().refreshJwt.secret,
          ignoreExperation:false
        });
    }

    validate(payload: AuthJwtPayload) : string {
    return payload.sub;
  }
}