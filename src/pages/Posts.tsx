import { useEffect, useState, useMemo } from "react";
import { Search, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { getPosts, type Post } from "@/services/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PAGE_SIZE = 10;
type PlatformFilter = "all" | "twitter" | "instagram";

export default function Posts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [search, setSearch] = useState("");
  const [minLikes, setMinLikes] = useState("");
  const [hasLink, setHasLink] = useState(false);
  const [platform, setPlatform] = useState<PlatformFilter>("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    getPosts().then(setPosts);
  }, []);

  const filtered = useMemo(() => {
    let result = posts;
    if (platform !== "all") result = result.filter((p) => p.platform === platform);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.username.toLowerCase().includes(q));
    }
    if (minLikes) {
      const min = parseInt(minLikes, 10);
      if (!isNaN(min)) result = result.filter((p) => p.likes >= min);
    }
    if (hasLink) result = result.filter((p) => p.link !== null);
    return result;
  }, [posts, search, minLikes, hasLink, platform]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => setPage(1), [search, minLikes, hasLink, platform]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Posts Viewer</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Browse and filter scraped posts ({filtered.length} results)
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="w-[160px]">
          <label className="text-xs text-muted-foreground mb-1.5 block">Platform</label>
          <Select value={platform} onValueChange={(v) => setPlatform(v as PlatformFilter)}>
            <SelectTrigger className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="twitter">Twitter</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs text-muted-foreground mb-1.5 block">Search by username</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="@username..." className="pl-9 bg-background" />
          </div>
        </div>
        <div className="w-[140px]">
          <label className="text-xs text-muted-foreground mb-1.5 block">Min. Likes</label>
          <Input type="number" value={minLikes} onChange={(e) => setMinLikes(e.target.value)} placeholder="0" className="bg-background" />
        </div>
        <div className="flex items-center gap-2 pb-0.5">
          <Switch checked={hasLink} onCheckedChange={setHasLink} />
          <label className="text-xs text-muted-foreground">Has link</label>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left font-medium text-muted-foreground px-5 py-3">Platform</th>
                <th className="text-left font-medium text-muted-foreground px-5 py-3">Username</th>
                <th className="text-left font-medium text-muted-foreground px-5 py-3">Caption</th>
                <th className="text-right font-medium text-muted-foreground px-5 py-3">Likes</th>
                <th className="text-right font-medium text-muted-foreground px-5 py-3">Comments</th>
                <th className="text-left font-medium text-muted-foreground px-5 py-3">Link</th>
                <th className="text-left font-medium text-muted-foreground px-5 py-3">Scraped At</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((post) => (
                <tr key={post.id} className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors">
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${post.platform === "twitter" ? "bg-primary/15 text-primary" : "bg-accent text-accent-foreground"}`}>
                      {post.platform === "twitter" ? "Twitter" : "Instagram"}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-primary">{post.username}</td>
                  <td className="px-5 py-3 text-card-foreground max-w-[250px] truncate">{post.caption}</td>
                  <td className="px-5 py-3 text-right text-card-foreground">{post.likes.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right text-card-foreground">{post.comments}</td>
                  <td className="px-5 py-3">
                    {post.link ? (
                      <a href={post.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary text-xs hover:underline">
                        <ExternalLink className="h-3 w-3" /> View
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground text-xs font-mono">{new Date(post.scrapedAt).toLocaleString()}</td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground text-sm">No posts found matching your filters.</td>
                </tr>
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
    </div>
  );
}
