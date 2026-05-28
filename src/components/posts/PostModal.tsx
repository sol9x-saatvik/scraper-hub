import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ExternalLink, Copy, ShieldAlert, X, Maximize2, Flag, FlagOff, Sparkles, Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useMonitoredUsers } from "@/hooks/useMonitoredUsers";
import { useScraperContext } from "@/context/ScraperContext";
import type { AllPost } from "@/services/api";
import type { FlaggedPost } from "@/pages/UserMonitoring";

function loadFlaggedPosts(): FlaggedPost[] {
  try { return JSON.parse(localStorage.getItem(accountStorageKey("flaggedPosts")) ?? "[]"); } catch { return []; }
}
function saveFlaggedPosts(posts: FlaggedPost[]): void {
  localStorage.setItem(accountStorageKey("flaggedPosts"), JSON.stringify(posts));
}

function accountStorageKey(baseKey: string): string {
  try {
    const user = JSON.parse(localStorage.getItem("user") ?? "{}");
    return user?.id ? `${baseKey}_${user.id}` : baseKey;
  } catch {
    return baseKey;
  }
}

interface PostModalProps {
  post: Record<string, any> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SENTIMENT_STYLES: Record<string, string> = {
  Positive: "bg-green-500/15 text-green-600",
  Negative: "bg-destructive/15 text-destructive",
  Neutral: "bg-secondary text-secondary-foreground",
  Angry: "bg-orange-500/15 text-orange-600",
};

const SEVERITY_STYLES: Record<string, string> = {
  Low: "bg-yellow-500/15 text-yellow-700",
  Medium: "bg-orange-500/15 text-orange-600",
  High: "bg-destructive/15 text-destructive",
  None: "bg-secondary text-secondary-foreground",
};

export default function PostModal({ post, open, onOpenChange }: PostModalProps) {
  const [alreadyMonitored, setAlreadyMonitored] = useState(false);
  const [lightbox, setLightbox] = useState<{ type: "image" | "video"; src: string } | null>(null);
  const [analyzingThisPost, setAnalyzingThisPost] = useState(false);
  const { addUser } = useMonitoredUsers();
  const { analyzePost, getPostAnalysis } = useScraperContext();

  // Flag state
  const postKey = `${post?.user ?? post?.handle ?? ""}|${post?.url ?? ""}|${post?.date ?? ""}`;
  const [isFlagged, setIsFlagged] = useState(() => loadFlaggedPosts().some((fp) => fp.id === postKey));

  const toggleFlag = () => {
    const current = loadFlaggedPosts();
    if (isFlagged) {
      saveFlaggedPosts(current.filter((fp) => fp.id !== postKey));
      setIsFlagged(false);
      toast.success("Post unflagged");
    } else {
      const platform: "Instagram" | "Twitter" = (post?.platform === "Twitter" || !!post?.handle) ? "Twitter" : "Instagram";
      const newEntry: FlaggedPost = {
        id: postKey,
        platform,
        user: post?.user ?? post?.handle ?? post?.username ?? "unknown",
        content: post?.content ?? post?.caption ?? post?.tweet ?? "",
        url: post?.url,
        date: post?.date,
        time: post?.time,
        source: post?.source,
        flaggedAt: new Date().toISOString(),
      };
      saveFlaggedPosts([...current, newEntry]);
      setIsFlagged(true);
      toast.success("Post flagged — visible in User Monitoring > Flagged Posts");
    }
  };

  if (!post) return null;

  const platform: string =
    post.platform ??
    (post.handle || post.tweet !== undefined ? "Twitter" : "Instagram");
  const isWeb = platform === "Web" || post.scrapedContent !== undefined || post.scrapedAt !== undefined;
  const source: string = post.source ?? "—";
  const keyword: string =
    source === "Profile" || source === "PROFILE"
      ? post.profile ?? "—"
      : post.keyword ?? "—";
  const user: string = post.user ?? post.username ?? post.handle ?? "—";
  const content: string = post.content ?? post.caption ?? post.tweet ?? post.title ?? "—";
  const url: string = post.url ?? "";
  const screenshotPath: string | null =
    post.screenshot_path && post.screenshot_path !== "null" ? post.screenshot_path : null;
  const videoPath: string | null =
    post.video_path && post.video_path !== "null" ? post.video_path : null;
  const isTwitter = platform === "Twitter" || !!post.handle;
  const isReddit = platform === "Reddit";

  // Build a normalized AllPost for analysis lookups
  const postForAnalysis: AllPost = {
    platform: platform as any,
    source: source as any,
    keyword: keyword !== "—" ? keyword : null,
    user,
    content,
    likes: post.likes ?? 0,
    date: post.date ?? "",
    time: post.time ?? "",
  };

  const analysis = getPostAnalysis(postForAnalysis);

  const copyUrl = () => {
    if (url) {
      navigator.clipboard.writeText(url);
      toast.success("URL copied to clipboard");
    }
  };

  const handleAddToMonitoring = async () => {
    try {
      await addUser({
        username: user === "—" ? "unknown" : user,
        platform: (["Twitter", "Facebook", "Reddit"].includes(platform) ? platform : "Instagram") as "Instagram" | "Twitter",
        status: "Suspected",
        addedFrom: "PostFlag",
        harmfulRating: 1,
      });
      toast.success(`${user} added to monitoring`);
    } catch (err: any) {
      if (err?.status === 409) {
        setAlreadyMonitored(true);
      } else {
        toast.error("Failed to add to monitoring");
      }
    }
  };

  const handleAnalyzeThisPost = async () => {
    setAnalyzingThisPost(true);
    try {
      await analyzePost(postForAnalysis);
    } finally {
      setAnalyzingThisPost(false);
    }
  };

  return (
    <>
      {/* Lightbox overlay */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 z-[101] rounded-full bg-black/60 p-2 text-white hover:bg-black/80 transition-colors"
            onClick={() => setLightbox(null)}
          >
            <X className="h-5 w-5" />
          </button>
          <div
            className="max-w-[90vw] max-h-[90vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {lightbox.type === "image" ? (
              <img
                src={lightbox.src}
                alt="Full size screenshot"
                className="max-w-full max-h-[90vh] rounded-lg object-contain shadow-2xl"
              />
            ) : (
              <video
                src={lightbox.src}
                controls
                autoPlay
                className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"
              />
            )}
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Post Details</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="details">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
              <TabsTrigger value="ai-analysis" className="flex-1 gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                AI Analysis
              </TabsTrigger>
            </TabsList>

            {/* ── Details Tab ── */}
            <TabsContent value="details">
              <div className="space-y-4">
                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  <span className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full",
                    platform === "Twitter" ? "bg-primary/15 text-primary" :
                    platform === "Web" ? "bg-emerald-500/15 text-emerald-600" :
                    platform === "Facebook" ? "bg-blue-500/15 text-blue-500" :
                    platform === "Reddit" ? "bg-orange-500/15 text-orange-500" :
                    "bg-accent text-accent-foreground"
                  )}>
                    {platform}
                  </span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                    {source}
                  </span>
                </div>

                {/* Info rows */}
                <div className="space-y-2 text-sm">
                  <Row label="Keyword / Profile" value={keyword} />
                  {isWeb && post.title && <Row label="Title" value={post.title} />}
                  <Row label={isWeb ? "Website" : "User"} value={user} mono />
                  {isWeb && post.engine && <Row label="Engine" value={post.engine} />}
                  {isWeb && post.status && <Row label="Status" value={post.status} />}
                  <Row label="Date" value={`${post.date ?? "—"} ${post.time ?? ""}`} />
                </div>

                {isWeb && post.snippet && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Search Snippet</p>
                    <p className="text-sm text-card-foreground leading-relaxed whitespace-pre-wrap">{post.snippet}</p>
                  </div>
                )}

                {/* Content */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{isWeb ? "Scraped Content" : "Content"}</p>
                  <p className="text-sm text-card-foreground leading-relaxed whitespace-pre-wrap">{content}</p>
                </div>

                {/* Engagement */}
                {!isWeb && <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {isReddit ? (
                    <>
                      <Stat label="Upvotes" value={post.upvotes} />
                      <Stat label="Comments" value={post.comments} />
                    </>
                  ) : (
                    <Stat label="Likes" value={post.likes} />
                  )}
                  {isTwitter && (
                    <>
                      <Stat label="Reposts" value={post.reposts} />
                      <Stat label="Replies" value={post.replies} />
                      <Stat label="Views" value={post.views} />
                    </>
                  )}
                </div>}

                {/* Video */}
                {videoPath && (
                  <div className="relative group cursor-pointer" onClick={() => setLightbox({ type: "video", src: `http://localhost:8081/${videoPath}` })}>
                    <video
                      src={`http://localhost:8081/${videoPath}`}
                      className="rounded-xl border border-border w-full pointer-events-none"
                    />
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Maximize2 className="h-8 w-8 text-white drop-shadow" />
                    </div>
                  </div>
                )}

                {/* Screenshot */}
                {!videoPath && screenshotPath && (
                  <div
                    className="relative group cursor-pointer"
                    onClick={() => setLightbox({ type: "image", src: `http://localhost:8081/${screenshotPath}` })}
                  >
                    <img
                      src={`http://localhost:8081/${screenshotPath}`}
                      alt="Post screenshot"
                      className="rounded-xl border border-border w-full object-contain"
                    />
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Maximize2 className="h-8 w-8 text-white drop-shadow" />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {url && (
                    <>
                      <Button size="sm" asChild>
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> {isWeb ? "Go To Website" : "Go To Post"}
                        </a>
                      </Button>
                      <Button size="sm" variant="outline" onClick={copyUrl}>
                        <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy URL
                      </Button>
                    </>
                  )}
                  {!isWeb && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={alreadyMonitored}
                        onClick={handleAddToMonitoring}
                        className={cn(alreadyMonitored && "opacity-60 cursor-not-allowed")}
                      >
                        <ShieldAlert className="h-3.5 w-3.5 mr-1.5" />
                        {alreadyMonitored ? "Already Monitored" : "Add to Monitoring"}
                      </Button>
                      <Button
                        size="sm"
                        variant={isFlagged ? "default" : "outline"}
                        onClick={toggleFlag}
                        className={cn(isFlagged && "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border-yellow-500/40")}
                      >
                        {isFlagged ? <FlagOff className="h-3.5 w-3.5 mr-1.5" /> : <Flag className="h-3.5 w-3.5 mr-1.5" />}
                        {isFlagged ? "Unflag Post" : "Flag Post"}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* ── AI Analysis Tab ── */}
            <TabsContent value="ai-analysis">
              {analysis ? (
                <div className="space-y-4">
                  {/* Sentiment */}
                  <div className="rounded-lg border border-border bg-background p-3 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sentiment</p>
                    <div className="flex items-center gap-3">
                      <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", SENTIMENT_STYLES[analysis.sentiment] ?? SENTIMENT_STYLES.Neutral)}>
                        {analysis.sentiment}
                      </span>
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${analysis.sentimentScore}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-7 text-right">{analysis.sentimentScore}</span>
                    </div>
                  </div>

                  {/* Harmful Content */}
                  {analysis.isHarmful ? (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                        <span className="text-sm font-medium text-destructive">Harmful Content Detected</span>
                        <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", SEVERITY_STYLES[analysis.harmfulSeverity] ?? SEVERITY_STYLES.None)}>
                          {analysis.harmfulSeverity}
                        </span>
                      </div>
                      {analysis.harmfulReason && (
                        <p className="text-xs text-muted-foreground">{analysis.harmfulReason}</p>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                      <span className="text-sm text-green-600">No harmful content detected</span>
                    </div>
                  )}

                  {/* Monitoring Suggestion */}
                  {analysis.suggestMonitoring && (
                    <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-yellow-600 shrink-0" />
                        <span className="text-sm font-medium text-yellow-700 dark:text-yellow-500">Monitoring Suggested</span>
                      </div>
                      {analysis.monitoringReason && (
                        <p className="text-xs text-muted-foreground">{analysis.monitoringReason}</p>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={alreadyMonitored}
                        onClick={handleAddToMonitoring}
                        className={cn("border-yellow-500/40", alreadyMonitored && "opacity-60 cursor-not-allowed")}
                      >
                        <ShieldAlert className="h-3.5 w-3.5 mr-1.5" />
                        {alreadyMonitored ? "Already Monitored" : "Add to Monitoring"}
                      </Button>
                    </div>
                  )}

                  {/* Timestamp */}
                  <p className="text-xs text-muted-foreground">
                    Analyzed at {new Date(analysis.analyzedAt).toLocaleString()}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  {analyzingThisPost ? (
                    <>
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Analyzing...</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground text-center">No analysis yet for this post.</p>
                      <Button onClick={handleAnalyzeThisPost}>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Analyze This Post
                      </Button>
                    </>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("text-card-foreground text-right", mono && "font-mono text-xs")}>{value}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value?: number }) {
  if (value === undefined || value === null) return null;
  return (
    <div className="p-2 rounded-md bg-background text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-card-foreground">{value.toLocaleString()}</p>
    </div>
  );
}
