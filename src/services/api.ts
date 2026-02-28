const API_BASE = "http://localhost:8081/api";
// ── Post types per collection ──

export interface InstaExplorePost {
  username: string;
  caption: string;
  likes: number;
  date: string;
  time: string;
}

export interface InstaSearchPost {
  keyword: string;
  username: string;
  caption: string;
  likes: number;
  date: string;
  time: string;
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
}

export interface AllPost {
  platform: "Instagram" | "Twitter";
  source: "Explore" | "Search" | "Home";
  keyword: string | null;
  user: string;
  content: string;
  likes: number;
  date: string;
  time: string;
}

export type ViewType = "all" | "instagram-explore" | "instagram-search" | "twitter-home" | "twitter-search";

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

export async function getAllPosts(params?: { search?: string; minLikes?: number }): Promise<AllPost[]> {
  const q = new URLSearchParams();
  if (params?.search) q.set("search", params.search);
  if (params?.minLikes) q.set("minLikes", String(params.minLikes));
  return fetchJson<AllPost[]>(`${API_BASE}/posts/all?${q}`);
}

export async function getInstaExplorePosts(params?: { search?: string; minLikes?: number }): Promise<InstaExplorePost[]> {
  const q = new URLSearchParams();
  if (params?.search) q.set("search", params.search);
  if (params?.minLikes) q.set("minLikes", String(params.minLikes));
  return fetchJson<InstaExplorePost[]>(`${API_BASE}/posts/instagram/explore?${q}`);
}

export async function getInstaSearchPosts(params?: { search?: string; minLikes?: number }): Promise<InstaSearchPost[]> {
  const q = new URLSearchParams();
  if (params?.search) q.set("search", params.search);
  if (params?.minLikes) q.set("minLikes", String(params.minLikes));
  return fetchJson<InstaSearchPost[]>(`${API_BASE}/posts/instagram/search?${q}`);
}

export async function getTwitterHomePosts(params?: { search?: string; minLikes?: number }): Promise<TwitterHomePost[]> {
  const q = new URLSearchParams();
  if (params?.search) q.set("search", params.search);
  if (params?.minLikes) q.set("minLikes", String(params.minLikes));
  return fetchJson<TwitterHomePost[]>(`${API_BASE}/posts/twitter/home?${q}`);
}

export async function getTwitterSearchPosts(params?: { search?: string; minLikes?: number }): Promise<TwitterSearchPost[]> {
  const q = new URLSearchParams();
  if (params?.search) q.set("search", params.search);
  if (params?.minLikes) q.set("minLikes", String(params.minLikes));
  return fetchJson<TwitterSearchPost[]>(`${API_BASE}/posts/twitter/search?${q}`);
}

export async function getDashboardStats(platform?: string): Promise<DashboardStats> {
  const q = platform && platform !== "all" ? `?platform=${platform}` : "";
  return fetchJson<DashboardStats>(`${API_BASE}/dashboard/stats${q}`);
}
