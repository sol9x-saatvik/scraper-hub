import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Settings, FileText, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useScraperContext } from "@/context/ScraperContext";

const navItems: { label: string; to: string; icon: LucideIcon }[] = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard },
  { label: "Scraper Control", to: "/scraper", icon: Settings },
  { label: "Posts Viewer", to: "/posts", icon: FileText },
];

export function AppSidebar() {
  const location = useLocation();
  const { state } = useScraperContext();

  return (
    <aside className="hidden md:flex flex-col w-60 border-r border-border bg-sidebar min-h-screen">
      <div className="p-5 border-b border-border">
        <h1 className="text-base font-semibold text-foreground tracking-tight">SM Scraper</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Management System</p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const active = location.pathname === item.to;
          return (
            <RouterNavLink
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </RouterNavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", state.isRunning ? "bg-success animate-pulse-slow" : "bg-muted-foreground")} />
          <span className="text-xs text-muted-foreground">
            {state.isRunning ? "Scraper Running" : "Scraper Idle"}
          </span>
        </div>
      </div>
    </aside>
  );
}
