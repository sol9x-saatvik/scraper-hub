import type { Platform } from "@/context/ScraperContext";

export interface Post {
  id: string;
  platform: "twitter" | "instagram";
  username: string;
  caption: string;
  likes: number;
  comments: number;
  link: string | null;
  scrapedAt: string;
}

export interface DashboardStats {
  totalPosts: number;
  uniqueUsers: number;
  totalLinks: number;
  averageLikes: number;
  postsOverTime: { date: string; posts: number }[];
  likesDistribution: { range: string; count: number }[];
  topUsers: { name: string; posts: number }[];
}

export interface ScraperStatus {
  isRunning: boolean;
  startedAt: string | null;
  duration: { hours: number; minutes: number; seconds: number };
  postsScraped: number;
  postsPerMinute: number;
  elapsedTime: number;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const twitterUsers = ["@elonmusk", "@techguru", "@datascience", "@airesearch"];
const instagramUsers = ["@webdev", "@cloudops", "@devops_ninja", "@ml_engineer"];
const twitterCaptions = [
  "Breaking: New AI model released 🚀",
  "Thread on machine learning pipelines",
  "Hot take on the future of tech",
  "Just shipped a new open-source tool",
];
const instagramCaptions = [
  "Exploring new frameworks for 2025 🚀",
  "Cloud-native development best practices",
  "Kubernetes tips every developer should know",
  "Building scalable APIs with Spring Boot",
];

const mockPosts: Post[] = Array.from({ length: 48 }, (_, i) => {
  const isTwitter = i % 2 === 0;
  return {
    id: `post-${i + 1}`,
    platform: isTwitter ? "twitter" : "instagram",
    username: isTwitter ? twitterUsers[i % 4] : instagramUsers[i % 4],
    caption: isTwitter ? twitterCaptions[i % 4] : instagramCaptions[i % 4],
    likes: Math.floor(Math.random() * 5000) + 100,
    comments: Math.floor(Math.random() * 300) + 10,
    link: i % 3 === 0 ? `https://example.com/post/${i + 1}` : null,
    scrapedAt: new Date(Date.now() - i * 3600000).toISOString(),
  };
});

export async function startScraper(platform: Platform, duration: { hours: number; minutes: number; seconds: number }, keywords: string[]): Promise<{ success: boolean }> {
  await delay(500);
  return { success: true };
}

export async function stopScraper(platform: Platform): Promise<{ success: boolean }> {
  await delay(500);
  return { success: true };
}

export async function getScraperStatus(platform: Platform): Promise<ScraperStatus> {
  await delay(300);
  return {
    isRunning: false,
    startedAt: null,
    duration: { hours: 0, minutes: 30, seconds: 0 },
    postsScraped: 0,
    postsPerMinute: 0,
    elapsedTime: 0,
  };
}

export async function getDashboardStats(platform?: "all" | Platform): Promise<DashboardStats> {
  await delay(400);
  const filtered = !platform || platform === "all" ? mockPosts : mockPosts.filter((p) => p.platform === platform);
  const totalPosts = filtered.length;
  const uniqueUsers = new Set(filtered.map((p) => p.username)).size;
  const totalLinks = filtered.filter((p) => p.link).length;
  const averageLikes = totalPosts > 0 ? Math.round(filtered.reduce((s, p) => s + p.likes, 0) / totalPosts) : 0;

  return {
    totalPosts,
    uniqueUsers,
    totalLinks,
    averageLikes,
    postsOverTime: [
      { date: "Mon", posts: Math.round(totalPosts * 0.12) },
      { date: "Tue", posts: Math.round(totalPosts * 0.16) },
      { date: "Wed", posts: Math.round(totalPosts * 0.14) },
      { date: "Thu", posts: Math.round(totalPosts * 0.21) },
      { date: "Fri", posts: Math.round(totalPosts * 0.18) },
      { date: "Sat", posts: Math.round(totalPosts * 0.08) },
      { date: "Sun", posts: Math.round(totalPosts * 0.11) },
    ],
    likesDistribution: [
      { range: "0-500", count: filtered.filter((p) => p.likes < 500).length },
      { range: "500-1k", count: filtered.filter((p) => p.likes >= 500 && p.likes < 1000).length },
      { range: "1k-2k", count: filtered.filter((p) => p.likes >= 1000 && p.likes < 2000).length },
      { range: "2k-3k", count: filtered.filter((p) => p.likes >= 2000 && p.likes < 3000).length },
      { range: "3k-5k", count: filtered.filter((p) => p.likes >= 3000 && p.likes < 5000).length },
      { range: "5k+", count: filtered.filter((p) => p.likes >= 5000).length },
    ],
    topUsers: Object.entries(
      filtered.reduce<Record<string, number>>((acc, p) => {
        acc[p.username] = (acc[p.username] || 0) + 1;
        return acc;
      }, {})
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, posts]) => ({ name, posts })),
  };
}

export interface PostFilters {
  platform?: "all" | "twitter" | "instagram";
  search?: string;
  minLikes?: number;
  hasLink?: boolean;
}

export async function getPosts(filters?: PostFilters): Promise<Post[]> {
  await delay(400);
  let result = [...mockPosts];
  if (filters) {
    if (filters.platform && filters.platform !== "all") result = result.filter((p) => p.platform === filters.platform);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter((p) => p.username.toLowerCase().includes(q));
    }
    if (filters.minLikes) result = result.filter((p) => p.likes >= filters.minLikes!);
    if (filters.hasLink) result = result.filter((p) => p.link !== null);
  }
  return result;
}
