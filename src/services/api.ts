const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081/api";

// ── Post types per collection ──

export interface InstaExplorePost {
  username: string;
  caption: string;
  likes: number;
  date: string;
  time: string;
  url?: string;
  screenshot_path?: string | null;
  video_path?: string | null;
}

export interface InstaSearchPost {
  keyword: string;
  username: string;
  caption: string;
  likes: number;
  date: string;
  time: string;
  url?: string;
  screenshot_path?: string | null;
  video_path?: string | null;
}

export interface InstaProfilePost {
  profile: string;
  username: string;
  caption: string;
  likes: number;
  date: string;
  time: string;
  url?: string;
  screenshot_path?: string | null;
  video_path?: string | null;
}

export interface TwitterHomePost {
  name: string;
  handle: string;
  tweet: string;
  likes: number;
  reposts: number;
  replies: number;
  views: number;
  date: string;
  time: string;
  url?: string;
  screenshot_path?: string | null;
  video_path?: string | null;
}

export interface TwitterSearchPost {
  keyword: string;
  name: string;
  handle: string;
  tweet: string;
  likes: number;
  reposts: number;
  replies: number;
  views: number;
  date: string;
  time: string;
  url?: string;
  screenshot_path?: string | null;
  video_path?: string | null;
}

export interface TwitterProfilePost {
  profile: string;
  name: string;
  handle: string;
  tweet: string;
  likes: number;
  reposts: number;
  replies: number;
  views: number;
  date: string;
  time: string;
  url?: string;
  screenshot_path?: string | null;
  video_path?: string | null;
}

export interface FacebookExplorePost {
  username: string;
  caption: string;
  likes: number;
  date: string;
  time: string;
  url?: string;
  screenshot_path?: string | null;
  video_path?: string | null;
}

export interface FacebookSearchPost {
  keyword: string;
  username: string;
  caption: string;
  likes: number;
  date: string;
  time: string;
  url?: string;
  screenshot_path?: string | null;
  video_path?: string | null;
}

export interface FacebookProfilePost {
  profile: string;
  username: string;
  caption: string;
  likes: number;
  date: string;
  time: string;
  url?: string;
  screenshot_path?: string | null;
  video_path?: string | null;
}

export interface RedditHomePost {
  subreddit: string;
  username: string;
  title: string;
  content: string;
  upvotes: number;
  comments: number;
  date: string;
  time: string;
  url?: string;
  screenshot_path?: string | null;
}

export interface RedditSearchPost {
  keyword: string;
  subreddit: string;
  username: string;
  title: string;
  content: string;
  upvotes: number;
  comments: number;
  date: string;
  time: string;
  url?: string;
  screenshot_path?: string | null;
}

export interface AllPost {
  platform: "Instagram" | "Twitter" | "Facebook" | "Reddit" | "Web";
  source: "Explore" | "Search" | "Home" | "Profile";
  keyword: string | null;
  user: string;
  content: string;
  likes: number;
  date: string;
  time: string;
  url?: string;
  screenshot_path?: string | null;
  video_path?: string | null;
  // Twitter-specific (for modal)
  reposts?: number;
  replies?: number;
  views?: number;
  // Reddit-specific (for modal)
  upvotes?: number;
  comments?: number;
  accountId?: string;
}

export interface WebSearchPost {
  id: string;
  keyword: string;
  title: string;
  url: string;
  snippet: string;
  scrapedContent: string;
  screenshotPath?: string | null;
  screenshot_path?: string | null;
  engine: string;
  status: "SUCCESS" | "FAILED" | "BLOCKED";
  scrapedAt: string;
  accountId?: string;
  accountUsername?: string;
}

export interface ScraperRequest {
  instaExplore: boolean;
  twitterHome: boolean;
  facebookExplore: boolean;
  redditHome: boolean;
  instaKeywords: string[];
  twitterKeywords: string[];
  facebookKeywords: string[];
  redditKeywords: string[];
  instaProfiles: string[];
  twitterProfiles: string[];
  facebookProfiles: string[];
  redditProfiles: string[];
  webSearchKeywords: string[];
  webSearchMaxResults: number;
  duration: number;
  accountId?: string;
  accountUsername?: string;
}

export type ViewType =
  | "all"
  | "instagram-explore"
  | "instagram-search"
  | "instagram-profile"
  | "twitter-home"
  | "twitter-search"
  | "twitter-profile"
  | "facebook-explore"
  | "facebook-search"
  | "facebook-profile"
  | "reddit-home"
  | "reddit-search"
  | "web-search";

// ── Dashboard types ──

