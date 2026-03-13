import { JwtSignOptions } from "@nestjs/jwt";

export interface appConfigSchema{
    database:databaseConfig,
    jwt:JwtSignOptions,
    refreshJwt : JwtSignOptions,
    redis:redisConfig,
    defaultAdminUser:DefaultAdminUserConfig,
    chartLock:ChartLockConfig
}

export interface ChartLockConfig {
  /** Minutes of inactivity before a lock is auto-released */
  expiryMinutes: number;
  /** How often (in seconds) the expiry check runs */
  checkIntervalSeconds: number;
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

export interface DefaultAdminUserConfig{
  username:string,
  password:string
}