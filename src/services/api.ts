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

// ── Dummy Data ──

const DUMMY_ALL_POSTS: AllPost[] = [];

const DUMMY_STATS: DashboardStats = {
  totalPosts: 0,
  uniqueUsers: 0,
  totalLinks: 0,
  averageLikes: 0,
  postsOverTime: [],
  likesDistribution: [],
  topUsers: [],
  sourceBreakdown: [],
};

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

const DUMMY_MONITORED_USERS: MonitoredUser[] = [];

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

const DUMMY_GEO_POSTS: PostGeo[] = [];

// ── Fetch helpers (MOCKED) ──

async function fetchJson<T>(url: string): Promise<T> {
  console.log(`Mocking fetch to: ${url}`);
  return null as any;
}

export async function getAllPosts(params?: { search?: string; minLikes?: number }): Promise<AllPost[]> {
  return DUMMY_ALL_POSTS;
}

export async function getInstaExplorePosts(params?: { search?: string; minLikes?: number }): Promise<InstaExplorePost[]> {
  return DUMMY_ALL_POSTS.filter(p => p.platform === "Instagram" && p.source === "Explore") as any;
}

export async function getInstaSearchPosts(params?: { search?: string; minLikes?: number }): Promise<InstaSearchPost[]> {
  return DUMMY_ALL_POSTS.filter(p => p.platform === "Instagram" && p.source === "Search") as any;
}

export async function getInstaProfilePosts(params?: { search?: string; minLikes?: number }): Promise<InstaProfilePost[]> {
  return DUMMY_ALL_POSTS.filter(p => p.platform === "Instagram" && p.source === "Profile") as any;
}

export async function getTwitterHomePosts(params?: { search?: string; minLikes?: number }): Promise<TwitterHomePost[]> {
  return DUMMY_ALL_POSTS.filter(p => p.platform === "Twitter" && p.source === "Home") as any;
}

export async function getTwitterSearchPosts(params?: { search?: string; minLikes?: number }): Promise<TwitterSearchPost[]> {
  return DUMMY_ALL_POSTS.filter(p => p.platform === "Twitter" && p.source === "Search") as any;
}

export async function getTwitterProfilePosts(params?: { search?: string; minLikes?: number }): Promise<TwitterProfilePost[]> {
  return DUMMY_ALL_POSTS.filter(p => p.platform === "Twitter" && p.source === "Profile") as any;
}

export async function getFacebookExplorePosts(params?: { search?: string; minLikes?: number }): Promise<FacebookExplorePost[]> {
  return DUMMY_ALL_POSTS.filter(p => p.platform === "Facebook" && p.source === "Explore") as any;
}

export async function getFacebookSearchPosts(params?: { search?: string; minLikes?: number }): Promise<FacebookSearchPost[]> {
  return DUMMY_ALL_POSTS.filter(p => p.platform === "Facebook" && p.source === "Search") as any;
}

export async function getFacebookProfilePosts(params?: { search?: string; minLikes?: number }): Promise<FacebookProfilePost[]> {
  return DUMMY_ALL_POSTS.filter(p => p.platform === "Facebook" && p.source === "Profile") as any;
}

export async function getRedditHomePosts(params?: { search?: string; minLikes?: number }): Promise<RedditHomePost[]> {
  return DUMMY_ALL_POSTS.filter(p => p.platform === "Reddit" && p.source === "Home") as any;
}

export async function getRedditSearchPosts(params?: { search?: string; minLikes?: number }): Promise<RedditSearchPost[]> {
  return DUMMY_ALL_POSTS.filter(p => p.platform === "Reddit" && p.source === "Search") as any;
}

export async function getWebSearchPosts(keyword?: string): Promise<WebSearchPost[]> {
  return [
    {
      id: "ws1",
      keyword: keyword || "technology",
      title: "Latest in AI Development",
      url: "https://example.com/ai-news",
      snippet: "Artificial Intelligence is evolving rapidly...",
      scrapedContent: "Full content of the article...",
      engine: "Google",
      status: "SUCCESS",
      scrapedAt: new Date().toISOString(),
    }
  ];
}

export async function getDashboardStats(platform?: string): Promise<DashboardStats> {
  return DUMMY_STATS;
}

// ── Monitoring API (MOCKED) ──

export async function getMonitoredUsers(): Promise<MonitoredUser[]> {
  return DUMMY_MONITORED_USERS;
}

export async function addMonitoredUser(user: Partial<MonitoredUser>): Promise<MonitoredUser> {
  console.log("Mocked addMonitoredUser:", user);
  return { ...user, id: Math.random().toString() } as MonitoredUser;
}

export async function updateMonitoredUser(id: string, updates: Partial<MonitoredUser>): Promise<MonitoredUser> {
  console.log("Mocked updateMonitoredUser:", id, updates);
  return { id, ...updates } as any;
}

export async function deleteMonitoredUser(id: string): Promise<void> {
  console.log("Mocked deleteMonitoredUser:", id);
}

// ── Geo API (MOCKED) ──

export async function getGeoPosts(filters?: { platform?: string; country?: string; keyword?: string }): Promise<PostGeo[]> {
  return DUMMY_GEO_POSTS;
}

export async function saveGeoPost(post: PostGeo): Promise<void> {
  console.log("Mocked saveGeoPost:", post);
}

export async function getGeoCountries(): Promise<GeoCountry[]> {
  return [];
}
