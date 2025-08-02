export interface appConfigSchema{
    database:databaseConfig
}

export interface databaseConfig{
    username:string,
    password:string,
    host:string,
    port:number
    database_name:string
}