import { Outlet } from "react-router-dom";

export default function AuthLayout(){
    return(
        <div className='flex flex-col md:flex-row min-h-screen items-center w-full'>
            
            {/* kiri */}
            <div className="bg-gray-100 flex flex-col items-center justify-center p-8 md:p-0 md:w-1/2 md:h-screen">
                <img
                    src=""
                    alt="logo/nama team"
                    className='w-48 sm:w-64 md:w-96 object-contain'
                />

            </div>

            {/* kanan */}
            <div className="flex items-center justify-center flex-1 p-6">
                <div className="w-full max-w-md">
                    <Outlet/>
                </div>
            </div>
       
        </div>

    );
}