import { lazy, Suspense, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Users, Link2, Heart, Globe, MapPin, Loader2, EyeOff } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { getDashboardStats, getDarkWebStats, type DashboardStats, type DarkWebStats } from "@/services/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapErrorBoundary } from "@/components/map/MapErrorBoundary";
import { useGeoAnalysis } from "@/hooks/useGeoAnalysis";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";

const IntelligenceMap = lazy(() =>
  import("@/components/map/IntelligenceMap").then((m) => ({ default: m.IntelligenceMap }))
);

const CHART_COLORS = [
  "hsl(215, 90%, 56%)",
  "hsl(142, 71%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(280, 65%, 60%)",
  "hsl(350, 80%, 55%)",
  "hsl(185, 78%, 48%)",
  "hsl(25, 90%, 55%)",
  "hsl(320, 65%, 58%)",
  "hsl(95, 60%, 45%)",
  "hsl(55, 85%, 52%)",
];

const TOOLTIP_STYLE = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "var(--radius)",
  fontSize: 12,
};

const TOOLTIP_LABEL_STYLE = { color: "hsl(var(--muted-foreground))" };
const TOOLTIP_ITEM_STYLE  = { color: "hsl(var(--foreground))" };
const TICK_STYLE = { fontSize: 12, fill: "hsl(var(--muted-foreground))" };
const GRID_COLOR = "hsl(var(--border))";

type PlatformFilter = "all" | "twitter" | "instagram";

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [darkwebStats, setDarkwebStats] = useState<DarkWebStats | null>(null);
  const [platform, setPlatform] = useState<PlatformFilter>("all");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { analyzeLast30Posts, progress, isRunning } = useGeoAnalysis();

  useEffect(() => {
    setError(null);
    getDashboardStats(platform)
      .then(setStats)
      .catch(() => {
        setError("Failed to load dashboard stats. Make sure the backend is running.");
        setStats(null);
      });
  }, [platform]);

  useEffect(() => {
    getDarkWebStats().then(setDarkwebStats).catch(() => {});
  }, []);

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-80 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Analytics overview of scraped data</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={platform} onValueChange={(v) => setPlatform(v as PlatformFilter)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Select Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="twitter">Twitter</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Posts" value={stats.totalPosts} icon={FileText} />
        <StatsCard title="Unique Users" value={stats.uniqueUsers} icon={Users} />
        <StatsCard title="Posts with Links" value={stats.totalLinks} icon={Link2} />
        <StatsCard title="Average Likes" value={stats.averageLikes} icon={Heart} />
      </div>

      {/* Charts — 2×2 grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Posts Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Posts Over Time</CardTitle>
            <CardDescription>Frequency of posts collected daily</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.postsOverTime.length === 0 ? (
              <div className="flex items-center justify-center h-[240px] text-muted-foreground text-sm">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={stats.postsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
                  <XAxis dataKey="date" tick={TICK_STYLE} axisLine={false} tickLine={false} />
                  <YAxis tick={TICK_STYLE} allowDecimals={false} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE} />
                  <Line type="monotone" dataKey="posts" stroke={CHART_COLORS[0]} strokeWidth={2} dot={{ r: 4, fill: CHART_COLORS[0], strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Likes Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Likes Distribution</CardTitle>
            <CardDescription>Breakdown of posts by engagement</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.likesDistribution.every((b: any) => b.count === 0) ? (
              <div className="flex items-center justify-center h-[240px] text-muted-foreground text-sm">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={stats.likesDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
                  <XAxis dataKey="range" tick={TICK_STYLE} axisLine={false} tickLine={false} />
                  <YAxis tick={TICK_STYLE} allowDecimals={false} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE} />
                  <Bar dataKey="count" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Users */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Top Users</CardTitle>
            <CardDescription>Most active accounts being monitored</CardDescription>
          </CardHeader>
          <CardContent>
            {(stats.topUsers ?? []).length === 0 ? (
              <div className="flex items-center justify-center h-[240px] text-muted-foreground text-sm">No data yet</div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-8">
                <div className="w-full max-w-[200px] shrink-0">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={stats.topUsers}
                        dataKey="posts"
                        nameKey="name"
                        cx="50%" cy="50%"
                        outerRadius={80} innerRadius={55}
                        strokeWidth={0}
                        paddingAngle={4}
                      >
                        {stats.topUsers.map((_: any, i: number) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-3 w-full">
                  {stats.topUsers.slice(0, 5).map((user: any, i: number) => (
                    <div key={user.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                        />
                        <span className="font-medium truncate">{user.name}</span>
                      </div>
                      <span className="text-muted-foreground ml-2 shrink-0">{user.posts} posts</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Source Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Source Breakdown</CardTitle>
            <CardDescription>Data distribution across platforms</CardDescription>
          </CardHeader>
          <CardContent>
            {(stats.sourceBreakdown ?? []).every((s: any) => s.count === 0) ? (
              <div className="flex items-center justify-center h-[240px] text-muted-foreground text-sm">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={stats.sourceBreakdown ?? []} layout="vertical" margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} horizontal={false} />
                  <XAxis type="number" tick={TICK_STYLE} allowDecimals={false} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="source" tick={TICK_STYLE} width={80} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={32}>
                    {(stats.sourceBreakdown ?? []).map((_: any, i: number) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dark Web Intelligence */}
      <Card className="border-purple-500/20 bg-gradient-to-r from-purple-950/10 to-transparent">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3 px-5">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <EyeOff className="h-4 w-4 text-purple-400" />
            Dark Web Intelligence
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/darkweb")}
            className="h-7 text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-950/20"
          >
            View Intelligence →
          </Button>
        </CardHeader>
        <CardContent className="px-5 pb-4">
          {darkwebStats && (darkwebStats.totalInvestigations > 0) ? (
            <div className="flex flex-wrap gap-8">
              <div>
                <div className="text-2xl font-bold text-purple-300">
                  {darkwebStats.totalInvestigations}
                </div>
                <div className="text-xs text-muted-foreground">Investigations</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-300">
                  {darkwebStats.totalSources}
                </div>
                <div className="text-xs text-muted-foreground">Sources Scraped</div>
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate max-w-xs">
                  {darkwebStats.latestQuery || "—"}
                </div>
                <div className="text-xs text-muted-foreground">Latest Query</div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              No dark web investigations ingested yet — visit the page to sync from Robin.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Geographic Intelligence Map */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 flex-wrap gap-4">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              Geographic Intelligence
            </CardTitle>
            <CardDescription>Spatial distribution of analyzed posts</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={analyzeLast30Posts}
              disabled={isRunning}
              className="h-8 gap-1.5"
            >
              {isRunning ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <MapPin className="h-3 w-3" />
              )}
              {isRunning
                ? `Tagging... (${progress.current}/${progress.total})`
                : "Analyze Last 30 Posts"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/map")}
              className="h-8"
            >
              View Full Map
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <MapErrorBoundary>
            <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
              <IntelligenceMap height="500px" />
            </Suspense>
          </MapErrorBoundary>
        </CardContent>
      </Card>
    </div>
  );
}