export interface DashboardStats {
  totalPosts: number;
  uniqueUsers: number;
  totalLinks: number;
  averageLikes: number;
  postsOverTime: any[];
  likesDistribution: any[];
  topUsers: any[];
  sourceBreakdown: any[];
}


// ── Monitoring types ──

export interface PostAnalysis {
  postId: string;
  sentiment: "Positive" | "Negative" | "Neutral" | "Angry";
  sentimentScore: number; // 0–100
  isHarmful: boolean;
  harmfulReason: string | null;
  harmfulSeverity: "None" | "Low" | "Medium" | "High";
  suggestMonitoring: boolean;
  monitoringReason: string | null;
  analyzedAt: string; // ISO timestamp
  threatLevel?: "low" | "medium" | "high";
  summary?: string;
}

export function getPostId(post: AllPost): string {
  return `${post.platform}_${post.user}_${post.date}_${post.time}`;
}

export interface MonitoredUser {
  id?: string;
  username: string;
  platform: "Instagram" | "Twitter";
  status: "Suspected" | "Tracked" | "Cleared";
  addedFrom: "Manual" | "PostFlag" | "ScraperProfile";
  addedAt?: string;
  harmfulRating: number; // 1–5
  notes?: string;
  accountId?: string;
}


// ── Geo Intelligence types ──

export interface PostGeo {
  id?: string;
  platform: string;
  user: string;
  content: string;
  keyword: string;
  source: string;
  locationName: string;
  country: string;
  latitude: number;
  longitude: number;
  sentiment: string;
  isHarmful: boolean;
  harmfulSeverity: string;
  likes: number;
  date: string;
  time: string;
  scrapedAt?: string;
  accountId?: string;
}

export interface GeoCountry {
  country: string;
  count: number;
}

// ── Fetch helper ──

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP error ${response.status}`);
  return response.json();
}

function getCurrentAccount(): { id?: string; username?: string } {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return {};
    const user = JSON.parse(raw);
    return { id: user?.id, username: user?.username };
  } catch {
    return {};
  }
}

function appendAccount(query: URLSearchParams): URLSearchParams {
  const account = getCurrentAccount();
  if (account.id) query.set("accountId", account.id);
  return query;
}

function buildQuery(params?: { search?: string; minLikes?: number }): string {
  const q = new URLSearchParams();
  if (params?.search) q.set("search", params.search);
  if (params?.minLikes) q.set("minLikes", String(params.minLikes));
  appendAccount(q);
  const str = q.toString();
  return str ? `?${str}` : "";
}

export async function getAllPosts(params?: { search?: string; minLikes?: number }): Promise<AllPost[]> {
  const query = new URLSearchParams();
  if (params?.search) query.append("search", params.search);
  if (params?.minLikes) query.append("minLikes", params.minLikes.toString());
  appendAccount(query);
  return fetchJson(`${API_BASE}/posts/all?${query}`);
}

export async function getInstaExplorePosts(params?: { search?: string; minLikes?: number }): Promise<InstaExplorePost[]> {
  return fetchJson(`${API_BASE}/posts/instagram/explore${buildQuery(params)}`);
}

export async function getInstaSearchPosts(params?: { search?: string; minLikes?: number }): Promise<InstaSearchPost[]> {
  return fetchJson(`${API_BASE}/posts/instagram/search${buildQuery(params)}`);
}

export async function getInstaProfilePosts(params?: { search?: string; minLikes?: number }): Promise<InstaProfilePost[]> {
  return fetchJson(`${API_BASE}/posts/instagram/profile${buildQuery(params)}`);
}

export async function getTwitterHomePosts(params?: { search?: string; minLikes?: number }): Promise<TwitterHomePost[]> {
  return fetchJson(`${API_BASE}/posts/twitter/home${buildQuery(params)}`);
}

export async function getTwitterSearchPosts(params?: { search?: string; minLikes?: number }): Promise<TwitterSearchPost[]> {
  return fetchJson(`${API_BASE}/posts/twitter/search${buildQuery(params)}`);
}

export async function getTwitterProfilePosts(params?: { search?: string; minLikes?: number }): Promise<TwitterProfilePost[]> {
  return fetchJson(`${API_BASE}/posts/twitter/profile${buildQuery(params)}`);
}

export async function getFacebookExplorePosts(params?: { search?: string; minLikes?: number }): Promise<FacebookExplorePost[]> {
  return fetchJson(`${API_BASE}/posts/facebook/explore${buildQuery(params)}`);
}

export async function getFacebookSearchPosts(params?: { search?: string; minLikes?: number }): Promise<FacebookSearchPost[]> {
  return fetchJson(`${API_BASE}/posts/facebook/search${buildQuery(params)}`);
}

export async function getFacebookProfilePosts(params?: { search?: string; minLikes?: number }): Promise<FacebookProfilePost[]> {
  return fetchJson(`${API_BASE}/posts/facebook/profile${buildQuery(params)}`);
}

export async function getRedditHomePosts(params?: { search?: string; minLikes?: number }): Promise<RedditHomePost[]> {
  return fetchJson(`${API_BASE}/posts/reddit/home${buildQuery(params)}`);
}

export async function getRedditSearchPosts(params?: { search?: string; minLikes?: number }): Promise<RedditSearchPost[]> {
  return fetchJson(`${API_BASE}/posts/reddit/search${buildQuery(params)}`);
}

export async function getWebSearchPosts(keyword?: string): Promise<WebSearchPost[]> {
  const query = appendAccount(new URLSearchParams());
  if (keyword) query.set("keyword", keyword);
  return fetchJson(`${API_BASE}/posts/websearch?${query}`);
}

export async function getDashboardStats(platform?: string): Promise<DashboardStats> {
  const params = new URLSearchParams();
  if (platform && platform !== "all") params.set("platform", platform);
  appendAccount(params);
  const q = params.toString() ? `?${params.toString()}` : "";
  return fetchJson(`${API_BASE}/dashboard/stats${q}`);
}

// ── Monitoring API ──

export async function getMonitoredUsers(): Promise<MonitoredUser[]> {
  const query = appendAccount(new URLSearchParams());
  return fetchJson(`${API_BASE}/monitoring/users?${query}`);
}

export async function addMonitoredUser(user: Partial<MonitoredUser>): Promise<MonitoredUser> {
  const account = getCurrentAccount();
  const response = await fetch(`${API_BASE}/monitoring/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...user, accountId: user.accountId ?? account.id }),
  });
  if (!response.ok) throw new Error(`HTTP error ${response.status}`);
  return response.json();
}

