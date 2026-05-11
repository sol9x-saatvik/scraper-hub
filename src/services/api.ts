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

// ── Fetch helper ──

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP error ${response.status}`);
  return response.json();
}

export async function getAllPosts(params?: { search?: string; minLikes?: number }): Promise<AllPost[]> {
  const query = new URLSearchParams();
  if (params?.search) query.append("search", params.search);
  if (params?.minLikes) query.append("minLikes", params.minLikes.toString());
  return fetchJson(`${API_BASE}/posts/all?${query}`);
}

export async function getInstaExplorePosts(): Promise<InstaExplorePost[]> {
  return fetchJson(`${API_BASE}/posts/instagram/explore`);
}

export async function getInstaSearchPosts(): Promise<InstaSearchPost[]> {
  return fetchJson(`${API_BASE}/posts/instagram/search`);
}

export async function getInstaProfilePosts(): Promise<InstaProfilePost[]> {
  return fetchJson(`${API_BASE}/posts/instagram/profile`);
}

export async function getTwitterHomePosts(): Promise<TwitterHomePost[]> {
  return fetchJson(`${API_BASE}/posts/twitter/home`);
}

export async function getTwitterSearchPosts(): Promise<TwitterSearchPost[]> {
  return fetchJson(`${API_BASE}/posts/twitter/search`);
}

export async function getTwitterProfilePosts(): Promise<TwitterProfilePost[]> {
  return fetchJson(`${API_BASE}/posts/twitter/profile`);
}

export async function getFacebookExplorePosts(): Promise<FacebookExplorePost[]> {
  return fetchJson(`${API_BASE}/posts/facebook/explore`);
}

export async function getFacebookSearchPosts(): Promise<FacebookSearchPost[]> {
  return fetchJson(`${API_BASE}/posts/facebook/search`);
}

export async function getFacebookProfilePosts(): Promise<FacebookProfilePost[]> {
  return fetchJson(`${API_BASE}/posts/facebook/profile`);
}

export async function getRedditHomePosts(): Promise<RedditHomePost[]> {
  return fetchJson(`${API_BASE}/posts/reddit/home`);
}

export async function getRedditSearchPosts(): Promise<RedditSearchPost[]> {
  return fetchJson(`${API_BASE}/posts/reddit/search`);
}

export async function getWebSearchPosts(keyword?: string): Promise<WebSearchPost[]> {
  const query = keyword ? `?keyword=${encodeURIComponent(keyword)}` : "";
  return fetchJson(`${API_BASE}/posts/websearch${query}`);
}

export async function getDashboardStats(platform?: string): Promise<DashboardStats> {
  const query = platform ? `?platform=${platform}` : "";
  return fetchJson(`${API_BASE}/dashboard/stats${query}`);
}

// ── Monitoring API ──

export async function getMonitoredUsers(): Promise<MonitoredUser[]> {
  return fetchJson(`${API_BASE}/monitoring/users`);
}

export async function addMonitoredUser(user: Partial<MonitoredUser>): Promise<MonitoredUser> {
  const response = await fetch(`${API_BASE}/monitoring/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
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
  return fetchJson(`${API_BASE}/geo/posts?${query}`);
}

export async function saveGeoPost(post: PostGeo): Promise<void> {
  const response = await fetch(`${API_BASE}/geo/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(post),
  });
  if (!response.ok) throw new Error(`HTTP error ${response.status}`);
}

export async function getGeoCountries(): Promise<GeoCountry[]> {
  return fetchJson(`${API_BASE}/geo/countries`);
}

// ── Scraper API ──

export async function startScraper(request: ScraperRequest): Promise<void> {
  const response = await fetch(`${API_BASE}/scraper/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!response.ok) throw new Error(`HTTP error ${response.status}`);
}

export async function stopScraper(): Promise<void> {
  const response = await fetch(`${API_BASE}/scraper/stop`, {
    method: "POST",
  });
  if (!response.ok) throw new Error(`HTTP error ${response.status}`);
}
