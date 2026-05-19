import { Moon, Sun, Search, Bell, Activity } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useScraperContext } from "@/context/ScraperContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export function AppNavbar() {
  const { theme, toggleTheme } = useTheme();
  const { state } = useScraperContext();

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        <div className="flex items-center gap-4 flex-1">
          <SidebarTrigger className="h-9 w-9" />
          <div className="hidden md:flex items-center gap-2 flex-1 max-w-xl">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
              <Input 
                placeholder="Global Intelligence Search..." 
                className="pl-9 bg-accent/10 border-none h-9 focus-visible:ring-1 focus-visible:ring-primary/40 w-full text-xs"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="h-6 gap-1 px-2 border-border/50 bg-accent/30 text-[9px] font-black uppercase tracking-widest text-foreground/80">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-pulse" />
            Standby
          </Badge>
          <div className="flex items-center gap-1 border-l border-border/50 pl-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              <Bell className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8 rounded-full">
              {theme === "dark" ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5" />}
            </Button>
            <div className="h-7 w-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-[10px] ml-1">
              SM
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
