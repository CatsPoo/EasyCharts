import z from "zod";
import { LoginPayloadSchema } from "../schemas/auth.schemas.js";

export type AuthLoginResponse ={
    userId:string,
    tocken:string
    refreshTocken:string
}

export type AuthRefreshResponse =Omit<AuthLoginResponse,'refreshTocken'>
export type LoginPayload = z.infer<typeof LoginPayloadSchema>;