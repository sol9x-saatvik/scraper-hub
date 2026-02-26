import { useEffect, useState } from "react";
import { FileText, Users, Link2, Heart } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { getDashboardStats, getPosts, type DashboardStats, type Post } from "@/services/api";
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
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [platform, setPlatform] = useState<PlatformFilter>("all");

  useEffect(() => {
    getDashboardStats(platform).then(setStats);
    getPosts({ platform }).then((posts) => setRecentPosts(posts.slice(0, 8)));
  }, [platform]);

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
        <StatsCard title="Total Posts" value={stats.totalPosts} icon={FileText} trend="+12% from last week" />
        <StatsCard title="Unique Users" value={stats.uniqueUsers} icon={Users} trend="+5% from last week" />
        <StatsCard title="Total Links" value={stats.totalLinks} icon={Link2} trend="+8% from last week" />
        <StatsCard title="Average Likes" value={stats.averageLikes} icon={Heart} trend="+3% from last week" />
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

      {/* Recent Posts Table */}
      <div className="rounded-lg border border-border bg-card">
        <div className="p-5 border-b border-border">
          <h3 className="text-sm font-medium text-card-foreground">Recent Posts</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left font-medium text-muted-foreground px-5 py-3">Platform</th>
                <th className="text-left font-medium text-muted-foreground px-5 py-3">Username</th>
                <th className="text-left font-medium text-muted-foreground px-5 py-3">Caption</th>
                <th className="text-right font-medium text-muted-foreground px-5 py-3">Likes</th>
                <th className="text-right font-medium text-muted-foreground px-5 py-3">Comments</th>
                <th className="text-left font-medium text-muted-foreground px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentPosts.map((post) => (
                <tr key={post.id} className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors">
                  <td className="px-5 py-3">
                    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", post.platform === "twitter" ? "bg-primary/15 text-primary" : "bg-accent text-accent-foreground")}>
                      {post.platform === "twitter" ? "Twitter" : "Instagram"}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-primary">{post.username}</td>
                  <td className="px-5 py-3 text-card-foreground max-w-[250px] truncate">{post.caption}</td>
                  <td className="px-5 py-3 text-right text-card-foreground">{post.likes.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right text-card-foreground">{post.comments}</td>
                  <td className="px-5 py-3 text-muted-foreground text-xs">{new Date(post.scrapedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
