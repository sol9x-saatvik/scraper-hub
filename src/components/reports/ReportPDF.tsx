import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";
import type { SessionReport } from "@/services/api";

const COLORS = {
  primary: "#1f2937",
  muted: "#6b7280",
  border: "#d1d5db",
  background: "#f9fafb",
  accent: "#2563eb",
  low: "#059669",
  medium: "#eab308",
  high: "#ea580c",
  critical: "#dc2626",
};

function threatColor(level: string): string {
  switch ((level ?? "").toLowerCase()) {
    case "critical": return COLORS.critical;
    case "high": return COLORS.high;
    case "medium": return COLORS.medium;
    case "low":
    default: return COLORS.low;
  }
}

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

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, color: COLORS.primary, fontFamily: "Helvetica" },
  cover: { padding: 60, justifyContent: "center", alignItems: "flex-start" },
  brand: { fontSize: 10, color: COLORS.muted, letterSpacing: 2, marginBottom: 20, textTransform: "uppercase" },
  title: { fontSize: 28, fontWeight: 700, marginBottom: 16, lineHeight: 1.2 },
  subtitle: { fontSize: 12, color: COLORS.muted, marginBottom: 8 },
  coverMeta: { marginTop: 30, fontSize: 11, lineHeight: 1.6 },
  coverLabel: { color: COLORS.muted },
  coverValue: { color: COLORS.primary, fontWeight: 600 },
  threatBadge: { marginTop: 40, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 4, color: "#fff", fontSize: 12, fontWeight: 700 },

  sectionTitle: { fontSize: 14, fontWeight: 700, marginTop: 18, marginBottom: 8, color: COLORS.primary, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 4 },
  para: { fontSize: 10, lineHeight: 1.5, marginBottom: 6 },
  bullet: { fontSize: 10, lineHeight: 1.5, marginBottom: 3, paddingLeft: 12 },
  smallLabel: { fontSize: 9, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  chip: { paddingVertical: 2, paddingHorizontal: 6, borderRadius: 3, marginRight: 4, marginBottom: 4, fontSize: 9, backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border },
  chipRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 6 },
  highlight: { padding: 10, backgroundColor: "#eff6ff", borderLeftWidth: 3, borderLeftColor: COLORS.accent, marginBottom: 8 },

  table: { width: "100%", marginTop: 4, marginBottom: 8, borderTopWidth: 1, borderColor: COLORS.border },
  tr: { flexDirection: "row", borderBottomWidth: 1, borderColor: COLORS.border },
  th: { fontSize: 9, fontWeight: 700, padding: 5, backgroundColor: COLORS.background, color: COLORS.muted, textTransform: "uppercase" },
  td: { fontSize: 9, padding: 5 },

  threatRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  threatPill: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 3, color: "#fff", fontSize: 9, fontWeight: 700, marginRight: 12 },
  hugeNumber: { fontSize: 24, fontWeight: 700, marginRight: 6 },

  footer: { position: "absolute", bottom: 20, left: 40, right: 40, fontSize: 8, color: COLORS.muted, textAlign: "center", borderTopWidth: 1, borderColor: COLORS.border, paddingTop: 6 },
});

