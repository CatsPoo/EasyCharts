export interface appConfigSchema{
    database:databaseConfig,
    jwt:jwtConfig
}

export interface databaseConfig {
  username: string;
  password: string;
  host: string;
  port: number;
  database_name: string;
}

export interface jwtConfig {
  secret:string,
  expireIn:string
}