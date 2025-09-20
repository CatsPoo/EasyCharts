import { JwtSignOptions } from "@nestjs/jwt";

export interface appConfigSchema{
    database:databaseConfig,
    jwt:JwtSignOptions,
    refreshJwt : JwtSignOptions,
    redis:redisConfig,
}

export interface databaseConfig {
  username: string;
  password: string;
  host: string;
  port: number;
  database_name: string;
}

export interface redisConfig {
  username: string,
  password:string,
  host:string,
  port:number
}