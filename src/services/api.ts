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

const generateDummyPosts = (count: number): AllPost[] => {
  const platforms: any[] = ["Instagram", "Twitter", "Facebook", "Reddit"];
  const sources: any[] = ["Explore", "Search", "Home", "Profile"];
  const users = ["alpha_delta", "bravo_niner", "charlie_intel", "delta_hawk", "echo_whisper", "fox_trot"];
  const contents = [
    "Suspicious data packet intercepted at peripheral node.",
    "New intelligence report suggests rising geopolitical tensions.",
    "Social sentiment analysis indicates high risk for sector B.",
    "Intercepted encrypted message from high-value target.",
    "Monitoring unauthorized access attempts on infrastructure.",
    "Global OSINT signals show unusual activity in the region.",
    "Analyzing digital footprints for identified threat actors.",
    "Alert: Predictive modeling detects imminent supply chain disruption."
  ];

  return Array.from({ length: count }, (_, i) => ({
    platform: platforms[i % platforms.length],
    source: sources[i % sources.length],
    keyword: i % 3 === 0 ? "Security" : "Intelligence",
    user: users[i % users.length] + "_" + (i % 20),
    content: contents[i % contents.length] + ` (Intercept #${1000 + i})`,
    likes: Math.floor(Math.random() * 12000),
    date: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: `${Math.floor(Math.random() * 24)}:${Math.floor(Math.random() * 60)}:00`,
    url: `https://social.platform/posts/${i}`,
    reposts: Math.floor(Math.random() * 500),
    replies: Math.floor(Math.random() * 200),
    views: Math.floor(Math.random() * 50000),
    upvotes: Math.floor(Math.random() * 1000),
    comments: Math.floor(Math.random() * 100),
  }));
};

const DUMMY_ALL_POSTS: AllPost[] = generateDummyPosts(2000);

const DUMMY_STATS: DashboardStats = {
  totalPosts: 254820,
  uniqueUsers: 84210,
  totalLinks: 142900,
  averageLikes: 612,
  postsOverTime: [
    { date: "May 01", posts: 24500 },
    { date: "May 02", posts: 31200 },
    { date: "May 03", posts: 45600 },
    { date: "May 04", posts: 38900 },
    { date: "May 05", posts: 52100 },
    { date: "May 06", posts: 68400 },
    { date: "May 07", posts: 55200 },
  ],
  likesDistribution: [
    { range: "0-10", count: 85400 },
    { range: "11-50", count: 62300 },
    { range: "51-100", count: 41200 },
    { range: "101-500", count: 38500 },
    { range: "500+", count: 27420 },
  ],
  topUsers: [
    { name: "alpha_delta_1", posts: 4520, likes: 1200000 },
    { name: "bravo_niner_4", posts: 3850, likes: 850000 },
    { name: "charlie_intel_2", posts: 3120, likes: 920000 },
    { name: "delta_hawk_7", posts: 2850, likes: 780000 },
    { name: "echo_whisper_9", posts: 2110, likes: 650000 },
  ],
  sourceBreakdown: [
    { source: "Instagram", count: 84200 },
    { source: "Twitter", count: 76500 },
    { source: "Reddit", count: 58900 },
    { source: "Facebook", count: 35220 },
  ],
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
  cities: string[];
}

