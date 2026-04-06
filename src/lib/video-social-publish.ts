/**
 * Video Social Media Publishing — auto-post videos to TikTok, YouTube Shorts, Instagram Reels
 *
 * Architecture:
 * - TikTok: Content Posting API (OAuth 2.0)
 * - YouTube: YouTube Data API v3 (OAuth 2.0)
 * - Instagram: Instagram Graph API via Facebook (OAuth 2.0)
 *
 * All require OAuth app registration. For now, we store connection status
 * and provide the UI flow. Actual API calls require OAuth tokens stored per user.
 */

export interface VideoSocialPlatform {
  id: "tiktok" | "youtube" | "instagram";
  name: string;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  connected: boolean;
  username?: string;
  maxDuration: number; // seconds
  formats: string[];
  aspectRatio: string;
  uploadUrl: string; // manual upload URL when not connected
}

export interface ScheduledVideoPost {
  id: string;
  platform: VideoSocialPlatform["id"];
  videoUrl: string;
  title: string;
  description: string;
  hashtags: string[];
  scheduledAt: string | null; // null = post immediately
  status: "draft" | "scheduled" | "posting" | "posted" | "failed";
  postedUrl?: string;
  error?: string;
  createdAt: string;
}

export const VIDEO_PLATFORMS: VideoSocialPlatform[] = [
  {
    id: "tiktok",
    name: "TikTok",
    color: "#ff0050",
    gradientFrom: "#ff0050",
    gradientTo: "#00f2ea",
    connected: false,
    maxDuration: 180,
    formats: ["mp4", "webm"],
    aspectRatio: "9:16",
    uploadUrl: "https://www.tiktok.com/upload",
  },
  {
    id: "youtube",
    name: "YouTube Shorts",
    color: "#ff0000",
    gradientFrom: "#ff0000",
    gradientTo: "#cc0000",
    connected: false,
    maxDuration: 60,
    formats: ["mp4"],
    aspectRatio: "9:16",
    uploadUrl: "https://www.youtube.com/upload",
  },
  {
    id: "instagram",
    name: "Instagram Reels",
    color: "#e1306c",
    gradientFrom: "#833ab4",
    gradientTo: "#fd1d1d",
    connected: false,
    maxDuration: 90,
    formats: ["mp4"],
    aspectRatio: "9:16",
    uploadUrl: "https://www.instagram.com/",
  },
];

const STORAGE_KEY = "zoobicon_video_social_posts";
const CONNECTIONS_KEY = "zoobicon_video_social_connections";

// --- Connection management (localStorage for now) ---

