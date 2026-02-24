import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { AppNavbar } from "./AppNavbar";

export function AppLayout() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AppNavbar />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
