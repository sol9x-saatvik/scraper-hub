import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PostModalProps {
  post: Record<string, any> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PostModal({ post, open, onOpenChange }: PostModalProps) {
  if (!post) return null;

  const platform: string = post.platform ?? (post.handle ? "Twitter" : "Instagram");
  const source: string = post.source ?? "—";
  const keyword: string =
    source === "Profile" || source === "PROFILE"
      ? post.profile ?? "—"
      : post.keyword ?? "—";
  const user: string = post.user ?? post.username ?? post.handle ?? "—";
  const content: string = post.content ?? post.caption ?? post.tweet ?? "—";
  const url: string = post.url ?? "";
  const screenshotPath: string | null = post.screenshot_path ?? null;

  const isTwitter = platform === "Twitter" || !!post.handle;

  const copyUrl = () => {
    if (url) {
      navigator.clipboard.writeText(url);
      toast.success("URL copied to clipboard");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Post Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <span className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              isTwitter ? "bg-primary/15 text-primary" : "bg-accent text-accent-foreground"
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
            <Row label="User" value={user} mono />
            <Row label="Date" value={`${post.date ?? "—"} ${post.time ?? ""}`} />
          </div>

          {/* Content */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Content</p>
            <p className="text-sm text-card-foreground leading-relaxed whitespace-pre-wrap">{content}</p>
          </div>

          {/* Engagement */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Stat label="Likes" value={post.likes} />
            {isTwitter && (
              <>
                <Stat label="Reposts" value={post.reposts} />
                <Stat label="Replies" value={post.replies} />
                <Stat label="Views" value={post.views} />
              </>
            )}
          </div>

          {/* Screenshot */}
          {screenshotPath && (
            <img
              src={`http://localhost:8080/${screenshotPath}`}
              alt="Post screenshot"
              className="rounded-xl border border-border w-full object-contain"
            />
          )}

          {/* Actions */}
          {url && (
            <div className="flex gap-2">
              <Button size="sm" asChild>
                <a href={url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Go To Post
                </a>
              </Button>
              <Button size="sm" variant="outline" onClick={copyUrl}>
                <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy URL
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
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