export async function updateMonitoredUser(id: string, updates: Partial<MonitoredUser>): Promise<MonitoredUser> {
  const response = await fetch(`${API_BASE}/monitoring/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!response.ok) throw new Error(`HTTP error ${response.status}`);
  return response.json();
}

export async function deleteMonitoredUser(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/monitoring/users/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error(`HTTP error ${response.status}`);
}

// ── Geo API ──

export async function getGeoPosts(filters?: { platform?: string; country?: string; keyword?: string }): Promise<PostGeo[]> {
  const query = new URLSearchParams();
  if (filters?.platform) query.append("platform", filters.platform);
  if (filters?.country) query.append("country", filters.country);
  if (filters?.keyword) query.append("keyword", filters.keyword);
  appendAccount(query);
  return fetchJson(`${API_BASE}/geo/posts?${query}`);
}

export async function saveGeoPost(post: PostGeo): Promise<void> {
  const account = getCurrentAccount();
  const response = await fetch(`${API_BASE}/geo/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...post, accountId: post.accountId ?? account.id }),
  });
  if (!response.ok) throw new Error(`HTTP error ${response.status}`);
}

export async function getGeoCountries(): Promise<GeoCountry[]> {
  const query = appendAccount(new URLSearchParams());
  return fetchJson(`${API_BASE}/geo/countries?${query}`);
}

// ── Dark Web Intelligence types ──

export interface DarkWebSource {
  title: string;
  link: string;
}

export interface DarkWebInvestigation {
  id: string;
  timestamp: string;
  query: string;
  refinedQuery: string;
  model: string;
  preset: string;
  sources: DarkWebSource[];
  summary: string;
  fileName: string;
  ingestedAt: string;
}

export interface DarkWebStats {
  totalInvestigations: number;
  totalSources: number;
  latestQuery: string;
  latestTimestamp: string;
}

// ── Dark Web Intelligence API ──

export async function getDarkWebInvestigations(): Promise<DarkWebInvestigation[]> {
  return fetchJson(`${API_BASE}/darkweb/investigations`);
}

export async function getDarkWebInvestigation(id: string): Promise<DarkWebInvestigation> {
  return fetchJson(`${API_BASE}/darkweb/investigations/${id}`);
}

export async function triggerDarkWebIngest(): Promise<{ newFiles: number }> {
  const response = await fetch(`${API_BASE}/darkweb/ingest`, { method: "POST" });
  if (!response.ok) throw new Error(`HTTP error ${response.status}`);
  return response.json();
}