const generateGeoPosts = (count: number): PostGeo[] => {
  const locations = [
    // --- INDIA HIGH DENSITY (40 CITIES) ---
    { name: "Mumbai, India", country: "India", lat: 19.0760, lng: 72.8777 },
    { name: "Delhi, India", country: "India", lat: 28.6139, lng: 77.2090 },
    { name: "Bangalore, India", country: "India", lat: 12.9716, lng: 77.5946 },
    { name: "Hyderabad, India", country: "India", lat: 17.3850, lng: 78.4867 },
    { name: "Ahmedabad, India", country: "India", lat: 23.0225, lng: 72.5714 },
    { name: "Chennai, India", country: "India", lat: 13.0827, lng: 80.2707 },
    { name: "Kolkata, India", country: "India", lat: 22.5726, lng: 88.3639 },
    { name: "Surat, India", country: "India", lat: 21.1702, lng: 72.8311 },
    { name: "Pune, India", country: "India", lat: 18.5204, lng: 73.8567 },
    { name: "Jaipur, India", country: "India", lat: 26.9124, lng: 75.7873 },
    { name: "Lucknow, India", country: "India", lat: 26.8467, lng: 80.9462 },
    { name: "Kanpur, India", country: "India", lat: 26.4499, lng: 80.3319 },
    { name: "Nagpur, India", country: "India", lat: 21.1458, lng: 79.0882 },
    { name: "Indore, India", country: "India", lat: 22.7196, lng: 75.8577 },
    { name: "Thane, India", country: "India", lat: 19.2183, lng: 72.9781 },
    { name: "Bhopal, India", country: "India", lat: 23.2599, lng: 77.4126 },
    { name: "Visakhapatnam, India", country: "India", lat: 17.6868, lng: 83.2185 },
    { name: "Patna, India", country: "India", lat: 25.5941, lng: 85.1376 },
    { name: "Vadodara, India", country: "India", lat: 22.3072, lng: 73.1812 },
    { name: "Ghaziabad, India", country: "India", lat: 28.6692, lng: 77.4538 },
    { name: "Ludhiana, India", country: "India", lat: 30.9010, lng: 75.8573 },
    { name: "Agra, India", country: "India", lat: 27.1767, lng: 78.0081 },
    { name: "Nashik, India", country: "India", lat: 19.9975, lng: 73.7898 },
    { name: "Faridabad, India", country: "India", lat: 28.4089, lng: 77.3178 },
    { name: "Meerut, India", country: "India", lat: 28.9845, lng: 77.7064 },
    { name: "Rajkot, India", country: "India", lat: 22.3039, lng: 70.8022 },
    { name: "Kalyan, India", country: "India", lat: 19.2403, lng: 73.1305 },
    { name: "Vasai, India", country: "India", lat: 19.3919, lng: 72.8397 },
    { name: "Varanasi, India", country: "India", lat: 25.3176, lng: 82.9739 },
    { name: "Srinagar, India", country: "India", lat: 34.0837, lng: 74.7973 },
    { name: "Aurangabad, India", country: "India", lat: 19.8762, lng: 75.3433 },
    { name: "Dhanbad, India", country: "India", lat: 23.7957, lng: 86.4304 },
    { name: "Amritsar, India", country: "India", lat: 31.6340, lng: 74.8723 },
    { name: "Navi Mumbai, India", country: "India", lat: 19.0330, lng: 73.0297 },
    { name: "Prayagraj, India", country: "India", lat: 25.4358, lng: 81.8463 },
    { name: "Howrah, India", country: "India", lat: 22.5958, lng: 88.2636 },
    { name: "Ranchi, India", country: "India", lat: 23.3441, lng: 85.3096 },
    { name: "Gwalior, India", country: "India", lat: 26.2124, lng: 78.1772 },
    { name: "Jabalpur, India", country: "India", lat: 23.1815, lng: 79.9864 },
    { name: "Coimbatore, India", country: "India", lat: 11.0168, lng: 76.9558 },

    // --- GLOBAL STRATEGIC HUBs (20 CITIES) ---
    { name: "New York, USA", country: "USA", lat: 40.7128, lng: -74.0060 },
    { name: "London, UK", country: "UK", lat: 51.5074, lng: -0.1278 },
    { name: "Tokyo, Japan", country: "Japan", lat: 35.6762, lng: 139.6503 },
    { name: "Berlin, Germany", country: "Germany", lat: 52.5200, lng: 13.4050 },
    { name: "Paris, France", country: "France", lat: 48.8566, lng: 2.3522 },
    { name: "Sydney, Australia", country: "Australia", lat: -33.8688, lng: 151.2093 },
    { name: "Dubai, UAE", country: "UAE", lat: 25.2048, lng: 55.2708 },
    { name: "Moscow, Russia", country: "Russia", lat: 55.7558, lng: 37.6173 },
    { name: "Singapore", country: "Singapore", lat: 1.3521, lng: 103.8198 },
    { name: "Seoul, S.Korea", country: "S.Korea", lat: 37.5665, lng: 126.9780 },
    { name: "Istanbul, Turkey", country: "Turkey", lat: 41.0082, lng: 28.9784 },
    { name: "Cairo, Egypt", country: "Egypt", lat: 30.0444, lng: 31.2357 },
    { name: "Rio, Brazil", country: "Brazil", lat: -22.9068, lng: -43.1729 },
    { name: "Toronto, Canada", country: "Canada", lat: 43.6532, lng: -79.3832 },
    { name: "Mexico City, Mexico", country: "Mexico", lat: 19.4326, lng: -99.1332 },
    { name: "Buenos Aires, Argentina", country: "Argentina", lat: -34.6037, lng: -58.3816 },
    { name: "Cape Town, S.Africa", country: "S.Africa", lat: -33.9249, lng: 18.4241 },
    { name: "Nairobi, Kenya", country: "Kenya", lat: -1.2921, lng: 36.8219 },
    { name: "Tel Aviv, Israel", country: "Israel", lat: 32.0853, lng: 34.7818 },
    { name: "Jakarta, Indonesia", country: "Indonesia", lat: -6.2088, lng: 106.8456 },
  ];

  const platforms = ["Twitter", "Instagram", "Facebook", "Web"];
  const sentiments = ["Positive", "Negative", "Neutral", "Angry"];
  const scenarios = [
    "Civil unrest reported near central district. Visual confirmation pending.",
    "Unusual network activity spike detected in telecomm sector.",
    "Satellite imagery shows high-density gathering at restricted perimeter.",
    "Encrypted signal burst intercepted from transient mobile unit.",
    "Public sentiment shifting negative following policy leak. Monitoring key influencers.",
    "Critical infrastructure ping failure. Investigating potential cyber interference.",
    "Coordinated social campaign identified targeting local governance.",
    "Logistics anomaly detected in regional transport hub. Potential bypass attempt.",
  ];

  return Array.from({ length: count }, (_, i) => {
    const loc = locations[i % locations.length];
    const isHarmful = i % 7 === 0;
    return {
      id: `geo_${i}`,
      platform: platforms[i % platforms.length],
      user: `osint_eye_${i % 50}`,
      content: scenarios[i % scenarios.length],
      keyword: i % 2 === 0 ? "Security" : "Interference",
      source: "Global Intelligence",
      locationName: loc.name,
      country: loc.country,
      latitude: loc.lat,
      longitude: loc.lng,
      sentiment: sentiments[i % sentiments.length],
      isHarmful: isHarmful,
      harmfulSeverity: isHarmful ? (i % 3 === 0 ? "High" : "Medium") : "None",
      likes: Math.floor(Math.random() * 500),
      date: new Date().toISOString().split('T')[0],
      time: `${Math.floor(Math.random() * 24).toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}:00`,
    };
  });
};

