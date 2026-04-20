import { useEffect, useState, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { Search, ChevronLeft, ChevronRight, ExternalLink, ChevronDown, Sparkles, Loader2 } from "lucide-react";
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
import PostModal from "@/components/posts/PostModal";
import { useScraperContext } from "@/context/ScraperContext";

const PAGE_SIZE = 10;

type AnyPost = AllPost | InstaExplorePost | InstaSearchPost | InstaProfilePost | TwitterHomePost | TwitterSearchPost | TwitterProfilePost | FacebookExplorePost | FacebookSearchPost | FacebookProfilePost | RedditHomePost | RedditSearchPost | WebSearchPost;

const VIEW_LABELS: Record<ViewType, string> = {
  all: "All",
  "instagram-explore": "Instagram Explore",
  "instagram-search": "Instagram Search",
  "instagram-profile": "Instagram Profile",
  "twitter-home": "Twitter Home",
  "twitter-search": "Twitter Search",
  "twitter-profile": "Twitter Profile",
  "facebook-explore": "Facebook Explore",
  "facebook-search": "Facebook Search",
  "facebook-profile": "Facebook Profile",
  "reddit-home": "Reddit Home",
  "reddit-search": "Reddit Search",
  "web-search": "Web Search",
};

const KEYWORD_VIEWS: ViewType[] = ["all", "instagram-search", "twitter-search", "facebook-search", "reddit-search", "web-search"];

const COLUMNS: Record<ViewType, { key: string; label: string; align?: "right" }[]> = {
  all: [
    { key: "platform", label: "Platform" },
    { key: "source", label: "Source" },
    { key: "keyword", label: "Keyword" },
    { key: "user", label: "User" },
    { key: "content", label: "Content" },
    { key: "likes", label: "Likes", align: "right" },
    { key: "date", label: "Date" },
    { key: "time", label: "Time" },
    { key: "_viewPost", label: "View Post" },
  ],
  "instagram-explore": [
    { key: "username", label: "Username" },
    { key: "caption", label: "Caption" },
    { key: "likes", label: "Likes", align: "right" },
    { key: "date", label: "Date" },
    { key: "time", label: "Time" },
    { key: "_viewPost", label: "View Post" },
  ],
  "instagram-search": [
    { key: "keyword", label: "Keyword" },
    { key: "username", label: "Username" },
    { key: "caption", label: "Caption" },
    { key: "likes", label: "Likes", align: "right" },
    { key: "date", label: "Date" },
    { key: "time", label: "Time" },
    { key: "_viewPost", label: "View Post" },
  ],
  "instagram-profile": [
    { key: "profile", label: "Profile" },
    { key: "username", label: "Username" },
    { key: "caption", label: "Caption" },
    { key: "likes", label: "Likes", align: "right" },
    { key: "date", label: "Date" },
    { key: "time", label: "Time" },
    { key: "_viewPost", label: "View Post" },
  ],
  "twitter-home": [
    { key: "name", label: "Name" },
    { key: "handle", label: "Handle" },
    { key: "tweet", label: "Tweet" },
    { key: "likes", label: "Likes", align: "right" },
    { key: "reposts", label: "Reposts", align: "right" },
    { key: "replies", label: "Replies", align: "right" },
    { key: "views", label: "Views", align: "right" },
    { key: "date", label: "Date" },
    { key: "time", label: "Time" },
    { key: "_viewPost", label: "View Post" },
  ],
  "twitter-search": [
    { key: "keyword", label: "Keyword" },
    { key: "name", label: "Name" },
    { key: "handle", label: "Handle" },
    { key: "tweet", label: "Tweet" },
    { key: "likes", label: "Likes", align: "right" },
    { key: "reposts", label: "Reposts", align: "right" },
    { key: "replies", label: "Replies", align: "right" },
    { key: "views", label: "Views", align: "right" },
    { key: "date", label: "Date" },
    { key: "time", label: "Time" },
    { key: "_viewPost", label: "View Post" },
  ],
  "twitter-profile": [
    { key: "profile", label: "Profile" },
    { key: "name", label: "Name" },
    { key: "handle", label: "Handle" },
    { key: "tweet", label: "Tweet" },
    { key: "likes", label: "Likes", align: "right" },
    { key: "reposts", label: "Reposts", align: "right" },
    { key: "replies", label: "Replies", align: "right" },
    { key: "views", label: "Views", align: "right" },
    { key: "date", label: "Date" },
    { key: "time", label: "Time" },
    { key: "_viewPost", label: "View Post" },
  ],
  "facebook-explore": [
    { key: "username", label: "Username" },
    { key: "caption", label: "Caption" },
    { key: "likes", label: "Likes", align: "right" },
    { key: "date", label: "Date" },
    { key: "time", label: "Time" },
    { key: "_viewPost", label: "View Post" },
  ],
  "facebook-search": [
    { key: "keyword", label: "Keyword" },
    { key: "username", label: "Username" },
    { key: "caption", label: "Caption" },
    { key: "likes", label: "Likes", align: "right" },
    { key: "date", label: "Date" },
    { key: "time", label: "Time" },
    { key: "_viewPost", label: "View Post" },
  ],
  "facebook-profile": [
    { key: "profile", label: "Profile" },
    { key: "username", label: "Username" },
    { key: "caption", label: "Caption" },
    { key: "likes", label: "Likes", align: "right" },
    { key: "date", label: "Date" },
    { key: "time", label: "Time" },
    { key: "_viewPost", label: "View Post" },
  ],
  "reddit-home": [
    { key: "subreddit", label: "Subreddit" },
    { key: "username", label: "Username" },
    { key: "title", label: "Title" },
    { key: "upvotes", label: "Upvotes", align: "right" },
    { key: "comments", label: "Comments", align: "right" },
    { key: "date", label: "Date" },
    { key: "time", label: "Time" },
    { key: "_viewPost", label: "View Post" },
  ],
  "reddit-search": [
    { key: "keyword", label: "Keyword" },
    { key: "subreddit", label: "Subreddit" },
    { key: "username", label: "Username" },
    { key: "title", label: "Title" },
    { key: "upvotes", label: "Upvotes", align: "right" },
    { key: "comments", label: "Comments", align: "right" },
    { key: "date", label: "Date" },
    { key: "time", label: "Time" },
    { key: "_viewPost", label: "View Post" },
  ],
  "web-search": [
    { key: "title", label: "Title" },
    { key: "keyword", label: "Keyword" },
    { key: "engine", label: "Engine" },
    { key: "status", label: "Status" },
    { key: "snippet", label: "Snippet" },
    { key: "scrapedAt", label: "Scraped At" },
  ],
};

function truncateWords(text: string, maxWords = 8): string {
  const words = text.split(" ");
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ") + "...";
}

function truncateChars(text: string, maxChars = 100): string {
  if (!text || text.length <= maxChars) return text;
  return text.slice(0, maxChars) + "...";
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

export default function Posts() {
  const location = useLocation();
  const { state, analyzeAllPosts, getPostAnalysis } = useScraperContext();
  const { isAnalyzing, analysisProgress } = state;

  const [viewType, setViewType] = useState<ViewType>("all");
  const [rawPosts, setRawPosts] = useState<AnyPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [search, setSearch] = useState((location.state as any)?.search ?? "");
  const [minLikesInput, setMinLikesInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState((location.state as any)?.search ?? "");
  const [appliedMinLikes, setAppliedMinLikes] = useState(0);
  const [selectedKeyword, setSelectedKeyword] = useState<string>("all");

  const [page, setPage] = useState(1);
  const [selectedPost, setSelectedPost] = useState<Record<string, any> | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Row selection state (keyed by derived post ID, so cross-page selection works)
  const [selectedPostIds, setSelectedPostIds] = useState<Set<string>>(new Set());

  // Fetch raw posts
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
      setRawPosts(data);
    } catch {
      setError("Failed to fetch posts. Make sure the backend is running.");
      setRawPosts([]);
    } finally {
      setLoading(false);
    }
  }, [viewType]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  // Reset filters + selection when view changes
  useEffect(() => {
    setPage(1);
    setSelectedKeyword("all");
    setSelectedPostIds(new Set());
  }, [viewType]);

  // Extract unique keywords from loaded posts
  const availableKeywords = useMemo(() => {
    if (!KEYWORD_VIEWS.includes(viewType)) return [];
    const kws = new Set<string>();
    for (const post of rawPosts) {
      const kw = getPostKeyword(post);
      if (kw && kw !== "—") kws.add(kw);
    }
    return Array.from(kws).sort();
  }, [rawPosts, viewType]);

  // Client-side filtering
  const posts = useMemo(() => {
    let filtered = rawPosts;

    if (appliedSearch.trim()) {
      const term = appliedSearch.trim().toLowerCase();
      if (viewType === "web-search") {
        filtered = filtered.filter((post) => {
          const p = post as any;
          return (p.keyword ?? "").toLowerCase().includes(term);
        });
      } else {
        filtered = filtered.filter((post) => {
          const p = post as any;
          const user = (p.user ?? p.username ?? p.handle ?? "").toLowerCase();
          return user.includes(term);
        });
      }
    }

    if (appliedMinLikes > 0 && viewType !== "web-search") {
      filtered = filtered.filter((post) => {
        const p = post as any;
        const likes = typeof p.likes === "number" ? p.likes : parseFloat(p.likes) || 0;
        return likes >= appliedMinLikes;
      });
    }

    if (selectedKeyword !== "all" && KEYWORD_VIEWS.includes(viewType)) {
      filtered = filtered.filter((post) => {
        const kw = getPostKeyword(post);
        return kw === selectedKeyword;
      });
    }

    return filtered;
  }, [rawPosts, appliedSearch, appliedMinLikes, selectedKeyword, viewType]);

  const applyFilters = () => {
    setAppliedSearch(search);
    setAppliedMinLikes(minLikesInput ? parseInt(minLikesInput, 10) : 0);
    setPage(1);
    setSelectedPostIds(new Set());
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") applyFilters();
  };

  const totalPages = Math.ceil(posts.length / PAGE_SIZE);
  const paginated = posts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const columns = COLUMNS[viewType];
  const hasKeywordCol = KEYWORD_VIEWS.includes(viewType);
  const isWebSearch = viewType === "web-search";

  // ── Row selection helpers ───────────────────────────────────────────────────
  const paginatedIds = useMemo(() => paginated.map(derivePostId), [paginated]);
  const selectedPosts = useMemo(
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
      setSelectedPostIds(new Set());
    } else {
      setSelectedPostIds(new Set(paginatedIds));
    }
  };

  // ── Analysis handlers ───────────────────────────────────────────────────────
  const handleAnalyzeSelected = async () => {
    const count = selectedPosts.length;
    await analyzeAllPosts(selectedPosts as unknown as AllPost[]);
    setSelectedPostIds(new Set());
    toast.success(`Analysis complete — ${count} posts analyzed`);
  };

  const handleAnalyzeAll = async () => {
    const count = posts.length;
    await analyzeAllPosts(posts as unknown as AllPost[]);
    setSelectedPostIds(new Set());
    toast.success(`Analysis complete — ${count} posts analyzed`);
  };

  // ── Table helpers ───────────────────────────────────────────────────────────
  const getCellValue = (post: AnyPost, key: string): string | number => {
    if (key === "_viewPost") return "";

    if (key === "keyword" && (viewType === "all" || viewType === "instagram-search" || viewType === "twitter-search")) {
      const p = post as any;
      if (p.source === "Profile" || p.source === "PROFILE") return p.profile ?? "—";
      return p.keyword ?? "—";
    }

    const val = (post as unknown as Record<string, unknown>)[key];
    if (val === null || val === undefined) return "—";
    if (typeof val === "number") return val;
    return String(val);
  };

  const isContentCol = (key: string) => key === "content" || key === "caption" || key === "tweet";
  const isUserCol = (key: string) => key === "username" || key === "handle" || key === "user";

  const handleRowClick = (post: AnyPost) => {
    if (isWebSearch) return;
    const p = post as any;
    if (!p.platform) {
      if (viewType.startsWith("twitter")) p.platform = "Twitter";
      else if (viewType.startsWith("instagram")) p.platform = "Instagram";
      else if (viewType.startsWith("facebook")) p.platform = "Facebook";
      else if (viewType.startsWith("reddit")) p.platform = "Reddit";
    }
    setSelectedPost(p);
    setModalOpen(true);
  };

  const getPostUrl = (post: AnyPost): string => (post as any).url ?? "";

  const statusBadge = (status: string) => {
    const base = "text-xs font-medium px-2 py-0.5 rounded-full";
    if (status === "SUCCESS") return <span className={`${base} bg-green-500/15 text-green-600`}>SUCCESS</span>;
    if (status === "BLOCKED") return <span className={`${base} bg-yellow-500/15 text-yellow-600`}>BLOCKED</span>;
    return <span className={`${base} bg-destructive/15 text-destructive`}>FAILED</span>;
  };

  const AnalysisDot = ({ post }: { post: AnyPost }) => {
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
    if (!analysis) return <span className="h-2 w-2 rounded-full bg-muted-foreground/30 inline-block" title="Not analyzed" />;
    if (analysis.isHarmful) return <span className="h-2 w-2 rounded-full bg-destructive inline-block" title="Analyzed — harmful" />;
    return <span className="h-2 w-2 rounded-full bg-green-500 inline-block" title="Analyzed — clean" />;
  };

  // Extra col count for non-web-search: checkbox + analysis dot
  const extraCols = isWebSearch ? 0 : 2;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Posts Viewer</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Browse scraped posts ({posts.length} of {rawPosts.length} results)
        </p>
      </div>

      {/* Filters + Analysis toolbar */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="w-[200px]">
          <label className="text-xs text-muted-foreground mb-1.5 block">View Type</label>
          <Select value={viewType} onValueChange={(v) => setViewType(v as ViewType)}>
            <SelectTrigger className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(VIEW_LABELS).map(([val, label]) => (
                <SelectItem key={val} value={val}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[180px]">
          <label className="text-xs text-muted-foreground mb-1.5 block">
            {isWebSearch ? "Search by keyword" : "Search by username"}
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder={isWebSearch ? "Search keyword..." : "Search username..."}
              className="pl-9 bg-background"
            />
          </div>
        </div>

        {!isWebSearch && (
          <div className="w-[130px]">
            <label className="text-xs text-muted-foreground mb-1.5 block">Min. Likes</label>
            <Input
              type="number"
              value={minLikesInput}
              onChange={(e) => setMinLikesInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="0"
              className="bg-background"
            />
          </div>
        )}

        <Button onClick={applyFilters} className="self-end">Apply</Button>

        {(appliedSearch || appliedMinLikes > 0) && (
          <Button
            variant="ghost"
            className="self-end text-muted-foreground"
            onClick={() => {
              setSearch("");
              setMinLikesInput("");
              setAppliedSearch("");
              setAppliedMinLikes(0);
              setPage(1);
              setSelectedPostIds(new Set());
            }}
          >
            Clear
          </Button>
        )}

        {/* AI Analysis buttons — only for non-web-search views */}
        {!isWebSearch && (
          <>
            {/* Analyze Selected */}
            <Button
              className="self-end gap-1.5"
              disabled={isAnalyzing || selectedPosts.length === 0}
              onClick={handleAnalyzeSelected}
            >
              <Sparkles className="h-4 w-4" />
              Analyze Selected{selectedPosts.length > 0 ? ` (${selectedPosts.length})` : ""}
            </Button>

            {/* Analyze All — with confirmation dialog */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="self-end gap-1.5"
                  disabled={isAnalyzing || posts.length === 0}
                >
                  <Sparkles className="h-4 w-4" />
                  Analyze All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Analyze All Posts?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will analyze {posts.length} posts and may take several minutes. Continue?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleAnalyzeAll}>Continue</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Progress indicator */}
            {isAnalyzing && (
              <span className="self-center flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {analysisProgress.rateLimited
                  ? "Rate limited, waiting 60s..."
                  : `Analyzing... (${analysisProgress.current}/${analysisProgress.total})`}
              </span>
            )}
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {/* Checkbox + analysis dot headers (non-web-search only) */}
                {!isWebSearch && (
                  <>
                    <th className="px-3 py-3 w-10">
                      <Checkbox
                        checked={paginatedIds.length > 0 && paginatedIds.every((id) => selectedPostIds.has(id))}
                        data-indeterminate={paginatedIds.some((id) => selectedPostIds.has(id)) && !paginatedIds.every((id) => selectedPostIds.has(id))}
                        onCheckedChange={toggleAllOnPage}
                        disabled={isAnalyzing || paginatedIds.length === 0}
                        aria-label="Select all on page"
                      />
                    </th>
                    <th className="px-2 py-3 w-8" />
                  </>
                )}
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`${col.align === "right" ? "text-right" : "text-left"} font-medium text-muted-foreground px-5 py-3`}
                  >
                    {col.key === "keyword" && hasKeywordCol && availableKeywords.length > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <span>Keyword</span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="inline-flex items-center gap-0.5 text-xs rounded px-1 py-0.5 hover:bg-accent transition-colors">
                              {selectedKeyword === "all" ? "All" : selectedKeyword}
                              <ChevronDown className="h-3 w-3" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="max-h-60 overflow-y-auto">
                            <DropdownMenuLabel className="text-xs">Filter by keyword</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => { setSelectedKeyword("all"); setPage(1); }}>
                              All keywords
                            </DropdownMenuItem>
                            {availableKeywords.map((kw) => (
                              <DropdownMenuItem key={kw} onClick={() => { setSelectedKeyword(kw); setPage(1); }}>
                                {kw}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ) : (
                      col.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length + extraCols} className="px-5 py-12 text-center text-muted-foreground text-sm">Loading...</td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + extraCols} className="px-5 py-12 text-center text-muted-foreground text-sm">
                    {error ? "No data available." : "No posts found."}
                  </td>
                </tr>
              ) : isWebSearch ? (
                // ── Web Search rows (no checkbox/badge) ───────────────────────
                paginated.map((post, idx) => {
                  const p = post as WebSearchPost;
                  return (
                    <tr key={idx} className="border-b border-border last:border-0">
                      <td className="px-5 py-3 max-w-[280px]">
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1.5 text-xs font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {p.title || p.url}
                          <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                        </a>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/15 text-primary">{p.keyword}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{p.engine || "—"}</span>
                      </td>
                      <td className="px-5 py-3">{statusBadge(p.status)}</td>
                      <td className="px-5 py-3 max-w-[300px] text-muted-foreground text-xs">{truncateChars(p.snippet, 100)}</td>
                      <td className="px-5 py-3 text-xs text-muted-foreground font-mono whitespace-nowrap">
                        {p.scrapedAt ? new Date(p.scrapedAt).toLocaleString() : "—"}
                      </td>
                    </tr>
                  );
                })
              ) : (
                // ── Standard rows ─────────────────────────────────────────────
                paginated.map((post, idx) => {
                  const postId = derivePostId(post);
                  return (
                    <tr
                      key={idx}
                      className={`border-b border-border last:border-0 hover:bg-accent/50 transition-colors cursor-pointer ${selectedPostIds.has(postId) ? "bg-accent/30" : ""}`}
                      onClick={() => handleRowClick(post)}
                    >
                      {/* Checkbox */}
                      <td
                        className="px-3 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={selectedPostIds.has(postId)}
                          onCheckedChange={() => toggleRow(postId)}
                          disabled={isAnalyzing}
                          aria-label="Select row"
                        />
                      </td>

                      {/* Analysis dot */}
                      <td className="px-2 py-3 text-center">
                        <AnalysisDot post={post} />
                      </td>

                      {columns.map((col) => {
                        if (col.key === "_viewPost") {
                          const url = getPostUrl(post);
                          return (
                            <td key={col.key} className="px-5 py-3 text-center">
                              {url ? (
                                <button
                                  onClick={(e) => { e.stopPropagation(); window.open(url, "_blank", "noopener,noreferrer"); }}
                                  className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </button>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                          );
                        }

                        const val = getCellValue(post, col.key);
                        const displayVal = isContentCol(col.key) && typeof val === "string" ? truncateWords(val) : val;

                        return (
                          <td
                            key={col.key}
                            className={`px-5 py-3 ${col.align === "right" ? "text-right" : ""} ${
                              isContentCol(col.key)
                                ? "max-w-[250px] text-card-foreground"
                                : isUserCol(col.key)
                                ? "font-mono text-xs text-primary"
                                : "text-card-foreground"
                            }`}
                          >
                            {col.key === "platform" ? (
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                val === "Instagram" ? "bg-accent text-accent-foreground" :
                                val === "Twitter" ? "bg-primary/15 text-primary" :
                                val === "Facebook" ? "bg-blue-500/15 text-blue-500" :
                                "bg-orange-500/15 text-orange-500"
                              }`}>
                                {val}
                              </span>
                            ) : typeof displayVal === "number" ? (
                              displayVal.toLocaleString()
                            ) : (
                              displayVal
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <PostModal post={selectedPost} open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}
