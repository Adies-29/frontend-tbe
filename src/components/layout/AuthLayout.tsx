import { Outlet } from "react-router-dom";

export default function AuthLayout(){
    return(
        <div className='flex flex-col md:flex-row min-h-screen items-center w-full'>
            <div className="flex items-center justify-center flex-1 p-6">
                <div className="w-full max-w-200px">
                    <Outlet/>
                </div>
            </div>
       
        </div>

    );
}