import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Search, ChevronLeft, ChevronRight, ExternalLink, ChevronDown, Sparkles, Loader2, ListFilter, MoreHorizontal, FilterX, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  type ViewType,
  type AllPost,
  type InstaExplorePost,
  type InstaSearchPost,
  type InstaProfilePost,
  type TwitterHomePost,
  type TwitterSearchPost,
  type TwitterProfilePost,
  type FacebookExplorePost,
  type FacebookSearchPost,
  type FacebookProfilePost,
  type RedditHomePost,
  type RedditSearchPost,
  type WebSearchPost,
  getAllPosts,
  getInstaExplorePosts,
  getInstaSearchPosts,
  getInstaProfilePosts,
  getTwitterHomePosts,
  getTwitterSearchPosts,
  getTwitterProfilePosts,
  getFacebookExplorePosts,
  getFacebookSearchPosts,
  getFacebookProfilePosts,
  getRedditHomePosts,
  getRedditSearchPosts,
  getWebSearchPosts,
} from "@/services/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import PostModal from "@/components/posts/PostModal";
import { useScraperContext } from "@/context/ScraperContext";
import { useGenerateReport } from "@/hooks/useGenerateReport";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;

type AnyPost = AllPost | InstaExplorePost | InstaSearchPost | InstaProfilePost | TwitterHomePost | TwitterSearchPost | TwitterProfilePost | FacebookExplorePost | FacebookSearchPost | FacebookProfilePost | RedditHomePost | RedditSearchPost | WebSearchPost;

const VIEW_LABELS: Record<ViewType, string> = {
  all: "Universal Stream",
  "instagram-explore": "IG Explore",
  "instagram-search": "IG Search",
  "instagram-profile": "IG Profile",
  "twitter-home": "X/Twitter Home",
  "twitter-search": "X/Twitter Search",
  "twitter-profile": "X/Twitter Profile",
  "facebook-explore": "FB Explore",
  "facebook-search": "FB Search",
  "facebook-profile": "FB Profile",
  "reddit-home": "Reddit Home",
  "reddit-search": "Reddit Search",
  "web-search": "Global Web Search",
};

const KEYWORD_VIEWS: ViewType[] = ["all", "instagram-search", "twitter-search", "facebook-search", "reddit-search", "web-search"];

