export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  threshold: number;
  confetti?: boolean;
}

export interface UserStats {
  totalBuilds: number;
  totalDeploys: number;
  totalShares: number;
  totalViews: number;
  totalRemixes: number;
  streakDays: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first_build", title: "First Build!", description: "You generated your first website", icon: "Rocket", threshold: 1, confetti: true },
  { id: "five_builds", title: "Getting Started", description: "5 websites generated", icon: "Zap", threshold: 5 },
  { id: "ten_builds", title: "Builder", description: "10 websites generated", icon: "Hammer", threshold: 10 },
  { id: "twenty_five_builds", title: "Architect", description: "25 websites generated", icon: "Building2", threshold: 25 },
  { id: "fifty_builds", title: "Master Builder", description: "50 websites generated", icon: "Crown", threshold: 50 },
  { id: "first_deploy", title: "Live!", description: "Your first site is live on the web", icon: "Globe", threshold: 1, confetti: true },
  { id: "five_deploys", title: "Publisher", description: "5 sites deployed", icon: "Upload", threshold: 5 },
  { id: "first_share", title: "Socialite", description: "Shared your first site", icon: "Share2", threshold: 1 },
  { id: "streak_7", title: "On Fire!", description: "7-day build streak", icon: "Flame", threshold: 7 },
  { id: "views_100", title: "Getting Noticed", description: "Your sites hit 100 total views", icon: "Eye", threshold: 100 },
  { id: "views_1000", title: "Popular", description: "1,000 total views across all sites", icon: "TrendingUp", threshold: 1000 },
  { id: "first_remix", title: "Remixer", description: "Remixed someone else's site", icon: "GitFork", threshold: 1 },
];

const STORAGE_KEY = "zoobicon_achievements";
const BUILDS_KEY = "zoobicon_monthly_builds";
const STATS_KEY = "zoobicon_user_stats";

/** Get all unlocked achievement IDs from localStorage */
export function getUnlockedAchievements(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

/** Save an achievement as unlocked */
export function unlockAchievement(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const unlocked = getUnlockedAchievements();
    if (!unlocked.includes(id)) {
      unlocked.push(id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(unlocked));
    }
  } catch {
    /* ignore storage errors */
  }
}

/** Get aggregated user stats from localStorage */
export function getUserStats(): UserStats {
  if (typeof window === "undefined") {
    return { totalBuilds: 0, totalDeploys: 0, totalShares: 0, totalViews: 0, totalRemixes: 0, streakDays: 0 };
  }
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        totalBuilds: parsed.totalBuilds || 0,
        totalDeploys: parsed.totalDeploys || 0,
        totalShares: parsed.totalShares || 0,
        totalViews: parsed.totalViews || 0,
        totalRemixes: parsed.totalRemixes || 0,
        streakDays: parsed.streakDays || 0,
      };
    }
    // Fall back to monthly builds count
    const buildsRaw = localStorage.getItem(BUILDS_KEY);
    if (buildsRaw) {
      const builds = JSON.parse(buildsRaw);
      return { totalBuilds: builds.count || 0, totalDeploys: 0, totalShares: 0, totalViews: 0, totalRemixes: 0, streakDays: 0 };
    }
  } catch {
    /* ignore */
  }
  return { totalBuilds: 0, totalDeploys: 0, totalShares: 0, totalViews: 0, totalRemixes: 0, streakDays: 0 };
}

/** Update a specific stat and save */
export function incrementStat(key: keyof UserStats, amount: number = 1): UserStats {
  const stats = getUserStats();
  stats[key] = (stats[key] || 0) + amount;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch {
      /* ignore */
    }
  }
  return stats;
}

/** Map event names to the stats and achievement groups they affect */
const EVENT_MAP: Record<string, { stat: keyof UserStats; achievements: string[] }> = {
  build: { stat: "totalBuilds", achievements: ["first_build", "five_builds", "ten_builds", "twenty_five_builds", "fifty_builds"] },
  deploy: { stat: "totalDeploys", achievements: ["first_deploy", "five_deploys"] },
  share: { stat: "totalShares", achievements: ["first_share"] },
  remix: { stat: "totalRemixes", achievements: ["first_remix"] },
  views: { stat: "totalViews", achievements: ["views_100", "views_1000"] },
  streak: { stat: "streakDays", achievements: ["streak_7"] },
};

/** Check if any new achievements have been unlocked based on current stats. Returns newly unlocked achievements. */
export function checkAchievements(stats: UserStats): Achievement[] {
  const unlocked = getUnlockedAchievements();
  const newlyUnlocked: Achievement[] = [];

  for (const achievement of ACHIEVEMENTS) {
    if (unlocked.includes(achievement.id)) continue;

    let currentValue = 0;
    if (achievement.id.includes("build")) currentValue = stats.totalBuilds;
    else if (achievement.id.includes("deploy")) currentValue = stats.totalDeploys;
    else if (achievement.id.includes("share") || achievement.id === "first_share") currentValue = stats.totalShares;
    else if (achievement.id.includes("remix")) currentValue = stats.totalRemixes;
    else if (achievement.id.includes("views")) currentValue = stats.totalViews;
    else if (achievement.id.includes("streak")) currentValue = stats.streakDays;

    if (currentValue >= achievement.threshold) {
      unlockAchievement(achievement.id);
      newlyUnlocked.push(achievement);
    }
  }

  return newlyUnlocked;
}

/** Convenience: increment a stat by event name, then check for new achievements */
export function trackEvent(event: string, count: number = 1): { stats: UserStats; newAchievements: Achievement[] } {
  const mapping = EVENT_MAP[event];
  if (!mapping) return { stats: getUserStats(), newAchievements: [] };

  const stats = incrementStat(mapping.stat, count);

  // Also update monthly builds tracker for quota bar
  if (event === "build" && typeof window !== "undefined") {
    try {
      const now = new Date();
      const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const raw = localStorage.getItem("zoobicon_monthly_builds");
      let data = { period, count: 0 };
      if (raw) {
        const parsed = JSON.parse(raw);
        data = parsed.period === period ? parsed : { period, count: 0 };
      }
      data.count += count;
      localStorage.setItem("zoobicon_monthly_builds", JSON.stringify(data));
    } catch {
      /* ignore */
    }
  }

  const newAchievements = checkAchievements(stats);
  return { stats, newAchievements };
}