const DUMMY_GEO_POSTS: PostGeo[] = generateGeoPosts(1500);

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
  const locations = [
    // --- INDIA HIGH DENSITY (40 CITIES) ---
    { name: "Mumbai", country: "India" },
    { name: "Delhi", country: "India" },
    { name: "Bangalore", country: "India" },
    { name: "Hyderabad", country: "India" },
    { name: "Ahmedabad", country: "India" },
    { name: "Chennai", country: "India" },
    { name: "Kolkata", country: "India" },
    { name: "Surat", country: "India" },
    { name: "Pune", country: "India" },
    { name: "Jaipur", country: "India" },
    { name: "Lucknow", country: "India" },
    { name: "Kanpur", country: "India" },
    { name: "Nagpur", country: "India" },
    { name: "Indore", country: "India" },
    { name: "Thane", country: "India" },
    { name: "Bhopal", country: "India" },
    { name: "Visakhapatnam", country: "India" },
    { name: "Patna", country: "India" },
    { name: "Vadodara", country: "India" },
    { name: "Ghaziabad", country: "India" },
    { name: "Ludhiana", country: "India" },
    { name: "Agra", country: "India" },
    { name: "Nashik", country: "India" },
    { name: "Faridabad", country: "India" },
    { name: "Meerut", country: "India" },
    { name: "Rajkot", country: "India" },
    { name: "Kalyan", country: "India" },
    { name: "Vasai", country: "India" },
    { name: "Varanasi", country: "India" },
    { name: "Srinagar", country: "India" },
    { name: "Aurangabad", country: "India" },
    { name: "Dhanbad", country: "India" },
    { name: "Amritsar", country: "India" },
    { name: "Navi Mumbai", country: "India" },
    { name: "Prayagraj", country: "India" },
    { name: "Howrah", country: "India" },
    { name: "Ranchi", country: "India" },
    { name: "Gwalior", country: "India" },
    { name: "Jabalpur", country: "India" },
    { name: "Coimbatore", country: "India" },

    // --- GLOBAL STRATEGIC HUBs ---
    { name: "New York", country: "USA" },
    { name: "London", country: "UK" },
    { name: "Tokyo", country: "Japan" },
    { name: "Berlin", country: "Germany" },
    { name: "Paris", country: "France" },
    { name: "Sydney", country: "Australia" },
    { name: "Dubai", country: "UAE" },
    { name: "Moscow", country: "Russia" },
    { name: "Singapore", country: "Singapore" },
    { name: "Seoul", country: "S.Korea" },
    { name: "Istanbul", country: "Turkey" },
    { name: "Cairo", country: "Egypt" },
    { name: "Rio", country: "Brazil" },
    { name: "Toronto", country: "Canada" },
    { name: "Mexico City", country: "Mexico" },
    { name: "Buenos Aires", country: "Argentina" },
    { name: "Cape Town", country: "S.Africa" },
    { name: "Nairobi", country: "Kenya" },
    { name: "Tel Aviv", country: "Israel" },
    { name: "Jakarta", country: "Indonesia" },
  ];

  // Group by country
  const countryGroups: Record<string, string[]> = {};
  locations.forEach(loc => {
    if (!countryGroups[loc.country]) countryGroups[loc.country] = [];
    if (!countryGroups[loc.country].includes(loc.name)) {
      countryGroups[loc.country].push(loc.name);
    }
  });

  return Object.entries(countryGroups).map(([country, cities]) => ({
    country,
    cities: cities.sort(),
    count: Math.floor(Math.random() * 800) + 100
  })).sort((a, b) => b.count - a.count);
}
