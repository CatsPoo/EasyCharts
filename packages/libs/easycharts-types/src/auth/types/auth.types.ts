import z from "zod";
import { LoginPayloadSchema } from "../schemas/auth.schemas.js";
import { User } from "./user.types.js";

export interface  AuthLoginResponse {
    user:User,
    token:string
    refreshToken:string
}

export interface  AuthRefreshResponse {
    userId:string,
    token:string
}


export interface AuthTokenRenerateResponse extends AuthRefreshResponse{
    refreshToken:string
}
export type LoginPayload = z.infer<typeof LoginPayloadSchema>;