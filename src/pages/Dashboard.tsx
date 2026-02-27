import { useEffect, useState } from "react";
import { FileText, Users, Link2, Heart } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { getDashboardStats, type DashboardStats } from "@/services/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CHART_COLORS = [
  "hsl(215, 90%, 56%)",
  "hsl(142, 71%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(280, 65%, 60%)",
  "hsl(350, 80%, 55%)",
];

type PlatformFilter = "all" | "twitter" | "instagram";

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [platform, setPlatform] = useState<PlatformFilter>("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    getDashboardStats(platform)
      .then(setStats)
      .catch(() => {
        setError("Failed to load dashboard stats. Make sure the backend is running.");
        setStats(null);
      });
  }, [platform]);

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground text-sm">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Analytics overview of scraped data</p>
        </div>
        <Select value={platform} onValueChange={(v) => setPlatform(v as PlatformFilter)}>
          <SelectTrigger className="w-[160px] bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            <SelectItem value="twitter">Twitter</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Posts" value={stats.totalPosts} icon={FileText} />
        <StatsCard title="Unique Users" value={stats.uniqueUsers} icon={Users} />
        <StatsCard title="Total Links" value={stats.totalLinks} icon={Link2} />
        <StatsCard title="Average Likes" value={stats.averageLikes} icon={Heart} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-medium text-card-foreground mb-4">Posts Over Time</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={stats.postsOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 20%)" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: "hsl(220, 10%, 54%)" }} />
              <YAxis tick={{ fontSize: 12, fill: "hsl(220, 10%, 54%)" }} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(222, 16%, 10%)", border: "1px solid hsl(220, 14%, 16%)", borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="posts" stroke={CHART_COLORS[0]} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-medium text-card-foreground mb-4">Likes Distribution</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stats.likesDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 20%)" />
              <XAxis dataKey="range" tick={{ fontSize: 12, fill: "hsl(220, 10%, 54%)" }} />
              <YAxis tick={{ fontSize: 12, fill: "hsl(220, 10%, 54%)" }} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(222, 16%, 10%)", border: "1px solid hsl(220, 14%, 16%)", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 lg:col-span-2">
          <h3 className="text-sm font-medium text-card-foreground mb-4">Top Users</h3>
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <div className="w-full max-w-[280px]">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={stats.topUsers} dataKey="posts" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} strokeWidth={0}>
                    {stats.topUsers.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "hsl(222, 16%, 10%)", border: "1px solid hsl(220, 14%, 16%)", borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {stats.topUsers.map((user, i) => (
                <div key={user.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: CHART_COLORS[i] }} />
                    <span className="text-card-foreground font-mono text-xs">{user.name}</span>
                  </div>
                  <span className="text-muted-foreground">{user.posts} posts</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
