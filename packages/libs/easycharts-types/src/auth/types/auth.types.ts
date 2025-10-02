import z from "zod";
import { LoginPayloadSchema } from "../schemas/auth.schemas.js";
import { User } from "./user.types.js";


export interface AuthTokens {
    token:string
    refreshToken:string
}
export interface  AuthResponse extends AuthTokens{
    user:User,
    
}

export interface  AuthRefreshResponse {
    user:User,
    token:string
}

export type LoginPayload = z.infer<typeof LoginPayloadSchema>;