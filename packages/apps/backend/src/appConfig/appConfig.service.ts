import { Injectable } from '@nestjs/common';
import { appConfigSchema } from './interfaces/appConfig.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
    constructor(private readonly configService:ConfigService) {
        const configa:appConfigSchema = {
            database:{
                username: this.configService.get<string>('DB_USER',''),
                password:this.configService.get<string>('DB_PASS',''),
                host:this.configService.get<string>('DB_HOST',''),
                port:this.configService.get<number>('DB_PORT',5432),
                database_name:this.configService.get<string>('DB_NAME','')
            }
        }
        
    }
}
