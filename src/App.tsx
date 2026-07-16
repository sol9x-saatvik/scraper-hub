import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { ScraperProvider } from "@/context/ScraperContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ScraperControl from "./pages/ScraperControl";
import Posts from "./pages/Posts";
import UserMonitoring from "./pages/UserMonitoring";
import Alerts from "./pages/Alerts";
import CaseManagement from "./pages/CaseManagement";
import Team from "./pages/Team";
import AppSettings from "./pages/AppSettings";
import AuditLog from "./pages/AuditLog";
import MapView from "./pages/MapView";
import Investigate from "./pages/Investigate";
import DarkWebIntelligence from "./pages/DarkWebIntelligence";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function hasLoggedInUser(): boolean {
  try {
    const user = JSON.parse(localStorage.getItem("user") ?? "null");
    return Boolean(user?.id && user?.username);
  } catch {
    localStorage.removeItem("user");
    return false;
  }
}

function RequireAuth() {
  const location = useLocation();

  if (!hasLoggedInUser()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ScraperProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<RequireAuth />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/scraper" element={<ScraperControl />} />
                <Route path="/posts" element={<Posts />} />
                <Route path="/monitoring" element={<UserMonitoring />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/cases" element={<CaseManagement />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/team" element={<Team />} />
                <Route path="/settings" element={<AppSettings />} />
                <Route path="/audit-log" element={<AuditLog />} />
                <Route path="/map" element={<MapView />} />
                <Route path="/investigate" element={<Investigate />} />
                <Route path="/darkweb" element={<DarkWebIntelligence />} />
              </Route>
            </Route>
            <Route path="/login" element={<Login/>} />
            <Route path="/signup" element={<Signup/>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ScraperProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
