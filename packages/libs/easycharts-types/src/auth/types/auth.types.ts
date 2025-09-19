export type AuthLoginResponse ={
    userId:string,
    tocken:string
    refreshTocken:string
}

export type AuthRefreshResponse =Omit<AuthLoginResponse,'refreshTocken'>