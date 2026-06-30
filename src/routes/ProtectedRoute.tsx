import { Outlet, Navigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useEffect } from "react";

interface ProtectedRouteProps {
    allowedRoles?: string[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const isTokenValid = useAuthStore((state) => state.isTokenValid);
    const logout = useAuthStore((state) => state.logout);
    const role = useAuthStore((state) => state.role);

    useEffect(() => {
        if(isAuthenticated && !isTokenValid()){
            logout();
        }
    }, [isAuthenticated, isTokenValid, logout])

    if(!isAuthenticated || !isTokenValid()){
        return <Navigate to="/login" replace/>;
    }

    if (allowedRoles && role) {
        const hasAccess = allowedRoles.some(r => r.toLowerCase() === role.toLowerCase());
        if (!hasAccess) {
            return <Navigate to="/dashboard" replace/>;
        }
    }

    return <Outlet/>

}