import type { Permission } from "@easy-charts/easycharts-types";
import type { ReactNode } from "react";
import { useAuth } from "./authProvider";

interface RequirePermissionsProps{
    required : Permission[],
    children : ReactNode
}
export function RequirePermissions({required,children} : RequirePermissionsProps){
    const {user,isAuthenticated} = useAuth()

    if(! isAuthenticated || !user) return null
    return (required.every(p=>user.permissions.includes(p))) ? children : null


}