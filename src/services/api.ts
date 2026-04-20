const API_BASE = "http://localhost:8081/api";

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
  platform: "Instagram" | "Twitter" | "Facebook" | "Reddit";
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
}

export interface WebSearchPost {
  id: string;
  keyword: string;
  title: string;
  url: string;
  snippet: string;
  scrapedContent: string;
  engine: string;
  status: "SUCCESS" | "FAILED" | "BLOCKED";
  scrapedAt: string;
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

// ── Fetch helpers ──

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

function buildQuery(params?: { search?: string; minLikes?: number }): string {
  const q = new URLSearchParams();
  if (params?.search) q.set("search", params.search);
  if (params?.minLikes) q.set("minLikes", String(params.minLikes));
  return q.toString();
}

export async function getAllPosts(params?: { search?: string; minLikes?: number }): Promise<AllPost[]> {
  return fetchJson<AllPost[]>(`${API_BASE}/posts/all?${buildQuery(params)}`);
}

export async function getInstaExplorePosts(params?: { search?: string; minLikes?: number }): Promise<InstaExplorePost[]> {
  return fetchJson<InstaExplorePost[]>(`${API_BASE}/posts/instagram/explore?${buildQuery(params)}`);
}

export async function getInstaSearchPosts(params?: { search?: string; minLikes?: number }): Promise<InstaSearchPost[]> {
  return fetchJson<InstaSearchPost[]>(`${API_BASE}/posts/instagram/search?${buildQuery(params)}`);
}

export async function getInstaProfilePosts(params?: { search?: string; minLikes?: number }): Promise<InstaProfilePost[]> {
  return fetchJson<InstaProfilePost[]>(`${API_BASE}/posts/instagram/profile?${buildQuery(params)}`);
}

export async function getTwitterHomePosts(params?: { search?: string; minLikes?: number }): Promise<TwitterHomePost[]> {
  return fetchJson<TwitterHomePost[]>(`${API_BASE}/posts/twitter/home?${buildQuery(params)}`);
}

export async function getTwitterSearchPosts(params?: { search?: string; minLikes?: number }): Promise<TwitterSearchPost[]> {
  return fetchJson<TwitterSearchPost[]>(`${API_BASE}/posts/twitter/search?${buildQuery(params)}`);
}

export async function getTwitterProfilePosts(params?: { search?: string; minLikes?: number }): Promise<TwitterProfilePost[]> {
  return fetchJson<TwitterProfilePost[]>(`${API_BASE}/posts/twitter/profile?${buildQuery(params)}`);
}

export async function getFacebookExplorePosts(params?: { search?: string; minLikes?: number }): Promise<FacebookExplorePost[]> {
  return fetchJson<FacebookExplorePost[]>(`${API_BASE}/posts/facebook/explore?${buildQuery(params)}`);
}

export async function getFacebookSearchPosts(params?: { search?: string; minLikes?: number }): Promise<FacebookSearchPost[]> {
  return fetchJson<FacebookSearchPost[]>(`${API_BASE}/posts/facebook/search?${buildQuery(params)}`);
}

export async function getFacebookProfilePosts(params?: { search?: string; minLikes?: number }): Promise<FacebookProfilePost[]> {
  return fetchJson<FacebookProfilePost[]>(`${API_BASE}/posts/facebook/profile?${buildQuery(params)}`);
}

export async function getRedditHomePosts(params?: { search?: string; minLikes?: number }): Promise<RedditHomePost[]> {
  return fetchJson<RedditHomePost[]>(`${API_BASE}/posts/reddit/home?${buildQuery(params)}`);
}

export async function getRedditSearchPosts(params?: { search?: string; minLikes?: number }): Promise<RedditSearchPost[]> {
  return fetchJson<RedditSearchPost[]>(`${API_BASE}/posts/reddit/search?${buildQuery(params)}`);
}

export async function getWebSearchPosts(keyword?: string): Promise<WebSearchPost[]> {
  const q = keyword ? `?keyword=${encodeURIComponent(keyword)}` : "";
  return fetchJson<WebSearchPost[]>(`${API_BASE}/posts/websearch${q}`);
}

export async function getDashboardStats(platform?: string): Promise<DashboardStats> {
  const q = platform && platform !== "all" ? `?platform=${platform}` : "";
  return fetchJson<DashboardStats>(`${API_BASE}/dashboard/stats${q}`);
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
}

// ── Monitoring API ──

export async function getMonitoredUsers(): Promise<MonitoredUser[]> {
  return fetchJson<MonitoredUser[]>(`${API_BASE}/monitoring/users`);
}

export async function addMonitoredUser(user: Partial<MonitoredUser>): Promise<MonitoredUser> {
  const res = await fetch(`${API_BASE}/monitoring/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });
  if (res.status === 409) throw Object.assign(new Error("Already monitored"), { status: 409 });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function updateMonitoredUser(id: string, updates: Partial<MonitoredUser>): Promise<MonitoredUser> {
  const res = await fetch(`${API_BASE}/monitoring/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function deleteMonitoredUser(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/monitoring/users/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
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
}

export interface GeoCountry {
  country: string;
  count: number;
}

// ── Geo API ──

export async function getGeoPosts(filters?: { platform?: string; country?: string; keyword?: string }): Promise<PostGeo[]> {
  const q = new URLSearchParams();
  if (filters?.platform) q.set("platform", filters.platform);
  if (filters?.country)  q.set("country", filters.country);
  if (filters?.keyword)  q.set("keyword", filters.keyword);
  const qs = q.toString();
  return fetchJson<PostGeo[]>(`${API_BASE}/geo/posts${qs ? `?${qs}` : ""}`);
}

export async function saveGeoPost(post: PostGeo): Promise<void> {
  const res = await fetch(`${API_BASE}/geo/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(post),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
}

export async function getGeoCountries(): Promise<GeoCountry[]> {
  return fetchJson<GeoCountry[]>(`${API_BASE}/geo/countries`);
}
