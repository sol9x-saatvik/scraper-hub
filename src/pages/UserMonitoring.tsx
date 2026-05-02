import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldAlert, Users, AlertTriangle, CheckCircle, Star,
  Trash2, Search, PlusCircle, Eye, Play, Clock, RotateCcw,
  Bookmark, BookmarkX, Flag, ListFilter, Trash, UserPlus, ExternalLink, MoreVertical,
  Activity, Loader2
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useMonitoredUsers } from "@/hooks/useMonitoredUsers";
import { useQuery } from "@tanstack/react-query";
import { getAllPosts } from "@/services/api";
import type { MonitoredUser } from "@/services/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const API_BASE = "http://localhost:8081/api";

function cleanUsername(username: string): string {
  return username.replace(/^@+/, "");
}

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

const SEED_USERS: Omit<MonitoredUser, "id" | "addedAt">[] = [
  { username: "shadow_tracker99", platform: "Instagram", status: "Suspected", addedFrom: "Manual", harmfulRating: 4, notes: "Posted suspicious content multiple times" },
  { username: "darkweb_news", platform: "Twitter", status: "Tracked", addedFrom: "ScraperProfile", harmfulRating: 5, notes: "Known extremist account" },
  { username: "anon_reporter", platform: "Instagram", status: "Cleared", addedFrom: "PostFlag", harmfulRating: 1, notes: "False positive, cleared after review" },
  { username: "cryptoking_x", platform: "Twitter", status: "Suspected", addedFrom: "PostFlag", harmfulRating: 3, notes: "Promotes illegal financial schemes" },
  { username: "viral.content.hub", platform: "Instagram", status: "Tracked", addedFrom: "Manual", harmfulRating: 2, notes: "Spreading misinformation" },
];

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
            stroke={(hovered || value) >= i ? "hsl(38,92%,50%)" : "hsl(var(--muted-foreground))"}
          />
        </button>
      ))}
    </div>
  );
}

const STATUS_BADGE_STYLES: Record<string, string> = {
  Suspected: "bg-destructive/15 text-destructive border-destructive/20",
  Tracked: "bg-yellow-500/15 text-yellow-600 border-yellow-500/20",
  Cleared: "bg-emerald-500/15 text-emerald-600 border-emerald-500/20",
};

