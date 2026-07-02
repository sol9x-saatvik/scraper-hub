import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Settings,
  FileText,
  ShieldAlert,
  Bell,
  Briefcase,
  BarChart2,
  Users,
  Cog,
  ClipboardList,
  Globe,
  Crosshair,
  EyeOff,
  type LucideIcon,
  Monitor
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useScraperContext } from "@/context/ScraperContext";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";

const navItems: { label: string; to: string; icon: LucideIcon; iconClassName?: string }[] = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard },
  { label: "Investigate", to: "/investigate", icon: Crosshair },
  { label: "Scraper Control", to: "/scraper", icon: Settings },
  { label: "Intelligence Feed", to: "/posts", icon: FileText },
  { label: "Target Monitoring", to: "/monitoring", icon: ShieldAlert },
];

const secondaryItems: { label: string; to: string; icon: LucideIcon; iconClassName?: string }[] = [
  { label: "Alerts", to: "/alerts", icon: Bell },
  { label: "Reports", to: "/reports", icon: FileText },
  { label: "Case Management", to: "/cases", icon: Briefcase },
  { label: "Analytics & Report", to: "/analytics", icon: BarChart2 },
  { label: "Geo Intelligence", to: "/map", icon: Globe },
  { label: "Dark Web Intel", to: "/darkweb", icon: EyeOff, iconClassName: "text-purple-400" },
];

const bottomItems: { label: string; to: string; icon: LucideIcon }[] = [
  { label: "Team", to: "/team", icon: Users },
  { label: "Settings", to: "/settings", icon: Cog },
  { label: "Audit Log", to: "/audit-log", icon: ClipboardList },
];

export function AppSidebar() {
  const location = useLocation();
  const { state } = useScraperContext();

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarHeader className="h-16 flex items-center px-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex items-center justify-center shrink-0">
            <img src="/small -logo-symbol.png" alt="SOL9X Logo" className="h-full w-full object-contain" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-xs font-black tracking-tighter uppercase leading-none">SOL9X</span>
            <span className="text-[9px] text-muted-foreground font-bold tracking-[0.15em] uppercase mt-0.5">OSINT Monitor</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Primary Intelligence</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.to}
                    tooltip={item.label}
                  >
                    <RouterNavLink to={item.to} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </RouterNavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Analysis & Reporting</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryItems.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.to}
                    tooltip={item.label}
                  >
                    <RouterNavLink to={item.to} className="flex items-center gap-3">
                      <item.icon className={cn("h-4 w-4", item.iconClassName)} />
                      <span>{item.label}</span>
                    </RouterNavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {bottomItems.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.to}
                    tooltip={item.label}
                  >
                    <RouterNavLink to={item.to} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </RouterNavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border/50">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse shrink-0" />
          <span className="text-[10px] font-black uppercase tracking-widest group-data-[collapsible=icon]:hidden">
            Systems {state.isRunning ? "Active" : "Idle"}
          </span>
        </div>
        <div className="group-data-[collapsible=icon]:hidden mt-2">
          <UserAccountBanner />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

    function UserAccountBanner() {
      const userJson = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      let user = null;
      try {
        user = userJson ? JSON.parse(userJson) : null;
      } catch {
        localStorage.removeItem('user');
      }

      function logout() {
        localStorage.removeItem('user');
        window.location.href = '/login';
      }

      return (
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-foreground">{user ? user.username : 'Guest'}</div>
            <div className="text-xs text-muted-foreground">{user ? user.email : 'Not signed in'}</div>
          </div>
          <button onClick={logout} className="text-sm text-destructive hover:underline">Logout</button>
        </div>
      );
    }
