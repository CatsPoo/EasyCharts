export interface AuthJwtPayload{
    sub: string
}

export interface JwtValidateResponse {
  userId: string;
  username: string;
}