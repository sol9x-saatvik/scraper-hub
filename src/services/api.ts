// Mock API service layer — replace with real backend calls later

export interface Post {
  id: string;
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
  duration: number;
  postsScraped: number;
  postsPerMinute: number;
  timeElapsed: number;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const mockPosts: Post[] = Array.from({ length: 48 }, (_, i) => ({
  id: `post-${i + 1}`,
  username: ["@techguru", "@datascience", "@webdev", "@airesearch", "@cloudops", "@devops_ninja", "@ml_engineer", "@fullstack"][i % 8],
  caption: [
    "Exploring new frameworks for 2025 🚀",
    "Machine learning pipelines are getting faster",
    "Just deployed a new microservice architecture",
    "The future of AI is here and it's incredible",
    "Cloud-native development best practices",
    "Kubernetes tips every developer should know",
    "Neural networks explained in simple terms",
    "Building scalable APIs with Spring Boot",
  ][i % 8],
  likes: Math.floor(Math.random() * 5000) + 100,
  comments: Math.floor(Math.random() * 300) + 10,
  link: i % 3 === 0 ? `https://example.com/post/${i + 1}` : null,
  scrapedAt: new Date(Date.now() - i * 3600000).toISOString(),
}));

export async function startScraper(): Promise<{ success: boolean }> {
  await delay(500);
  return { success: true };
}

export async function stopScraper(): Promise<{ success: boolean }> {
  await delay(500);
  return { success: true };
}

export async function getScraperStatus(): Promise<ScraperStatus> {
  await delay(300);
  return {
    isRunning: false,
    startedAt: null,
    duration: 30,
    postsScraped: 0,
    postsPerMinute: 0,
    timeElapsed: 0,
  };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  await delay(400);
  return {
    totalPosts: 1247,
    uniqueUsers: 312,
    totalLinks: 438,
    averageLikes: 1823,
    postsOverTime: [
      { date: "Mon", posts: 45 },
      { date: "Tue", posts: 62 },
      { date: "Wed", posts: 58 },
      { date: "Thu", posts: 89 },
      { date: "Fri", posts: 76 },
      { date: "Sat", posts: 34 },
      { date: "Sun", posts: 51 },
    ],
    likesDistribution: [
      { range: "0-500", count: 120 },
      { range: "500-1k", count: 340 },
      { range: "1k-2k", count: 280 },
      { range: "2k-3k", count: 190 },
      { range: "3k-5k", count: 95 },
      { range: "5k+", count: 42 },
    ],
    topUsers: [
      { name: "@techguru", posts: 89 },
      { name: "@datascience", posts: 76 },
      { name: "@webdev", posts: 64 },
      { name: "@airesearch", posts: 52 },
      { name: "@cloudops", posts: 41 },
    ],
  };
}

export async function getPosts(): Promise<Post[]> {
  await delay(400);
  return mockPosts;
}