function ReportPDF({ report }: { report: SessionReport }) {
  const d = report.reportData;
  const level = d.threat_assessment?.overall_level ?? "low";
  const breakdownLine = Object.entries(report.postsByPlatform || {})
    .map(([k, v]) => `${k.charAt(0) + k.slice(1).toLowerCase()}: ${v}`)
    .join(" • ");

  return (
    <Document>
      {/* Cover page */}
      <Page size="A4" style={styles.cover}>
        <Text style={styles.brand}>SOL9X OSINT Monitor</Text>
        <Text style={styles.title}>Session Intelligence Report</Text>
        <Text style={styles.subtitle}>Session: {formatDateTime(report.sessionStart)} → {formatDateTime(report.sessionEnd)}</Text>

        <View style={styles.coverMeta}>
          <Text><Text style={styles.coverLabel}>Posts analyzed: </Text><Text style={styles.coverValue}>{report.postsAnalyzedCount}{breakdownLine ? ` • ${breakdownLine}` : ""}</Text></Text>
          <Text><Text style={styles.coverLabel}>Platforms: </Text><Text style={styles.coverValue}>{report.platforms.join(", ") || "—"}</Text></Text>
          <Text><Text style={styles.coverLabel}>Keywords: </Text><Text style={styles.coverValue}>{report.keywords.join(", ") || "—"}</Text></Text>
          <Text><Text style={styles.coverLabel}>Generated: </Text><Text style={styles.coverValue}>{formatDateTime(report.generatedAt)}</Text></Text>
          <Text><Text style={styles.coverLabel}>Model: </Text><Text style={styles.coverValue}>{report.geminiModel}</Text></Text>
        </View>

        <Text style={[styles.threatBadge, { backgroundColor: threatColor(level) }]}>
          Threat Level: {level.toUpperCase()}
        </Text>
      </Page>

      {/* Body */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Executive Summary</Text>
        <Text style={styles.para}>{d.executive_summary}</Text>

        <Text style={styles.sectionTitle}>Threat Assessment</Text>
        <View style={styles.threatRow}>
          <Text style={[styles.threatPill, { backgroundColor: threatColor(level) }]}>{level.toUpperCase()}</Text>
          <Text style={styles.hugeNumber}>{d.threat_assessment?.harmful_posts_count ?? 0}</Text>
          <Text style={{ fontSize: 9, color: COLORS.muted }}>harmful posts</Text>
        </View>
        {(d.threat_assessment?.key_concerns ?? []).map((c, i) => (
          <Text key={i} style={styles.bullet}>• {c}</Text>
        ))}

        <Text style={styles.sectionTitle}>Sentiment Breakdown</Text>
        <Text style={styles.para}>
          Positive: {d.sentiment_breakdown?.positive_percentage ?? 0}% • Negative: {d.sentiment_breakdown?.negative_percentage ?? 0}% • Neutral: {d.sentiment_breakdown?.neutral_percentage ?? 0}%
        </Text>
        <Text style={styles.smallLabel}>Dominant emotions</Text>
        <View style={styles.chipRow}>
          {(d.sentiment_breakdown?.dominant_emotions ?? []).map((e, i) => (
            <Text key={i} style={styles.chip}>{e}</Text>
          ))}
        </View>

        {d.key_narratives?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Key Narratives</Text>
            {d.key_narratives.map((n, i) => (
              <View key={i} style={{ marginBottom: 10 }}>
                <Text style={{ fontSize: 11, fontWeight: 700 }}>{n.theme}  ({n.post_count} posts)</Text>
                <Text style={styles.para}>{n.description}</Text>
                {n.example_post_ids?.length > 0 && (
                  <Text style={{ fontSize: 8, color: COLORS.muted }}>Example IDs: {n.example_post_ids.join(", ")}</Text>
                )}
              </View>
            ))}
          </>
        )}

        {d.notable_actors?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Notable Actors</Text>
            <View style={styles.table}>
              <View style={styles.tr}>
                <Text style={[styles.th, { flex: 2 }]}>Username</Text>
                <Text style={[styles.th, { flex: 1 }]}>Platform</Text>
                <Text style={[styles.th, { flex: 4 }]}>Why notable</Text>
                <Text style={[styles.th, { flex: 2 }]}>Suggested action</Text>
              </View>
              {d.notable_actors.map((a, i) => (
                <View key={i} style={styles.tr}>
                  <Text style={[styles.td, { flex: 2 }]}>{a.username}</Text>
                  <Text style={[styles.td, { flex: 1 }]}>{a.platform}</Text>
                  <Text style={[styles.td, { flex: 4 }]}>{a.why_notable}</Text>
                  <Text style={[styles.td, { flex: 2 }]}>{a.suggested_action}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {d.geographic_signals?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Geographic Signals</Text>
            {d.geographic_signals.map((g, i) => (
              <View key={i} style={{ marginBottom: 6 }}>
                <Text style={{ fontSize: 10, fontWeight: 700 }}>{g.location}  ({g.post_ids?.length ?? 0} posts)</Text>
                <Text style={styles.para}>{g.context}</Text>
              </View>
            ))}
          </>
        )}

        <Text style={styles.sectionTitle}>Cross-Platform Patterns</Text>
        <View style={styles.highlight}>
          <Text style={styles.para}>{d.cross_platform_patterns}</Text>
        </View>

        {d.flagged_posts?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Flagged Posts</Text>
            <View style={styles.table}>
              <View style={styles.tr}>
                <Text style={[styles.th, { flex: 1 }]}>Severity</Text>
                <Text style={[styles.th, { flex: 1 }]}>Platform</Text>
                <Text style={[styles.th, { flex: 2 }]}>Author</Text>
                <Text style={[styles.th, { flex: 4 }]}>Reason</Text>
                <Text style={[styles.th, { flex: 2 }]}>Post ID</Text>
              </View>
              {d.flagged_posts.map((f, i) => (
                <View key={i} style={styles.tr}>
                  <Text style={[styles.td, { flex: 1, color: threatColor(f.severity), fontWeight: 700 }]}>{f.severity?.toUpperCase()}</Text>
                  <Text style={[styles.td, { flex: 1 }]}>{f.platform}</Text>
                  <Text style={[styles.td, { flex: 2 }]}>{f.author}</Text>
                  <Text style={[styles.td, { flex: 4 }]}>{f.reason}</Text>
                  <Text style={[styles.td, { flex: 2 }]}>{f.post_id}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {d.recommended_actions?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Recommended Actions</Text>
            {d.recommended_actions.map((a, i) => (
              <Text key={i} style={styles.bullet}>{i + 1}. {a}</Text>
            ))}
          </>
        )}

        <Text style={styles.footer} render={({ pageNumber, totalPages }) => `SOL9X OSINT Monitor • Page ${pageNumber} of ${totalPages}`} fixed />
      </Page>
    </Document>
  );
}

export async function downloadReportPDF(report: SessionReport): Promise<void> {
  const blob = await pdf(<ReportPDF report={report} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sol9x-report-${report.id}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export default ReportPDF;
