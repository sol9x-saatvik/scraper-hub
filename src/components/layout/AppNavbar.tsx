import { Moon, Sun, Menu } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useScraperContext } from "@/context/ScraperContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Settings, FileText } from "lucide-react";

const navItems = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard },
  { label: "Scraper Control", to: "/scraper", icon: Settings },
  { label: "Posts Viewer", to: "/posts", icon: FileText },
];

export function AppNavbar() {
  const { theme, toggleTheme } = useTheme();
  const { state } = useScraperContext();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="flex items-center justify-between h-14 px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setMobileOpen(!mobileOpen)}>
              <Menu className="h-4 w-4" />
            </Button>
            <h2 className="text-sm font-semibold text-foreground">Social Media Scraper System</h2>
          </div>

          <div className="flex items-center gap-2">
            <div className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
              state.isRunning ? "border-success/30 bg-success/10 text-success" : "border-border bg-muted text-muted-foreground"
            )}>
              <span className={cn("h-1.5 w-1.5 rounded-full", state.isRunning ? "bg-success animate-pulse-slow" : "bg-muted-foreground")} />
              {state.isRunning ? "Running" : "Idle"}
            </div>

            <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="md:hidden border-b border-border bg-card p-3 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <RouterNavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
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
        </div>
      )}
    </>
  );
}