export async function getDarkWebStats(): Promise<DarkWebStats> {
  return fetchJson(`${API_BASE}/darkweb/stats`);
}

export async function triggerDarkWebSearch(query: string): Promise<{ status: string; message: string }> {
  const response = await fetch(`${API_BASE}/darkweb/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!response.ok) throw new Error(`HTTP error ${response.status}`);
  return response.json();
}

// ── Scraper API ──

export async function startScraper(request: ScraperRequest): Promise<void> {
  const account = getCurrentAccount();
  const response = await fetch(`${API_BASE}/scraper/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...request,
      accountId: request.accountId ?? account.id,
      accountUsername: request.accountUsername ?? account.username,
    }),
  });
  if (!response.ok) throw new Error(`HTTP error ${response.status}`);
}

export async function stopScraper(): Promise<void> {
  const response = await fetch(`${API_BASE}/scraper/stop`, {
    method: "POST",
  });
  if (!response.ok) throw new Error(`HTTP error ${response.status}`);
}

// ── Session Reports ──

export interface LastSessionInfo {
  lastStartedAt: string | null;
  keywords: string[];
  platforms: string[];
}

export interface PreparedPost {
  id: string;
  platform: string;
  source: string;
  keyword: string | null;
  author: string;
  authorName: string;
  content: string;
  url: string;
  timestamp: string;
  scrapedAt: string;
  engagement: {
    likes?: number;
    comments?: number;
    shares?: number;
    views?: number;
  };
}

export interface PreparedPostsResult {
  posts: PreparedPost[];
  countsByPlatform: Record<string, number>;
  totalCount: number;
  truncated: boolean;
}

export interface ReportData {
  executive_summary: string;
  threat_assessment: {
    overall_level: "low" | "medium" | "high" | "critical";
    harmful_posts_count: number;
    key_concerns: string[];
  };
  sentiment_breakdown: {
    positive_percentage: number;
    negative_percentage: number;
    neutral_percentage: number;
    dominant_emotions: string[];
  };
  key_narratives: Array<{
    theme: string;
    description: string;
    post_count: number;
    example_post_ids: string[];
  }>;
  notable_actors: Array<{
    username: string;
    platform: string;
    why_notable: string;
    suggested_action: string;
  }>;
  geographic_signals: Array<{
    location: string;
    context: string;
    post_ids: string[];
  }>;
  cross_platform_patterns: string;
  flagged_posts: Array<{
    post_id: string;
    platform: string;
    author: string;
    reason: string;
    severity: "low" | "medium" | "high" | "critical";
  }>;
  recommended_actions: string[];
}

export interface SessionReport {
  id: string;
  accountId: string;
  generatedAt: string;
  sessionStart: string;
  sessionEnd: string;
  postsAnalyzedCount: number;
  postsByPlatform: Record<string, number>;
  keywords: string[];
  platforms: string[];
  reportData: ReportData;
  geminiModel: string;
}

export interface SaveSessionReportPayload {
  accountId: string;
  sessionStart: string;
  sessionEnd: string;
  postsAnalyzedCount: number;
  postsByPlatform: Record<string, number>;
  keywords: string[];
  platforms: string[];
  reportData: ReportData;
  geminiModel: string;
}

export async function getLastSessionInfo(accountId: string): Promise<LastSessionInfo> {
  const q = new URLSearchParams({ accountId });
  return fetchJson(`${API_BASE}/reports/last-session-info?${q}`);
}

export async function prepareSessionPosts(accountId: string): Promise<PreparedPostsResult> {
  const response = await fetch(`${API_BASE}/reports/prepare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accountId }),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `HTTP error ${response.status}`);
  }
  return response.json();
}

export async function saveSessionReport(payload: SaveSessionReportPayload): Promise<SessionReport> {
  const response = await fetch(`${API_BASE}/reports/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`HTTP error ${response.status}`);
  return response.json();
}

export async function listSessionReports(accountId: string): Promise<SessionReport[]> {
  const q = new URLSearchParams({ accountId });
  return fetchJson(`${API_BASE}/reports?${q}`);
}

export async function getSessionReport(id: string, accountId: string): Promise<SessionReport> {
  const q = new URLSearchParams({ accountId });
  return fetchJson(`${API_BASE}/reports/${id}?${q}`);
}

export async function deleteSessionReport(id: string, accountId: string): Promise<void> {
  const q = new URLSearchParams({ accountId });
  const response = await fetch(`${API_BASE}/reports/${id}?${q}`, { method: "DELETE" });
  if (!response.ok) throw new Error(`HTTP error ${response.status}`);
}