const COLUMNS: Record<ViewType, { key: string; label: string; align?: "right" }[]> = {
  all: [
    { key: "platform", label: "Platform" },
    { key: "source", label: "Source" },
    { key: "keyword", label: "Keyword" },
    { key: "user", label: "Identity" },
    { key: "content", label: "Intelligence Snippet" },
    { key: "likes", label: "Eng.", align: "right" },
    { key: "date", label: "Captured" },
    { key: "_viewPost", label: "Actions" },
  ],
  "instagram-explore": [
    { key: "username", label: "User" },
    { key: "caption", label: "Caption" },
    { key: "likes", label: "Likes", align: "right" },
    { key: "date", label: "Date" },
    { key: "_viewPost", label: "Actions" },
  ],
  "instagram-search": [
    { key: "keyword", label: "Keyword" },
    { key: "username", label: "User" },
    { key: "caption", label: "Caption" },
    { key: "likes", label: "Likes", align: "right" },
    { key: "date", label: "Date" },
    { key: "_viewPost", label: "Actions" },
  ],
  "instagram-profile": [
    { key: "profile", label: "Profile" },
    { key: "username", label: "User" },
    { key: "caption", label: "Caption" },
    { key: "likes", label: "Likes", align: "right" },
    { key: "date", label: "Date" },
    { key: "_viewPost", label: "Actions" },
  ],
  "twitter-home": [
    { key: "name", label: "Name" },
    { key: "handle", label: "Handle" },
    { key: "tweet", label: "Tweet" },
    { key: "likes", label: "Likes", align: "right" },
    { key: "views", label: "Views", align: "right" },
    { key: "date", label: "Date" },
    { key: "_viewPost", label: "Actions" },
  ],
  "twitter-search": [
    { key: "keyword", label: "Keyword" },
    { key: "name", label: "Name" },
    { key: "handle", label: "Handle" },
    { key: "tweet", label: "Tweet" },
    { key: "likes", label: "Likes", align: "right" },
    { key: "date", label: "Date" },
    { key: "_viewPost", label: "Actions" },
  ],
  "twitter-profile": [
    { key: "profile", label: "Profile" },
    { key: "handle", label: "Handle" },
    { key: "tweet", label: "Tweet" },
    { key: "likes", label: "Likes", align: "right" },
    { key: "date", label: "Date" },
    { key: "_viewPost", label: "Actions" },
  ],
  "facebook-explore": [
    { key: "username", label: "User" },
    { key: "caption", label: "Caption" },
    { key: "likes", label: "Likes", align: "right" },
    { key: "date", label: "Date" },
    { key: "_viewPost", label: "Actions" },
  ],
  "facebook-search": [
    { key: "keyword", label: "Keyword" },
    { key: "username", label: "User" },
    { key: "caption", label: "Caption" },
    { key: "likes", label: "Likes", align: "right" },
    { key: "date", label: "Date" },
    { key: "_viewPost", label: "Actions" },
  ],
  "facebook-profile": [
    { key: "profile", label: "Profile" },
    { key: "username", label: "User" },
    { key: "caption", label: "Caption" },
    { key: "likes", label: "Likes", align: "right" },
    { key: "date", label: "Date" },
    { key: "_viewPost", label: "Actions" },
  ],
  "reddit-home": [
    { key: "subreddit", label: "Subreddit" },
    { key: "username", label: "User" },
    { key: "title", label: "Title" },
    { key: "upvotes", label: "Upvotes", align: "right" },
    { key: "date", label: "Date" },
    { key: "_viewPost", label: "Actions" },
  ],
  "reddit-search": [
    { key: "keyword", label: "Keyword" },
    { key: "subreddit", label: "Subreddit" },
    { key: "username", label: "User" },
    { key: "title", label: "Title" },
    { key: "upvotes", label: "Upvotes", align: "right" },
    { key: "date", label: "Date" },
    { key: "_viewPost", label: "Actions" },
  ],
  "web-search": [
    { key: "title", label: "Title" },
    { key: "keyword", label: "Keyword" },
    { key: "engine", label: "Engine" },
    { key: "status", label: "Status" },
    { key: "snippet", label: "Snippet" },
    { key: "scrapedAt", label: "Timestamp" },
    { key: "_viewPost", label: "Actions" },
  ],
};

function truncate(text: string, maxLen = 60): string {
  if (!text || text.length <= maxLen) return text;
  return text.slice(0, maxLen) + "...";
}

function getPostKeyword(post: AnyPost): string | null {
  const p = post as any;
  if (p.source === "Profile" || p.source === "PROFILE") return p.profile ?? null;
  return p.keyword ?? null;
}

function derivePostId(post: AnyPost): string {
  const p = post as any;
  const platform = p.platform ?? "";
  const user = p.user ?? p.username ?? p.handle ?? "";
  const date = p.date ?? "";
  const time = p.time ?? "";
  return `${platform}_${user}_${date}_${time}`;
}

function postTimestamp(post: AnyPost): number {
  const p = post as any;
  const directTimestamp = p.scrapedAt ?? p.scraped_at ?? p.timestamp ?? p.createdAt;
  if (directTimestamp) {
    const parsed = Date.parse(String(directTimestamp));
    if (!Number.isNaN(parsed)) return parsed;
  }

  const date = String(p.date ?? "").trim();
  const time = String(p.time ?? "00:00:00").trim() || "00:00:00";
  const parts = date.split("-");
  if (parts.length === 3) {
    const [first, second, third] = parts;
    const normalizedDate = first.length === 4 ? `${first}-${second}-${third}` : `${third}-${second}-${first}`;
    const parsed = Date.parse(`${normalizedDate}T${time}`);
    if (!Number.isNaN(parsed)) return parsed;
  }

  return 0;
}

