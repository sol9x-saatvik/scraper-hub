import { useEffect, useState, useCallback } from "react";
import { Search, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import {
  type ViewType,
  type AllPost,
  type InstaExplorePost,
  type InstaSearchPost,
  type InstaProfilePost,
  type TwitterHomePost,
  type TwitterSearchPost,
  type TwitterProfilePost,
  getAllPosts,
  getInstaExplorePosts,
  getInstaSearchPosts,
  getInstaProfilePosts,
  getTwitterHomePosts,
  getTwitterSearchPosts,
  getTwitterProfilePosts,
} from "@/services/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PostModal from "@/components/posts/PostModal";

const PAGE_SIZE = 10;

type AnyPost = AllPost | InstaExplorePost | InstaSearchPost | InstaProfilePost | TwitterHomePost | TwitterSearchPost | TwitterProfilePost;

const VIEW_LABELS: Record<ViewType, string> = {
  all: "All",
  "instagram-explore": "Instagram Explore",
  "instagram-search": "Instagram Search",
  "instagram-profile": "Instagram Profile",
  "twitter-home": "Twitter Home",
  "twitter-search": "Twitter Search",
  "twitter-profile": "Twitter Profile",
};

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
};

function truncateWords(text: string, maxWords = 8): string {
  const words = text.split(" ");
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ") + "...";
}

export default function Posts() {
  const [viewType, setViewType] = useState<ViewType>("all");
  const [posts, setPosts] = useState<AnyPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [minLikes, setMinLikes] = useState("");
  const [page, setPage] = useState(1);
  const [selectedPost, setSelectedPost] = useState<Record<string, any> | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = {
      search: search || undefined,
      minLikes: minLikes ? parseInt(minLikes, 10) : undefined,
    };
    try {
      let data: AnyPost[];
      switch (viewType) {
        case "all": data = await getAllPosts(params); break;
        case "instagram-explore": data = await getInstaExplorePosts(params); break;
        case "instagram-search": data = await getInstaSearchPosts(params); break;
        case "instagram-profile": data = await getInstaProfilePosts(params); break;
        case "twitter-home": data = await getTwitterHomePosts(params); break;
        case "twitter-search": data = await getTwitterSearchPosts(params); break;
        case "twitter-profile": data = await getTwitterProfilePosts(params); break;
        default: data = [];
      }
      setPosts(data);
    } catch {
      setError("Failed to fetch posts. Make sure the backend is running.");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [viewType, search, minLikes]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);
  useEffect(() => setPage(1), [viewType, search, minLikes]);

  const totalPages = Math.ceil(posts.length / PAGE_SIZE);
  const paginated = posts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const columns = COLUMNS[viewType];

  const getCellValue = (post: AnyPost, key: string): string | number => {
    if (key === "_viewPost") return "";

    // For "all" view: if source is PROFILE, show profile in keyword column
    if (key === "keyword" && viewType === "all") {
      const p = post as AllPost;
      if (p.source === "Profile" || p.source === ("PROFILE" as any)) {
        return (post as any).profile ?? p.keyword ?? "—";
      }
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
    setSelectedPost(post as unknown as Record<string, any>);
    setModalOpen(true);
  };

  const getPostUrl = (post: AnyPost): string => {
    return (post as any).url ?? "";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Posts Viewer</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Browse scraped posts ({posts.length} results)
        </p>
      </div>

      {/* Filters */}
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
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs text-muted-foreground mb-1.5 block">Search by username</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="pl-9 bg-background" />
          </div>
        </div>
        <div className="w-[140px]">
          <label className="text-xs text-muted-foreground mb-1.5 block">Min. Likes</label>
          <Input type="number" value={minLikes} onChange={(e) => setMinLikes(e.target.value)} placeholder="0" className="bg-background" />
        </div>
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
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`${col.align === "right" ? "text-right" : "text-left"} font-medium text-muted-foreground px-5 py-3`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="px-5 py-12 text-center text-muted-foreground text-sm">Loading...</td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-5 py-12 text-center text-muted-foreground text-sm">
                    {error ? "No data available." : "No posts found."}
                  </td>
                </tr>
              ) : (
                paginated.map((post, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => handleRowClick(post)}
                  >
                    {columns.map((col) => {
                      if (col.key === "_viewPost") {
                        const url = getPostUrl(post);
                        return (
                          <td key={col.key} className="px-5 py-3 text-center">
                            {url ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(url, "_blank", "noopener,noreferrer");
                                }}
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
                      const displayVal = isContentCol(col.key) && typeof val === "string"
                        ? truncateWords(val)
                        : val;

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
                              val === "Instagram" ? "bg-accent text-accent-foreground" : "bg-primary/15 text-primary"
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
                ))
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
