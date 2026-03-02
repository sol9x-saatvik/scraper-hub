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
}

export interface AllPost {
  platform: "Instagram" | "Twitter";
  source: "Explore" | "Search" | "Home" | "Profile";
  keyword: string | null;
  user: string;
  content: string;
  likes: number;
  date: string;
  time: string;
  url?: string;
  screenshot_path?: string | null;
  // Twitter-specific (for modal)
  reposts?: number;
  replies?: number;
  views?: number;
}

export type ViewType =
  | "all"
  | "instagram-explore"
  | "instagram-search"
  | "instagram-profile"
  | "twitter-home"
  | "twitter-search"
  | "twitter-profile";

// ── Dashboard types ──

export interface DashboardStats {
  totalPosts: number;
  uniqueUsers: number;
  totalLinks: number;
  averageLikes: number;
  postsOverTime: any[];
  likesDistribution: any[];
  topUsers: any[];
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

export async function getDashboardStats(platform?: string): Promise<DashboardStats> {
  const q = platform && platform !== "all" ? `?platform=${platform}` : "";
  return fetchJson<DashboardStats>(`${API_BASE}/dashboard/stats${q}`);
}
