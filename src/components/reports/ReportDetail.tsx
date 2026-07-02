import { useMemo } from "react";
import { Download, ShieldAlert, Globe, Users, AlertTriangle, Layers, Flag, ListChecks, MapPin } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RTooltip, Legend } from "recharts";
import { toast } from "sonner";
import {
  addMonitoredUser,
  type SessionReport,
  type ReportData,
} from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { threatBadgeClasses, threatLabel } from "@/components/reports/threatLevel";
import { downloadReportPDF } from "@/components/reports/ReportPDF";

const PIE_COLORS = ["hsl(142, 71%, 45%)", "hsl(0, 80%, 55%)", "hsl(220, 10%, 55%)"];

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    return (
      d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
      " at " +
      d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    );
  } catch {
    return iso;
  }
}

interface Props {
  report: SessionReport;
}

export function ReportDetail({ report }: Props) {
  const data: ReportData = report.reportData;
  const level = data.threat_assessment?.overall_level ?? "low";

  const sentimentData = useMemo(() => {
    const s = data.sentiment_breakdown;
    if (!s) return [];
    return [
      { name: "Positive", value: s.positive_percentage },
      { name: "Negative", value: s.negative_percentage },
      { name: "Neutral", value: s.neutral_percentage },
    ];
  }, [data.sentiment_breakdown]);

  const platformBreakdown = Object.entries(report.postsByPlatform || {});

  async function handleAddToMonitoring(username: string, platform: string) {
    const platformNormalized =
      platform.toLowerCase() === "twitter" ? "Twitter" :
      platform.toLowerCase() === "instagram" ? "Instagram" : platform;
    if (platformNormalized !== "Twitter" && platformNormalized !== "Instagram") {
      toast.error("Monitoring is only supported for Twitter and Instagram users.");
      return;
    }
    try {
      await addMonitoredUser({
        username,
        platform: platformNormalized as "Twitter" | "Instagram",
        status: "Suspected",
        addedFrom: "PostFlag",
        harmfulRating: 3,
        notes: `Flagged by session report ${report.id}`,
      });
      toast.success(`${username} added to monitoring.`);
    } catch {
      toast.error("Failed to add to monitoring.");
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">Session Intelligence Report</h2>
          <p className="text-sm text-muted-foreground">
            Generated {formatDateTime(report.generatedAt)} • {report.geminiModel}
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">Session: </span>
            <span className="font-medium">{formatDateTime(report.sessionStart)}</span>
            <span className="text-muted-foreground"> → </span>
            <span className="font-medium">{formatDateTime(report.sessionEnd)}</span>
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">Posts analyzed: </span>
            <span className="font-semibold">{report.postsAnalyzedCount}</span>
            {platformBreakdown.length > 0 && (
              <span className="text-muted-foreground">
                {" • "}
                {platformBreakdown.map(([k, v]) => `${k.charAt(0) + k.slice(1).toLowerCase()} ${v}`).join(", ")}
              </span>
            )}
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {report.platforms.map((p) => (
              <Badge key={p} variant="outline" className="text-[10px]">{p}</Badge>
            ))}
          </div>
          {report.keywords.length > 0 && (
            <p className="text-xs text-muted-foreground pt-1">
              Keywords: {report.keywords.join(", ")}
            </p>
          )}
        </div>
        <Button onClick={() => downloadReportPDF(report)} className="gap-2">
          <Download className="h-4 w-4" /> Download PDF
        </Button>
      </div>

      {/* 2. Executive Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Executive Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{data.executive_summary}</p>
        </CardContent>
      </Card>

      {/* 3. Threat Assessment */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><ShieldAlert className="h-4 w-4" /> Threat Assessment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6 flex-wrap">
            <Badge className={`${threatBadgeClasses(level)} text-base px-4 py-1.5`}>{threatLabel(level)}</Badge>
            <div>
              <div className="text-2xl font-bold">{data.threat_assessment?.harmful_posts_count ?? 0}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Harmful posts</div>
            </div>
          </div>
          {data.threat_assessment?.key_concerns?.length > 0 && (
            <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
              {data.threat_assessment.key_concerns.map((c, i) => (
                <li key={i}><span className="text-foreground">{c}</span></li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* 4. Sentiment Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Sentiment Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4 items-center">
          <div className="h-56">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={sentimentData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {sentimentData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <RTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Dominant emotions</p>
            <div className="flex flex-wrap gap-1.5">
              {(data.sentiment_breakdown?.dominant_emotions ?? []).map((e, i) => (
                <Badge key={i} variant="secondary" className="text-xs">{e}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5. Key Narratives */}
      {data.key_narratives?.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Layers className="h-4 w-4" /> Key Narratives</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full">
              {data.key_narratives.map((n, i) => (
                <AccordionItem key={i} value={`n-${i}`}>
                  <AccordionTrigger className="text-sm">
                    <div className="flex items-center gap-3 text-left">
                      <span className="font-semibold">{n.theme}</span>
                      <Badge variant="outline" className="text-[10px]">{n.post_count} posts</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p className="text-sm text-muted-foreground">{n.description}</p>
                    {n.example_post_ids?.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-semibold">Example post IDs:</span> {n.example_post_ids.join(", ")}
                      </p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* 6. Notable Actors */}
      {data.notable_actors?.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> Notable Actors</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Why notable</TableHead>
                  <TableHead>Suggested action</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.notable_actors.map((a, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-sm">{a.username}</TableCell>
                    <TableCell><Badge variant="outline">{a.platform}</Badge></TableCell>
                    <TableCell className="text-sm">{a.why_notable}</TableCell>
                    <TableCell><Badge variant="secondary">{a.suggested_action}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => handleAddToMonitoring(a.username, a.platform)}>
                        Add to monitoring
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* 7. Geographic Signals */}
      {data.geographic_signals?.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4" /> Geographic Signals</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {data.geographic_signals.map((g, i) => (
                <li key={i} className="border-l-2 border-primary/40 pl-3">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{g.location}</span>
                    <Badge variant="outline" className="text-[10px]">{g.post_ids?.length ?? 0} posts</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{g.context}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* 8. Cross-Platform Patterns */}
      <Card className="border-primary/40 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><Layers className="h-4 w-4 text-primary" /> Cross-Platform Patterns</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{data.cross_platform_patterns}</p>
        </CardContent>
      </Card>

      {/* 9. Flagged Posts */}
      {data.flagged_posts?.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Flag className="h-4 w-4" /> Flagged Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Severity</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Post ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.flagged_posts.map((f, i) => (
                  <TableRow key={i}>
                    <TableCell><Badge className={threatBadgeClasses(f.severity)}>{threatLabel(f.severity)}</Badge></TableCell>
                    <TableCell><Badge variant="outline">{f.platform}</Badge></TableCell>
                    <TableCell className="font-mono text-sm">{f.author}</TableCell>
                    <TableCell className="text-sm">{f.reason}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{f.post_id}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* 10. Recommended Actions */}
      {data.recommended_actions?.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><ListChecks className="h-4 w-4" /> Recommended Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-1.5 text-sm">
              {data.recommended_actions.map((a, i) => <li key={i}>{a}</li>)}
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
