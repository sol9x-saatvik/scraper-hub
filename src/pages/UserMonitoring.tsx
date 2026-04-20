import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldAlert, Users, AlertTriangle, CheckCircle, Star,
  Trash2, Search, PlusCircle, Eye, Play, Clock, RotateCcw,
  Bookmark, BookmarkX, Flag,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useMonitoredUsers } from "@/hooks/useMonitoredUsers";
import { useQuery } from "@tanstack/react-query";
import { getAllPosts } from "@/services/api";
import type { MonitoredUser } from "@/services/api";

const API_BASE = "http://localhost:8081/api";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Strip any leading @ signs from a username */
function cleanUsername(username: string): string {
  return username.replace(/^@+/, "");
}

// ── FlaggedPost types + localStorage ─────────────────────────────────────────

export interface FlaggedPost {
  id: string;
  platform: "Instagram" | "Twitter";
  user: string;
  content: string;
  url?: string;
  date?: string;
  time?: string;
  source?: string;
  flaggedAt: string;
}

function loadFlaggedPosts(): FlaggedPost[] {
  try { return JSON.parse(localStorage.getItem("flaggedPosts") ?? "[]"); } catch { return []; }
}

function saveFlaggedPosts(posts: FlaggedPost[]): void {
  localStorage.setItem("flaggedPosts", JSON.stringify(posts));
}

// ── Seed data seeded once if DB is empty ──────────────────────────────────────
const SEED_USERS: Omit<MonitoredUser, "id" | "addedAt">[] = [
  { username: "shadow_tracker99", platform: "Instagram", status: "Suspected", addedFrom: "Manual", harmfulRating: 4, notes: "Posted suspicious content multiple times" },
  { username: "darkweb_news", platform: "Twitter", status: "Tracked", addedFrom: "ScraperProfile", harmfulRating: 5, notes: "Known extremist account" },
  { username: "anon_reporter", platform: "Instagram", status: "Cleared", addedFrom: "PostFlag", harmfulRating: 1, notes: "False positive, cleared after review" },
  { username: "cryptoking_x", platform: "Twitter", status: "Suspected", addedFrom: "PostFlag", harmfulRating: 3, notes: "Promotes illegal financial schemes" },
  { username: "viral.content.hub", platform: "Instagram", status: "Tracked", addedFrom: "Manual", harmfulRating: 2, notes: "Spreading misinformation" },
];

// ── Star Rating ───────────────────────────────────────────────────────────────
function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          className={cn("transition-colors", onChange ? "cursor-pointer" : "cursor-default pointer-events-none")}
          onMouseEnter={() => onChange && setHovered(i)}
          onMouseLeave={() => onChange && setHovered(0)}
          onClick={() => onChange?.(i)}
        >
          <Star
            className="h-4 w-4"
            fill={(hovered || value) >= i ? "hsl(38,92%,50%)" : "transparent"}
            stroke={(hovered || value) >= i ? "hsl(38,92%,50%)" : "hsl(220,10%,40%)"}
          />
        </button>
      ))}
    </div>
  );
}

// ── Status / Platform badges ──────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  Suspected: "bg-destructive/15 text-destructive",
  Tracked: "bg-yellow-500/15 text-yellow-400",
  Cleared: "bg-emerald-500/15 text-emerald-400",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", STATUS_STYLES[status] ?? "bg-secondary text-secondary-foreground")}>
      {status}
    </span>
  );
}

function PlatformBadge({ platform }: { platform: string }) {
  return (
    <span className={cn(
      "text-xs font-medium px-2 py-0.5 rounded-full",
      platform === "Twitter" ? "bg-primary/15 text-primary" : "bg-accent text-accent-foreground"
    )}>
      {platform}
    </span>
  );
}

// ── Add User Dialog ───────────────────────────────────────────────────────────
interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdd: (user: Partial<MonitoredUser>) => Promise<void>;
  existingUsers: MonitoredUser[];
}

