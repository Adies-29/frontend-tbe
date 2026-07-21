import { Outlet } from "react-router-dom";

export default function AuthLayout() {
    return (
        <div className="w-full h-screen overflow-hidden flex items-center justify-center">
            <Outlet />
        </div>
    );
}