export default function Posts() {
  const location = useLocation();
  const { state, analyzeAllPosts, getPostAnalysis } = useScraperContext();
  const { isAnalyzing, analysisProgress, isRunning } = state;
  const { generate: generateReport, isGenerating: isGeneratingReport } = useGenerateReport();

  const [viewType, setViewType] = useState<ViewType>("all");
  const [rawPosts, setRawPosts] = useState<AnyPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState((location.state as any)?.search ?? "");
  const [minLikesInput, setMinLikesInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState((location.state as any)?.search ?? "");
  const [appliedMinLikes, setAppliedMinLikes] = useState(0);
  const [selectedKeyword, setSelectedKeyword] = useState<string>("all");

  const [page, setPage] = useState(1);
  const [selectedPost, setSelectedPost] = useState<Record<string, any> | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPostIds, setSelectedPostIds] = useState<Set<string>>(new Set());

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data: AnyPost[];
      switch (viewType) {
        case "all": data = await getAllPosts(); break;
        case "instagram-explore": data = await getInstaExplorePosts(); break;
        case "instagram-search": data = await getInstaSearchPosts(); break;
        case "instagram-profile": data = await getInstaProfilePosts(); break;
        case "twitter-home": data = await getTwitterHomePosts(); break;
        case "twitter-search": data = await getTwitterSearchPosts(); break;
        case "twitter-profile": data = await getTwitterProfilePosts(); break;
        case "facebook-explore": data = await getFacebookExplorePosts(); break;
        case "facebook-search": data = await getFacebookSearchPosts(); break;
        case "facebook-profile": data = await getFacebookProfilePosts(); break;
        case "reddit-home": data = await getRedditHomePosts(); break;
        case "reddit-search": data = await getRedditSearchPosts(); break;
        case "web-search": data = await getWebSearchPosts(); break;
        default: data = [];
      }
      data.sort((a, b) => postTimestamp(b) - postTimestamp(a));
      setRawPosts(data);
    } catch {
      setError("Intelligence server unreachable. Check connection.");
      setRawPosts([]);
    } finally {
      setLoading(false);
    }
  }, [viewType]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      fetchPosts();
    }, 30000);
    return () => clearInterval(interval);
  }, [isRunning, fetchPosts]);

  const prevIsRunning = useRef(false);
  useEffect(() => {
    if (prevIsRunning.current && !isRunning) {
      fetchPosts();
    }
    prevIsRunning.current = isRunning;
  }, [isRunning, fetchPosts]);

  useEffect(() => {
    setPage(1);
    setSelectedKeyword("all");
    setSelectedPostIds(new Set());
  }, [viewType]);

  const availableKeywords = useMemo(() => {
    if (!KEYWORD_VIEWS.includes(viewType)) return [];
    const kws = new Set<string>();
    for (const post of rawPosts) {
      const kw = getPostKeyword(post);
      if (kw && kw !== "—") kws.add(kw);
    }
    return Array.from(kws).sort();
  }, [rawPosts, viewType]);

  const posts = useMemo(() => {
    let filtered = rawPosts;
    if (appliedSearch.trim()) {
      const term = appliedSearch.trim().toLowerCase();
      filtered = filtered.filter((post) => {
        const p = post as any;
        const user = (p.user ?? p.username ?? p.handle ?? "").toLowerCase();
        const content = (p.content ?? p.caption ?? p.tweet ?? p.title ?? "").toLowerCase();
        return user.includes(term) || content.includes(term);
      });
    }
    if (appliedMinLikes > 0 && viewType !== "web-search") {
      filtered = filtered.filter((post) => {
        const p = post as any;
        const likes = typeof p.likes === "number" ? p.likes : parseFloat(p.likes) || 0;
        return likes >= appliedMinLikes;
      });
    }
    if (selectedKeyword !== "all" && KEYWORD_VIEWS.includes(viewType)) {
      filtered = filtered.filter((post) => getPostKeyword(post) === selectedKeyword);
    }
    return filtered;
  }, [rawPosts, appliedSearch, appliedMinLikes, selectedKeyword, viewType]);

  const totalPages = Math.ceil(posts.length / PAGE_SIZE);
  const paginated = posts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const columns = COLUMNS[viewType];
  const isWebSearch = viewType === "web-search";

  const paginatedIds = useMemo(() => paginated.map(derivePostId), [paginated]);
  const selectedPostsForAnalysis = useMemo(
    () => posts.filter((p) => selectedPostIds.has(derivePostId(p))),
    [posts, selectedPostIds]
  );

  const toggleRow = (postId: string) => {
    if (isAnalyzing) return;
    setSelectedPostIds((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  };

  const toggleAllOnPage = () => {
    if (isAnalyzing) return;
    if (paginatedIds.every((id) => selectedPostIds.has(id))) {
      const next = new Set(selectedPostIds);
      paginatedIds.forEach(id => next.delete(id));
      setSelectedPostIds(next);
    } else {
      const next = new Set(selectedPostIds);
      paginatedIds.forEach(id => next.add(id));
      setSelectedPostIds(next);
    }
  };

  const handleAnalyzeSelected = async () => {
    const count = selectedPostsForAnalysis.length;
    await analyzeAllPosts(selectedPostsForAnalysis as unknown as AllPost[]);
    setSelectedPostIds(new Set());
    toast.success(`Analysis started for ${count} items`);
  };

  const handleAnalyzeAll = async () => {
    const count = posts.length;
    await analyzeAllPosts(posts as unknown as AllPost[]);
    setSelectedPostIds(new Set());
    toast.success(`Broad analysis started for ${count} items`);
  };

  const handleRowClick = (post: AnyPost) => {
    const p = post as any;
    if (!p.platform) {
      if (viewType === "web-search") p.platform = "Web";
      else if (viewType.startsWith("twitter")) p.platform = "Twitter";
      else if (viewType.startsWith("instagram")) p.platform = "Instagram";
      else if (viewType.startsWith("facebook")) p.platform = "Facebook";
      else if (viewType.startsWith("reddit")) p.platform = "Reddit";
    }
    if (viewType === "web-search") {
      p.source = "Search";
      p.user = p.url;
      p.content = p.scrapedContent || p.snippet || p.title;
      p.date = p.date || (p.scrapedAt ? new Date(p.scrapedAt).toLocaleDateString("en-GB").replace(/\//g, "-") : "");
      p.time = p.time || (p.scrapedAt ? new Date(p.scrapedAt).toLocaleTimeString("en-GB", { hour12: false }) : "");
      p.screenshot_path = p.screenshot_path || p.screenshotPath;
    }
    setSelectedPost(p);
    setModalOpen(true);
  };

  const AnalysisIndicator = ({ post }: { post: AnyPost }) => {
    const p = post as any;
    const fakePost: AllPost = {
      platform: (p.platform ?? "") as any,
      source: (p.source ?? "") as any,
      keyword: null,
      user: p.user ?? p.username ?? p.handle ?? "",
      content: p.content ?? p.caption ?? p.tweet ?? "",
      likes: p.likes ?? 0,
      date: p.date ?? "",
      time: p.time ?? "",
    };
    const analysis = getPostAnalysis(fakePost);
    if (!analysis) return <div className="h-2 w-2 rounded-full bg-muted shadow-inner" title="Not analyzed" />;
    if (analysis.harmful) return <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" title="Harmful Detected" />;
    return <div className="h-2 w-2 rounded-full bg-success shadow-[0_0_8px_rgba(var(--success),0.4)]" title="AI Analyzed — Clean" />;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Intelligence Feed</h1>
          <p className="text-muted-foreground mt-1">
            Analyzing {posts.length.toLocaleString()} signals from across the web.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {isRunning ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-block">
                  <Button variant="outline" disabled className="gap-2 font-semibold">
                    <FileText className="h-4 w-4" />
                    Generate Session Report
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Stop the scraper before generating a report</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="outline"
              disabled={isGeneratingReport}
              onClick={() => generateReport()}
              className="gap-2 font-semibold"
            >
              {isGeneratingReport ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              Generate Session Report
            </Button>
          )}
          {!isWebSearch && (
            <>
              <Button
                variant="secondary"
                disabled={isAnalyzing || selectedPostIds.size === 0}
                onClick={handleAnalyzeSelected}
                className="gap-2 font-semibold shadow-sm"
              >
                <Sparkles className={cn("h-4 w-4 text-primary", isAnalyzing && "animate-spin")} />
                Analyze Selection ({selectedPostIds.size})
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" disabled={isAnalyzing || posts.length === 0} className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    Deep Scan All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Initiate Deep Intelligence Scan?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will run AI analysis on all {posts.length} captured signals. This may take significant time.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Abort</AlertDialogCancel>
                    <AlertDialogAction onClick={handleAnalyzeAll}>Proceed</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>

      {isAnalyzing && (
        <Card className="bg-primary/5 border-primary/20 animate-in fade-in slide-in-from-top-1">
          <CardContent className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm font-medium">
                {analysisProgress.rateLimited ? "AI Rate Limited — retrying..." : `AI Deep Scan in progress: ${analysisProgress.current} / ${analysisProgress.total}`}
              </span>
            </div>
            <Badge variant="outline" className="font-mono">
              {Math.round((analysisProgress.current / analysisProgress.total) * 100 || 0)}%
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Toolbar */}
      <Card className="shadow-sm border-border/50">
        <CardContent className="p-4 flex flex-wrap gap-4 items-end">
          <div className="w-full md:w-56 space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Source Stream</label>
            <Select value={viewType} onValueChange={(v) => setViewType(v as ViewType)}>
              <SelectTrigger className="h-10 bg-accent/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(VIEW_LABELS).map(([val, label]) => (
                  <SelectItem key={val} value={val}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[240px] space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Intelligence Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && setAppliedSearch(search)}
                placeholder="Search identities or keywords..."
                className="pl-10 h-10 bg-accent/20 border-none focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
          </div>

          {!isWebSearch && (
            <div className="w-full md:w-32 space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Min Engagement</label>
              <Input
                type="number"
                value={minLikesInput}
                onChange={(e) => setMinLikesInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && setAppliedMinLikes(Number(minLikesInput))}
                placeholder="0"
                className="h-10 bg-accent/20 border-none"
              />
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={() => { setAppliedSearch(search); setAppliedMinLikes(Number(minLikesInput)); }} className="h-10">
              Filter
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-muted-foreground"
              onClick={() => {
                setSearch(""); setMinLikesInput(""); setAppliedSearch(""); setAppliedMinLikes(0); setPage(1); setSelectedKeyword("all");
              }}
            >
              <FilterX className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Area */}
      <Card className="shadow-lg border-border overflow-hidden bg-card/50 backdrop-blur-sm">
        <div className="overflow-x-auto min-h-[400px]">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12 text-center">
                  {!isWebSearch && (
                    <Checkbox
                      checked={paginatedIds.length > 0 && paginatedIds.every((id) => selectedPostIds.has(id))}
                      onCheckedChange={toggleAllOnPage}
                      disabled={isAnalyzing || paginatedIds.length === 0}
                    />
                  )}
                </TableHead>
                {!isWebSearch && <TableHead className="w-8" />}
                {columns.map((col) => (
                  <TableHead key={col.key} className={cn("font-bold text-[11px] uppercase tracking-wider py-4", col.align === "right" && "text-right")}>
                    {col.key === "keyword" && availableKeywords.length > 0 ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger className="flex items-center gap-1 hover:text-primary transition-colors uppercase">
                          {selectedKeyword === "all" ? "Keyword" : selectedKeyword}
                          <ChevronDown className="h-3 w-3" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="max-h-64 overflow-y-auto w-56">
                          <DropdownMenuLabel>Filter by keyword</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setSelectedKeyword("all")}>All Sources</DropdownMenuItem>
                          {availableKeywords.map(kw => (
                            <DropdownMenuItem key={kw} onClick={() => setSelectedKeyword(kw)}>{kw}</DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : col.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={10} className="py-6"><Skeleton className="h-4 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-64 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <ListFilter className="h-10 w-10 opacity-20" />
                      <p className="text-sm">{error || "No intelligence matching criteria."}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((post, idx) => {
                  const postId = derivePostId(post);
                  const isSelected = selectedPostIds.has(postId);
                  const p = post as any;
                  
                  return (
                    <TableRow
                      key={idx}
                      className={cn(
                        "cursor-pointer transition-all hover:bg-accent/40 group border-b border-border/40",
                        isSelected && "bg-primary/5 hover:bg-primary/10"
                      )}
                      onClick={() => handleRowClick(post)}
                    >
                      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                        {!isWebSearch && (
                            <Checkbox checked={isSelected} onCheckedChange={() => toggleRow(postId)} disabled={isAnalyzing} />
                        )}
                      </TableCell>
                      {!isWebSearch && (
                          <TableCell className="text-center px-1"><AnalysisIndicator post={post} /></TableCell>
                      )}
                      
                      {columns.map((col) => {
                        if (col.key === "_viewPost") {
                          const url = p.url || "";
                          return (
                            <TableCell key={col.key} className="text-right py-2">
                              <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {url && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-primary"
                                    onClick={(e) => { e.stopPropagation(); window.open(url, "_blank", "noopener,noreferrer"); }}
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                              </div>
                            </TableCell>
                          );
                        }

                        const parseLikes = (val: any): string => {
                          if (val === null || val === undefined) return "0";
                          const str = String(val).trim().toUpperCase();
                          if (str.endsWith("M")) return (parseFloat(str) * 1_000_000).toLocaleString();
                          if (str.endsWith("K")) return (parseFloat(str) * 1_000).toLocaleString();
                          const num = Number(str.replace(/,/g, ""));
                          if (isNaN(num)) return "0";
                          return num.toLocaleString();
                        };

                        const rawVal = p[col.key] ?? "—";
                        
                        return (
                          <TableCell key={col.key} className={cn("py-4 text-sm", col.align === "right" && "text-right font-mono")}>
                            {col.key === "platform" ? (
                              (() => {
                                const platformDisplay = String(rawVal);
                                const platformNormalized = platformDisplay.charAt(0).toUpperCase() + platformDisplay.slice(1).toLowerCase();
                                return (
                                  <Badge variant={platformNormalized === "Twitter" ? "default" : platformNormalized === "Instagram" ? "secondary" : "outline"} className="text-[10px] font-bold px-1.5 py-0">
                                    {platformNormalized}
                                  </Badge>
                                );
                              })()
                            ) : col.key === "source" ? (
                              <span className="text-foreground font-medium">
                                {String(rawVal).charAt(0).toUpperCase() + String(rawVal).slice(1).toLowerCase()}
                              </span>
                            ) : col.key === "status" ? (
                              <Badge className={cn("text-[9px] uppercase font-black", rawVal === "SUCCESS" ? "bg-success hover:bg-success" : "bg-destructive hover:bg-destructive")}>
                                {rawVal}
                              </Badge>
                            ) : col.key === "likes" || col.key === "upvotes" ? (
                              <span className="font-bold text-foreground">
                                {parseLikes(rawVal)}
                              </span>
                            ) : (
                              <span className={cn(
                                (col.key === "content" || col.key === "snippet") ? "text-muted-foreground text-xs leading-relaxed max-w-[300px] inline-block" : "text-foreground font-medium",
                                (col.key === "user" || col.key === "handle") && "font-mono text-xs text-primary"
                              )}>
                                {(col.key === "content" || col.key === "snippet") ? truncate(String(rawVal)) : String(rawVal)}
                              </span>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 bg-muted/30 border-t border-border">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
              Page {page} of {totalPages} <span className="mx-2 opacity-30">|</span> Total {posts.length.toLocaleString()}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-9 px-3" disabled={page === 1} onClick={() => setPage(1)}>«</Button>
              <Button variant="outline" size="sm" className="h-9 px-3" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</Button>

              {/* Page number buttons */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                const pageNum = start + i;
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === page ? "default" : "outline"}
                    size="sm"
                    className="h-9 w-9 p-0"
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}

              <Button variant="outline" size="sm" className="h-9 px-3" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</Button>
              <Button variant="outline" size="sm" className="h-9 px-3" disabled={page === totalPages} onClick={() => setPage(totalPages)}>»</Button>

              {/* Go to page input */}
              <div className="flex items-center gap-1 ml-2">
                <span className="text-xs text-muted-foreground">Go to:</span>
                <Input
                  type="number"
                  min={1}
                  max={totalPages}
                  className="h-9 w-16 text-center"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const val = parseInt((e.target as HTMLInputElement).value);
                      if (val >= 1 && val <= totalPages) {
                        setPage(val);
                        (e.target as HTMLInputElement).value = "";
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </Card>

      <PostModal post={selectedPost} open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}