function AddUserDialog({ open, onOpenChange, onAdd, existingUsers }: AddUserDialogProps) {
  const [username, setUsername] = useState("");
  const [platform, setPlatform] = useState<"Instagram" | "Twitter">("Instagram");
  const [status, setStatus] = useState<"Suspected" | "Tracked" | "Cleared">("Suspected");
  const [rating, setRating] = useState(1);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setUsername(""); setPlatform("Instagram"); setStatus("Suspected");
    setRating(1); setNotes("");
  };

  const handleSubmit = async () => {
    const cleaned = cleanUsername(username.trim());
    if (!cleaned) { toast.error("Username is required"); return; }

    // Client-side duplicate check (same username + same platform)
    const isDuplicate = existingUsers.some(
      (u) => cleanUsername(u.username).toLowerCase() === cleaned.toLowerCase() && u.platform === platform
    );
    if (isDuplicate) {
      toast.error(`${cleaned} (${platform}) is already being monitored`);
      return;
    }

    setLoading(true);
    try {
      await onAdd({ username: cleaned, platform, status, addedFrom: "Manual", harmfulRating: rating, notes });
      toast.success(`${cleaned} added to monitoring`);
      reset();
      onOpenChange(false);
    } catch (err: any) {
      if (err?.status === 409) toast.error("User already monitored");
      else toast.error("Failed to add user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add User to Monitoring</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Username</label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. john_doe"
              className="bg-background"
            />
            {username.startsWith("@") && (
              <p className="text-[11px] text-muted-foreground mt-1">@ will be stripped automatically</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Platform</label>
              <Select value={platform} onValueChange={(v) => setPlatform(v as any)}>
                <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Instagram">Instagram</SelectItem>
                  <SelectItem value="Twitter">Twitter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Status</label>
              <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Suspected">Suspected</SelectItem>
                  <SelectItem value="Tracked">Tracked</SelectItem>
                  <SelectItem value="Cleared">Cleared</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Harmful Rating</label>
            <StarRating value={rating} onChange={setRating} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              className="bg-background resize-none"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Adding..." : "Add User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Scrape Dialog ─────────────────────────────────────────────────────────────
interface ScrapeDialogProps {
  user: MonitoredUser | null;
  lastPostDate: string | null;
  onClose: () => void;
}

function ScrapeDialog({ user, lastPostDate, onClose }: ScrapeDialogProps) {
  const [mode, setMode] = useState<"duration" | "until_last">("duration");
  const [hours, setHours] = useState("0");
  const [minutes, setMinutes] = useState("10");
  const [seconds, setSeconds] = useState("0");
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const totalSeconds = (parseInt(hours) || 0) * 3600 + (parseInt(minutes) || 0) * 60 + (parseInt(seconds) || 0);
  const canStart = mode === "until_last" || totalSeconds >= 10;

  const handleStart = async () => {
    setLoading(true);
    try {
      const payload: Record<string, any> = {
        instaExplore: false,
        twitterHome: false,
        instaKeywords: [],
        twitterKeywords: [],
        instaProfiles: user.platform === "Instagram" ? [cleanUsername(user.username)] : [],
        twitterProfiles: user.platform === "Twitter" ? [cleanUsername(user.username)] : [],
        duration: mode === "duration" ? totalSeconds : 86400, // 24h max for "until last"
      };
      if (mode === "until_last" && lastPostDate) {
        payload.stopAtDate = lastPostDate;
        payload.untilLastPost = true;
      }

      const res = await fetch(`${API_BASE}/scraper/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to start scraper");
      toast.success(`Scraper started for @${cleanUsername(user.username)}`);
      onClose();
    } catch {
      toast.error("Failed to start scraper. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!user} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Scrape @{cleanUsername(user.username)}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Mode selector */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Scrape Mode</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode("duration")}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs font-medium transition-colors",
                  mode === "duration"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/50"
                )}
              >
                <Clock className="h-4 w-4" />
                Set Duration
              </button>
              <button
                type="button"
                onClick={() => setMode("until_last")}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs font-medium transition-colors",
                  mode === "until_last"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/50"
                )}
              >
                <RotateCcw className="h-4 w-4" />
                Until Last Post
              </button>
            </div>
          </div>

          {mode === "duration" ? (
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Duration</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Hours", val: hours, set: setHours },
                  { label: "Minutes", val: minutes, set: setMinutes },
                  { label: "Seconds", val: seconds, set: setSeconds },
                ].map(({ label, val, set }) => (
                  <div key={label}>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={val}
                      onChange={(e) => { if (/^\d*$/.test(e.target.value)) set(e.target.value); }}
                      className="bg-background text-center"
                      placeholder="0"
                    />
                    <span className="text-[10px] text-muted-foreground mt-1 block text-center">{label}</span>
                  </div>
                ))}
              </div>
              {totalSeconds > 0 && totalSeconds < 10 && (
                <p className="text-[11px] text-destructive mt-1.5">Minimum duration is 10 seconds</p>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-background p-3 space-y-1">
              <p className="text-xs text-card-foreground font-medium">Scrape until last known post</p>
              {lastPostDate ? (
                <p className="text-[11px] text-muted-foreground">
                  Will scrape until post from <span className="font-mono">{lastPostDate}</span> is found.
                </p>
              ) : (
                <p className="text-[11px] text-muted-foreground">No previous posts found — will run for 24h max.</p>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleStart} disabled={loading || !canStart} className="bg-success hover:bg-success/90 text-success-foreground">
            <Play className="h-3.5 w-3.5 mr-1.5" />
            {loading ? "Starting..." : "Start Scraper"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function UserMonitoring() {
  const navigate = useNavigate();
  const { users, isLoading, isError, addUser, updateUser, removeUser } = useMonitoredUsers();
  const seededRef = useRef(false);

  const { data: allPosts = [] } = useQuery({
    queryKey: ["all-posts-monitoring"],
    queryFn: () => getAllPosts(),
  });

  // Flagged posts (localStorage)
  const [flaggedPosts, setFlaggedPosts] = useState<FlaggedPost[]>(loadFlaggedPosts);

  const unflagPost = (id: string) => {
    setFlaggedPosts((prev) => {
      const next = prev.filter((p) => p.id !== id);
      saveFlaggedPosts(next);
      return next;
    });
    toast.success("Post unflagged");
  };

  // Seed dummy data if DB is empty
  useEffect(() => {
    if (!isLoading && !isError && users.length === 0 && !seededRef.current) {
      seededRef.current = true;
      (async () => {
        for (const seed of SEED_USERS) {
          try { await addUser(seed); } catch { /* ignore duplicates */ }
        }
      })();
    }
  }, [isLoading, isError, users.length]);

  // Tab
  const [activeTab, setActiveTab] = useState<"users" | "flagged">("users");

  // Filters & sort
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"date" | "rating">("date");

  // Inline notes editing
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState("");

  // Dialogs
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MonitoredUser | null>(null);
  const [scrapeTarget, setScrapeTarget] = useState<MonitoredUser | null>(null);

  const postCountByUser = (username: string): number =>
    allPosts.filter((p) => cleanUsername(p.user ?? "").toLowerCase() === cleanUsername(username).toLowerCase()).length;

  const lastPostDateByUser = (username: string): string | null => {
    const posts = allPosts
      .filter((p) => cleanUsername(p.user ?? "").toLowerCase() === cleanUsername(username).toLowerCase())
      .sort((a, b) => {
        const da = new Date(`${a.date} ${a.time}`).getTime();
        const db = new Date(`${b.date} ${b.time}`).getTime();
        return db - da;
      });
    return posts[0]?.date ?? null;
  };

  const filtered = users
    .filter((u) => {
      if (search && !cleanUsername(u.username).toLowerCase().includes(search.toLowerCase())) return false;
      if (platformFilter !== "all" && u.platform !== platformFilter) return false;
      if (statusFilter !== "all" && u.status !== statusFilter) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "rating") return (b.harmfulRating ?? 0) - (a.harmfulRating ?? 0);
      return new Date(b.addedAt ?? 0).getTime() - new Date(a.addedAt ?? 0).getTime();
    });

  const suspected = users.filter((u) => u.status === "Suspected").length;
  const tracked = users.filter((u) => u.status === "Tracked").length;
  const avgRating = users.length
    ? (users.reduce((sum, u) => sum + (u.harmfulRating ?? 0), 0) / users.length).toFixed(1)
    : "—";

  const handleRatingChange = async (user: MonitoredUser, rating: number) => {
    try {
      await updateUser(user.id!, { harmfulRating: rating });
    } catch {
      toast.error("Failed to update rating");
    }
  };

  const handleNotesSave = async (user: MonitoredUser) => {
    try {
      await updateUser(user.id!, { notes: notesValue });
      setEditingNotes(null);
    } catch {
      toast.error("Failed to update notes");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    try {
      await removeUser(deleteTarget.id);
      toast.success(`${cleanUsername(deleteTarget.username)} removed`);
    } catch {
      toast.error("Failed to remove user");
    } finally {
      setDeleteTarget(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground text-sm">Loading monitored users...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-semibold text-foreground">User Monitoring</h1>
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load monitored users. Make sure the backend is running.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-semibold text-foreground">User Monitoring</h1>
            <p className="text-sm text-muted-foreground mt-1">Track and manage suspicious users</p>
          </div>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/15 text-primary">
            {users.length} users
          </span>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <PlusCircle className="h-4 w-4 mr-2" /> Add User Manually
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard icon={Users} label="Total Monitored" value={users.length} iconClass="text-primary" />
        <SummaryCard icon={AlertTriangle} label="Suspected" value={suspected} iconClass="text-destructive" />
        <SummaryCard icon={ShieldAlert} label="Tracked" value={tracked} iconClass="text-yellow-400" />
        <SummaryCard icon={Star} label="Avg Harmful Rating" value={avgRating} iconClass="text-amber-400" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(["users", "flagged"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab === "users" ? (
              <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Monitored Users</span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Flag className="h-3.5 w-3.5" /> Flagged Posts
                {flaggedPosts.length > 0 && (
                  <span className="ml-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">
                    {flaggedPosts.length}
                  </span>
                )}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Users Tab ── */}
      {activeTab === "users" && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[180px]">
              <label className="text-xs text-muted-foreground mb-1.5 block">Search by username</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="pl-9 bg-background"
                />
              </div>
            </div>
            <div className="w-[150px]">
              <label className="text-xs text-muted-foreground mb-1.5 block">Platform</label>
              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  <SelectItem value="Instagram">Instagram</SelectItem>
                  <SelectItem value="Twitter">Twitter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-[140px]">
              <label className="text-xs text-muted-foreground mb-1.5 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Suspected">Suspected</SelectItem>
                  <SelectItem value="Tracked">Tracked</SelectItem>
                  <SelectItem value="Cleared">Cleared</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-[140px]">
              <label className="text-xs text-muted-foreground mb-1.5 block">Sort by</label>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date Added</SelectItem>
                  <SelectItem value="rating">Harmful Rating</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Cards Grid */}
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center h-40 rounded-lg border border-border text-muted-foreground text-sm">
              No users match your filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((user) => {
                const postCount = postCountByUser(user.username);
                const isEditingNotes = editingNotes === user.id;
                const displayName = cleanUsername(user.username);

                return (
                  <div key={user.id} className="rounded-lg border border-border bg-card p-4 space-y-3 flex flex-col">
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap gap-1.5">
                        <PlatformBadge platform={user.platform} />
                        <StatusBadge status={user.status} />
                        {user.addedFrom && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                            {user.addedFrom}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => setDeleteTarget(user)}
                        className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Username */}
                    <p className="font-mono text-sm font-semibold text-card-foreground truncate">
                      @{displayName}
                    </p>

                    {/* Harmful Rating */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Harmful Rating</p>
                      <StarRating value={user.harmfulRating ?? 0} onChange={(v) => handleRatingChange(user, v)} />
                    </div>

                    {/* Notes */}
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">Notes</p>
                      {isEditingNotes ? (
                        <div className="space-y-1.5">
                          <Textarea
                            value={notesValue}
                            onChange={(e) => setNotesValue(e.target.value)}
                            className="bg-background resize-none text-xs"
                            rows={2}
                            autoFocus
                          />
                          <div className="flex gap-1.5">
                            <Button size="sm" className="h-6 text-xs px-2" onClick={() => handleNotesSave(user)}>Save</Button>
                            <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => setEditingNotes(null)}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <p
                          className="text-xs text-card-foreground cursor-pointer hover:text-primary transition-colors min-h-[1.5rem]"
                          onClick={() => { setEditingNotes(user.id!); setNotesValue(user.notes ?? ""); }}
                          title="Click to edit"
                        >
                          {user.notes || <span className="text-muted-foreground italic">Click to add notes</span>}
                        </p>
                      )}
                    </div>

                    {/* Post count + Date */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{postCount} post{postCount !== 1 ? "s" : ""} scraped</span>
                      {user.addedAt && <span>{new Date(user.addedAt).toLocaleDateString()}</span>}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs h-8"
                        onClick={() => navigate("/posts", { state: { search: displayName } })}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1.5" /> View Posts
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 text-xs h-8 bg-success hover:bg-success/90 text-success-foreground"
                        onClick={() => setScrapeTarget(user)}
                      >
                        <Play className="h-3.5 w-3.5 mr-1.5" /> Scrape
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Flagged Posts Tab ── */}
      {activeTab === "flagged" && (
        <div className="space-y-4">
          {flaggedPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 rounded-lg border border-border text-muted-foreground text-sm gap-2">
              <Flag className="h-8 w-8 opacity-30" />
              <p>No flagged posts yet.</p>
              <p className="text-xs">Open a post and click <span className="font-medium text-foreground">Flag Post</span> to save it here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {flaggedPosts
                .slice()
                .sort((a, b) => new Date(b.flaggedAt).getTime() - new Date(a.flaggedAt).getTime())
                .map((fp) => (
                  <div key={fp.id} className="rounded-lg border border-border bg-card p-4 space-y-3 flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap gap-1.5">
                        <PlatformBadge platform={fp.platform} />
                        {fp.source && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{fp.source}</span>
                        )}
                        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 flex items-center gap-1">
                          <Flag className="h-3 w-3" /> Flagged
                        </span>
                      </div>
                      <button
                        onClick={() => unflagPost(fp.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                        title="Remove flag"
                      >
                        <BookmarkX className="h-4 w-4" />
                      </button>
                    </div>

                    <p className="font-mono text-xs font-semibold text-primary">@{cleanUsername(fp.user)}</p>

                    <p className="text-xs text-card-foreground leading-relaxed line-clamp-3">
                      {fp.content || <span className="text-muted-foreground italic">No content</span>}
                    </p>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      {fp.date && <span>{fp.date} {fp.time ?? ""}</span>}
                      <span>Flagged {new Date(fp.flaggedAt).toLocaleDateString()}</span>
                    </div>

                    <div className="flex gap-2 pt-1">
                      {fp.url && (
                        <Button size="sm" variant="outline" className="flex-1 text-xs h-8" asChild>
                          <a href={fp.url} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-3.5 w-3.5 mr-1.5" /> Open Post
                          </a>
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs h-8"
                        onClick={() => navigate("/posts", { state: { search: cleanUsername(fp.user) } })}
                      >
                        View User Posts
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Add User Dialog */}
      <AddUserDialog open={addOpen} onOpenChange={setAddOpen} onAdd={addUser} existingUsers={users} />

      {/* Scrape Dialog */}
      <ScrapeDialog
        user={scrapeTarget}
        lastPostDate={scrapeTarget ? lastPostDateByUser(scrapeTarget.username) : null}
        onClose={() => setScrapeTarget(null)}
      />

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from monitoring?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove{" "}
              <span className="font-mono font-semibold">@{deleteTarget ? cleanUsername(deleteTarget.username) : ""}</span>{" "}
              from the monitoring list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Summary Card ──────────────────────────────────────────────────────────────
function SummaryCard({
  icon: Icon,
  label,
  value,
  iconClass,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  iconClass: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-4">
      <div className={cn("p-2 rounded-md bg-muted", iconClass)}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-semibold text-card-foreground">{value}</p>
      </div>
    </div>
  );
}