export function getConnections(): Record<string, { connected: boolean; username: string }> {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem(CONNECTIONS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function setConnection(platformId: string, username: string): void {
  if (typeof window === "undefined") return;
  const connections = getConnections();
  connections[platformId] = { connected: true, username };
  localStorage.setItem(CONNECTIONS_KEY, JSON.stringify(connections));
}

export function removeConnection(platformId: string): void {
  if (typeof window === "undefined") return;
  const connections = getConnections();
  delete connections[platformId];
  localStorage.setItem(CONNECTIONS_KEY, JSON.stringify(connections));
}

// --- Scheduled posts management (localStorage) ---

export function getScheduledPosts(): ScheduledVideoPost[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveScheduledPost(post: ScheduledVideoPost): void {
  if (typeof window === "undefined") return;
  const posts = getScheduledPosts();
  const idx = posts.findIndex((p) => p.id === post.id);
  if (idx >= 0) {
    posts[idx] = post;
  } else {
    posts.unshift(post);
  }
  // Keep last 50
  if (posts.length > 50) posts.splice(50);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

export function deleteScheduledPost(id: string): void {
  if (typeof window === "undefined") return;
  const posts = getScheduledPosts().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

// --- AI-generated hashtag suggestions based on video content ---

export function generateVideoHashtags(script: string, platform: VideoSocialPlatform["id"]): string[] {
  const words = script.toLowerCase().split(/\s+/);
  const topics = [
    { keywords: ["ai", "artificial", "intelligence", "machine", "learning"], tags: ["#AI", "#ArtificialIntelligence"] },
    { keywords: ["tech", "technology", "software", "app", "digital"], tags: ["#Tech", "#Technology"] },
    { keywords: ["business", "startup", "entrepreneur", "company"], tags: ["#Business", "#Startup", "#Entrepreneur"] },
    { keywords: ["marketing", "brand", "advertis", "promote"], tags: ["#Marketing", "#DigitalMarketing"] },
    { keywords: ["food", "restaurant", "cook", "recipe", "eat"], tags: ["#Food", "#Foodie", "#Recipe"] },
    { keywords: ["fitness", "health", "gym", "workout", "exercise"], tags: ["#Fitness", "#Health", "#Workout"] },
    { keywords: ["design", "creative", "art", "visual"], tags: ["#Design", "#Creative", "#Art"] },
    { keywords: ["education", "learn", "teach", "course", "tutorial"], tags: ["#Education", "#LearnOnTikTok"] },
    { keywords: ["finance", "money", "invest", "crypto", "trading"], tags: ["#Finance", "#Money", "#Investing"] },
    { keywords: ["travel", "trip", "destination", "explore"], tags: ["#Travel", "#Explore", "#Wanderlust"] },
  ];

  const platformTags: Record<string, string[]> = {
    tiktok: ["#fyp", "#foryou", "#viral"],
    youtube: ["#shorts", "#youtubeshorts", "#subscribe"],
    instagram: ["#reels", "#instareels", "#explore"],
  };

  const matched: string[] = [];
  for (const topic of topics) {
    if (topic.keywords.some((kw) => words.some((w) => w.includes(kw)))) {
      matched.push(...topic.tags);
    }
  }

  return [
    ...(platformTags[platform] || []),
    "#zoobicon",
    "#builtwithAI",
    ...matched,
  ].slice(0, 15);
}

// --- Generate platform-specific caption from script ---

export function generateVideoCaption(script: string, platform: VideoSocialPlatform["id"]): string {
  const maxLen: Record<string, number> = {
    tiktok: 2200,
    youtube: 5000,
    instagram: 2200,
  };

  // Extract first compelling sentence as hook
  const sentences = script.split(/[.!?]+/).filter((s) => s.trim().length > 10);
  const hook = sentences[0]?.trim() || script.slice(0, 100);

  const limit = maxLen[platform] || 2200;
  if (hook.length > limit) return hook.slice(0, limit - 3) + "...";
  return hook;
}

// --- Video series types ---

export interface VideoSeriesEpisode {
  number: number;
  title: string;
  script: string;
  hookLine: string;
  status: "draft" | "scripted" | "generated" | "posted";
}

export interface VideoSeries {
  id: string;
  name: string;
  description: string;
  topic: string;
  episodeCount: number;
  episodes: VideoSeriesEpisode[];
  style: string;
  platform: string;
  schedule: "daily" | "3x-week" | "weekly";
  createdAt: string;
}

const SERIES_STORAGE_KEY = "zoobicon_video_series";

export function getVideoSeries(): VideoSeries[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(SERIES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveVideoSeries(series: VideoSeries): void {
  if (typeof window === "undefined") return;
  const all = getVideoSeries();
  const idx = all.findIndex((s) => s.id === series.id);
  if (idx >= 0) {
    all[idx] = series;
  } else {
    all.unshift(series);
  }
  if (all.length > 20) all.splice(20);
  localStorage.setItem(SERIES_STORAGE_KEY, JSON.stringify(all));
}

export function deleteVideoSeries(id: string): void {
  if (typeof window === "undefined") return;
  const all = getVideoSeries().filter((s) => s.id !== id);
  localStorage.setItem(SERIES_STORAGE_KEY, JSON.stringify(all));
}
