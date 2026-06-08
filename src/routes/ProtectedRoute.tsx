import { Outlet, Navigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useEffect } from "react";

export default function ProtectedRoute() {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const isTokenValid = useAuthStore((state) => state.isTokenValid);
    const logout = useAuthStore((state) => state.logout);

    useEffect(() => {
        if(isAuthenticated && !isTokenValid()){
            logout();
        }
    }, [isAuthenticated, isTokenValid, logout])

    if(!isAuthenticated || !isTokenValid()){
        return <Navigate to="/login" replace/>;
    }

    return <Outlet/>

}