export default function UserMonitoring() {
  const navigate = useNavigate();
  const { users, isLoading, isError, addUser, updateUser, removeUser } = useMonitoredUsers();
  const seededRef = useRef(false);

  const { data: allPosts = [] } = useQuery({
    queryKey: ["all-posts-monitoring"],
    queryFn: () => getAllPosts(),
  });

  const [flaggedPosts, setFlaggedPosts] = useState<FlaggedPost[]>(loadFlaggedPosts);
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"date" | "rating">("date");
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [scrapeTarget, setScrapeTarget] = useState<MonitoredUser | null>(null);

  // Seed data
  useEffect(() => {
    if (!isLoading && !isError && users.length === 0 && !seededRef.current) {
      seededRef.current = true;
      (async () => {
        for (const seed of SEED_USERS) {
          try { await addUser(seed); } catch { /* ignore */ }
        }
      })();
    }
  }, [isLoading, isError, users.length]);

  const postCountByUser = (username: string): number =>
    allPosts.filter((p) => cleanUsername(p.user ?? "").toLowerCase() === cleanUsername(username).toLowerCase()).length;

  const lastPostDateByUser = (username: string): string | null => {
    const sorted = allPosts
      .filter((p) => cleanUsername(p.user ?? "").toLowerCase() === cleanUsername(username).toLowerCase())
      .sort((a, b) => new Date(`${b.date} ${b.time}`).getTime() - new Date(`${a.date} ${a.time}`).getTime());
    return sorted[0]?.date ?? null;
  };

  const filteredUsers = users
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

  const stats = {
    total: users.length,
    suspected: users.filter(u => u.status === "Suspected").length,
    tracked: users.filter(u => u.status === "Tracked").length,
    avgRating: users.length ? (users.reduce((sum, u) => sum + (u.harmfulRating ?? 0), 0) / users.length).toFixed(1) : "0"
  };

  const handleNotesSave = async (user: MonitoredUser) => {
    try {
      await updateUser(user.id!, { notes: notesValue });
      setEditingNotes(null);
      toast.success("Intelligence updated");
    } catch {
      toast.error("Failed to update notes");
    }
  };

  const unflagPost = (id: string) => {
    const next = flaggedPosts.filter(p => p.id !== id);
    saveFlaggedPosts(next);
    setFlaggedPosts(next);
    toast.success("Flag removed");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Intelligence</h1>
          <p className="text-muted-foreground mt-1">High-priority targets and tracked identities.</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" /> Add Priority Target
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Monitored Entities" value={stats.total} icon={Users} color="text-primary" />
        <MetricCard title="High Suspicion" value={stats.suspected} icon={AlertTriangle} color="text-destructive" />
        <MetricCard title="Actively Tracked" value={stats.tracked} icon={ShieldAlert} color="text-yellow-500" />
        <MetricCard title="Avg Harm Rating" value={stats.avgRating} icon={Star} color="text-amber-500" />
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0 mb-6">
          <TabsTrigger value="users" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3">
            Identities
          </TabsTrigger>
          <TabsTrigger value="flagged" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3">
            Flagged Intelligence {flaggedPosts.length > 0 && <Badge variant="secondary" className="ml-2">{flaggedPosts.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          {/* Filters */}
          <Card className="border-border/50 shadow-sm bg-accent/5">
            <CardContent className="p-4 flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[240px] space-y-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Identity Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by username..."
                    className="pl-10 h-10 bg-background border-none shadow-inner"
                  />
                </div>
              </div>
              <div className="w-full sm:w-40 space-y-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Platform</Label>
                <Select value={platformFilter} onValueChange={setPlatformFilter}>
                  <SelectTrigger className="h-10 bg-background border-none shadow-inner"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Platforms</SelectItem>
                    <SelectItem value="Instagram">Instagram</SelectItem>
                    <SelectItem value="Twitter">Twitter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-40 space-y-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Risk Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-10 bg-background border-none shadow-inner"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Risks</SelectItem>
                    <SelectItem value="Suspected">Suspected</SelectItem>
                    <SelectItem value="Tracked">Tracked</SelectItem>
                    <SelectItem value="Cleared">Cleared</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-40 space-y-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Sort By</Label>
                <Select value={sortBy} onValueChange={v => setSortBy(v as any)}>
                  <SelectTrigger className="h-10 bg-background border-none shadow-inner"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date Added</SelectItem>
                    <SelectItem value="rating">Harm Level</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 w-full" />)}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground border rounded-xl border-dashed">
              <Users className="h-12 w-12 opacity-10 mb-4" />
              <p>No identities match the current intelligence filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUsers.map(user => (
                <UserCard
                  key={user.id}
                  user={user}
                  postCount={postCountByUser(user.username)}
                  onEditNotes={() => { setEditingNotes(user.id!); setNotesValue(user.notes ?? ""); }}
                  isEditingNotes={editingNotes === user.id}
                  notesValue={notesValue}
                  setNotesValue={setNotesValue}
                  onSaveNotes={() => handleNotesSave(user)}
                  onCancelNotes={() => setEditingNotes(null)}
                  onRatingChange={(v) => updateUser(user.id!, { harmfulRating: v })}
                  onDelete={() => removeUser(user.id!)}
                  onScrape={() => setScrapeTarget(user)}
                  onViewPosts={() => navigate("/posts", { state: { search: cleanUsername(user.username) } })}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="flagged">
          {flaggedPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-muted-foreground border rounded-xl border-dashed">
              <Flag className="h-12 w-12 opacity-10 mb-4" />
              <p>No intelligence reports flagged for follow-up.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {flaggedPosts.map(post => (
                <FlaggedPostCard key={post.id} post={post} onUnflag={() => unflagPost(post.id)} onViewUser={() => navigate("/posts", { state: { search: cleanUsername(post.user) } })} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AddUserDialog open={addOpen} onOpenChange={setAddOpen} onAdd={addUser} existingUsers={users} />

      <ScrapeDialog
        user={scrapeTarget}
        lastPostDate={scrapeTarget ? lastPostDateByUser(scrapeTarget.username) : null}
        onClose={() => setScrapeTarget(null)}
      />
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, color }: any) {
  return (
    <Card className="shadow-sm border-border/50">
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-black">{value}</p>
        </div>
        <div className={cn("p-3 rounded-xl bg-accent/50", color)}>
          <Icon className="h-6 w-6" />
        </div>
      </CardContent>
    </Card>
  );
}

function UserCard({ user, postCount, isEditingNotes, notesValue, setNotesValue, onSaveNotes, onCancelNotes, onEditNotes, onRatingChange, onDelete, onScrape, onViewPosts }: any) {
  const displayName = cleanUsername(user.username);

  return (
    <Card className="group border-border/60 hover:border-primary/40 transition-all hover:shadow-md overflow-hidden bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px] uppercase font-bold">{user.platform}</Badge>
            <Badge className={cn("px-1.5 py-0 text-[10px] uppercase font-black", STATUS_BADGE_STYLES[user.status])}>{user.status}</Badge>
          </div>
          <CardTitle className="font-mono text-base font-bold text-primary">@{displayName}</CardTitle>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Remove Identity Track?</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to stop monitoring @{displayName}? This will delete all associated tracking data.</AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel>Abort</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Confirm Removal</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <Label className="text-[10px] font-bold uppercase text-muted-foreground mb-2 block">Risk Level Assessment</Label>
          <StarRating value={user.harmfulRating ?? 0} onChange={onRatingChange} />
        </div>

        <div className="min-h-[80px]">
          <Label className="text-[10px] font-bold uppercase text-muted-foreground mb-2 block">Intelligence Notes</Label>
          {isEditingNotes ? (
            <div className="space-y-2">
              <Textarea value={notesValue} onChange={e => setNotesValue(e.target.value)} className="text-xs min-h-[60px]" autoFocus />
              <div className="flex gap-2">
                <Button size="sm" onClick={onSaveNotes} className="h-7 text-[10px] px-3">Save Intelligence</Button>
                <Button size="sm" variant="ghost" onClick={onCancelNotes} className="h-7 text-[10px] px-3">Cancel</Button>
              </div>
            </div>
          ) : (
            <p className="text-xs leading-relaxed text-card-foreground cursor-pointer hover:bg-accent/30 p-2 rounded-md transition-colors border border-transparent hover:border-border/50" onClick={onEditNotes}>
              {user.notes || <span className="text-muted-foreground italic">No surveillance notes recorded. Click to update.</span>}
            </p>
          )}
        </div>

        <Separator className="bg-border/40" />

        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          <span className="flex items-center gap-1"><Activity className="h-3 w-3" /> {postCount} Signals Scraped</span>
          <span>Added {new Date(user.addedAt).toLocaleDateString()}</span>
        </div>
      </CardContent>

      <CardFooter className="bg-muted/30 p-3 gap-2">
        <Button variant="outline" size="sm" className="flex-1 h-9 text-[11px] font-bold uppercase tracking-wide gap-2 bg-background shadow-sm" onClick={onViewPosts}>
          <Eye className="h-3.5 w-3.5" /> View Signals
        </Button>
        <Button size="sm" className="flex-1 h-9 text-[11px] font-bold uppercase tracking-wide gap-2 bg-success hover:bg-success/90 text-success-foreground shadow-sm" onClick={onScrape}>
          <Play className="h-3.5 w-3.5" /> Start Agent
        </Button>
      </CardFooter>
    </Card>
  );
}

function FlaggedPostCard({ post, onUnflag, onViewUser }: any) {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/60 hover:shadow-md transition-all">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline" className="text-[10px] uppercase font-bold gap-1.5">
            <span className={cn("h-1.5 w-1.5 rounded-full", post.platform === "Twitter" ? "bg-primary" : "bg-accent")} />
            {post.platform}
          </Badge>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={onUnflag}>
            <BookmarkX className="h-4 w-4" />
          </Button>
        </div>
        <p className="font-mono text-sm font-bold text-primary">@{cleanUsername(post.user)}</p>
      </CardHeader>
      <CardContent>
        <p className="text-xs leading-relaxed text-muted-foreground line-clamp-4 bg-accent/20 p-3 rounded-lg italic">
          "{post.content || "Media-only content"}"
        </p>
        <div className="flex items-center justify-between mt-4 text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
          <span>{post.date}</span>
          <span>Flagged {new Date(post.flaggedAt).toLocaleDateString()}</span>
        </div>
      </CardContent>
      <CardFooter className="p-3 gap-2">
        {post.url && (
          <Button variant="outline" size="sm" className="flex-1 h-8 text-[10px] font-bold uppercase gap-1.5" asChild>
            <a href={post.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3" /> Original</a>
          </Button>
        )}
        <Button variant="ghost" size="sm" className="flex-1 h-8 text-[10px] font-bold uppercase gap-1.5" onClick={onViewUser}>
          <ListFilter className="h-3 w-3" /> Filter Signals
        </Button>
      </CardFooter>
    </Card>
  );
}

function AddUserDialog({ open, onOpenChange, onAdd, existingUsers }: any) {
  const [username, setUsername] = useState("");
  const [platform, setPlatform] = useState<"Instagram" | "Twitter">("Instagram");
  const [status, setStatus] = useState<"Suspected" | "Tracked" | "Cleared">("Suspected");
  const [rating, setRating] = useState(1);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => { setUsername(""); setPlatform("Instagram"); setStatus("Suspected"); setRating(1); setNotes(""); };

  const handleSubmit = async () => {
    const cleaned = cleanUsername(username.trim());
    if (!cleaned) return toast.error("Username required");
    const isDuplicate = existingUsers.some((u: any) => cleanUsername(u.username).toLowerCase() === cleaned.toLowerCase() && u.platform === platform);
    if (isDuplicate) return toast.error(`${cleaned} already tracked on ${platform}`);

    setLoading(true);
    try {
      await onAdd({ username: cleaned, platform, status, addedFrom: "Manual", harmfulRating: rating, notes });
      toast.success("Identity added to database");
      reset();
      onOpenChange(false);
    } catch {
      toast.error("Database error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Priority Identity</DialogTitle>
          <DialogDescription>Input identity details for automated surveillance tracking.</DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-4">
          <div className="space-y-2">
            <Label>Username / Handle</Label>
            <Input value={username} onChange={e => setUsername(e.target.value)} placeholder="e.g. shadow_stalker" className="h-10" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select value={platform} onValueChange={setPlatform as any}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Instagram">Instagram</SelectItem><SelectItem value="Twitter">Twitter</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Initial Risk</Label>
              <Select value={status} onValueChange={setStatus as any}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Suspected">Suspected</SelectItem><SelectItem value="Tracked">Tracked</SelectItem><SelectItem value="Cleared">Cleared</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Risk Rating Assessment</Label>
            <div className="p-3 bg-accent/20 rounded-md inline-block"><StarRating value={rating} onChange={setRating} /></div>
          </div>
          <div className="space-y-2">
            <Label>Intelligence Notes</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Surveillance rationale..." className="min-h-[80px]" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Initiate Tracking"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ScrapeDialog({ user, lastPostDate, onClose }: any) {
  const [mode, setMode] = useState<"duration" | "until_last">("duration");
  const [hours, setHours] = useState("0");
  const [minutes, setMinutes] = useState("10");
  const [seconds, setSeconds] = useState("0");
  const [loading, setLoading] = useState(false);

  if (!user) return null;
  const totalSeconds = (parseInt(hours) || 0) * 3600 + (parseInt(minutes) || 0) * 60 + (parseInt(seconds) || 0);

  const handleStart = async () => {
    setLoading(true);
    try {
      const payload: any = {
        instaExplore: false, twitterHome: false, instaKeywords: [], twitterKeywords: [],
        instaProfiles: user.platform === "Instagram" ? [cleanUsername(user.username)] : [],
        twitterProfiles: user.platform === "Twitter" ? [cleanUsername(user.username)] : [],
        duration: mode === "duration" ? totalSeconds : 86400,
      };
      if (mode === "until_last" && lastPostDate) { payload.stopAtDate = lastPostDate; payload.untilLastPost = true; }
      const res = await fetch(`${API_BASE}/scraper/start`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error();
      toast.success(`Agent deployed for @${cleanUsername(user.username)}`);
      onClose();
    } catch {
      toast.error("Agent deployment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!user} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Deploy Agent: @{cleanUsername(user.username)}</DialogTitle>
          <DialogDescription>Specify tracking parameters for this mission.</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-2">
            <Button variant={mode === "duration" ? "default" : "outline"} onClick={() => setMode("duration")} className="flex-col h-16 gap-1.5 py-2">
              <Clock className="h-4 w-4" /><span className="text-[10px] uppercase font-bold">Timed Mission</span>
            </Button>
            <Button variant={mode === "until_last" ? "default" : "outline"} onClick={() => setMode("until_last")} className="flex-col h-16 gap-1.5 py-2">
              <RotateCcw className="h-4 w-4" /><span className="text-[10px] uppercase font-bold">Full Sync</span>
            </Button>
          </div>

          {mode === "duration" ? (
            <div className="grid grid-cols-3 gap-2">
              {[{ l: "HRS", v: hours, s: setHours }, { l: "MIN", v: minutes, s: setMinutes }, { l: "SEC", v: seconds, s: setSeconds }].map(f => (
                <div key={f.l} className="space-y-1">
                  <Input value={f.v} onChange={e => /^\d*$/.test(e.target.value) && f.s(e.target.value)} className="text-center font-mono h-10" />
                  <p className="text-[9px] text-center font-bold text-muted-foreground">{f.l}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-accent/20 p-4 rounded-lg border border-dashed border-border/50 text-center">
              <p className="text-xs font-medium">Synchronizing signals until last capture</p>
              <p className="text-[10px] text-muted-foreground mt-1">{lastPostDate ? `Last signal: ${lastPostDate}` : "No previous signal data found."}</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Abort</Button>
          <Button onClick={handleStart} disabled={loading || (mode === "duration" && totalSeconds < 10)} className="bg-success hover:bg-success/90 text-success-foreground gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />} Initiate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
