import { Outlet } from "react-router-dom";
import { Footer } from "./Footer";

export function CustomerLayout() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F4F7F6] dark:bg-[#0B1513] transition-colors duration-300">
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}
