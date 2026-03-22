// ---------------------------------------------------------------------------
// Onboarding State Management
//
// Tracks first-time user onboarding checklist progress, user segmentation,
// and Pro trial eligibility. All state persisted in localStorage.
// ---------------------------------------------------------------------------

export type UserSegment = "freelancer" | "agency" | "business" | "creator";

export type OnboardingStep =
  | "create_site"
  | "deploy_site"
  | "share_site"
  | "invite_friend"
  | "try_generator";

export interface OnboardingState {
  completed: string[];
  dismissed: boolean;
  segment?: UserSegment;
  proTrialUnlocked: boolean;
  proTrialExpiresAt?: string;
  startedAt: string;
}

export interface DashboardConfig {
  welcomeMessage: string;
  recommendedGenerators: string[];
  quickActions: { label: string; href: string; icon: string }[];
  featuredTemplate: string;
}

const STORAGE_KEY = "zoobicon_onboarding";
const ALL_STEPS: OnboardingStep[] = [
  "create_site",
  "deploy_site",
  "share_site",
  "invite_friend",
  "try_generator",
];

const PRO_TRIAL_DAYS = 7;

function getDefaultState(): OnboardingState {
  return {
    completed: [],
    dismissed: false,
    proTrialUnlocked: false,
    startedAt: new Date().toISOString(),
  };
}

export function getOnboardingState(): OnboardingState {
  if (typeof window === "undefined") return getDefaultState();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultState();
    const parsed = JSON.parse(raw);
    return { ...getDefaultState(), ...parsed };
  } catch {
    return getDefaultState();
  }
}

function saveState(state: OnboardingState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage full or unavailable */
  }
}

export function completeOnboardingStep(step: string): void {
  const state = getOnboardingState();
  if (state.completed.includes(step)) return;

  state.completed = [...state.completed, step];

  // Check if all 5 steps are complete — unlock Pro trial
  if (
    state.completed.length >= ALL_STEPS.length &&
    !state.proTrialUnlocked
  ) {
    state.proTrialUnlocked = true;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + PRO_TRIAL_DAYS);
    state.proTrialExpiresAt = expiresAt.toISOString();
  }

  saveState(state);
}

export function dismissOnboarding(): void {
  const state = getOnboardingState();
  state.dismissed = true;
  saveState(state);
}

export function setUserSegment(segment: string): void {
  const state = getOnboardingState();
  state.segment = segment as UserSegment;
  saveState(state);
}

export function isOnboardingComplete(): boolean {
  const state = getOnboardingState();
  return state.completed.length >= ALL_STEPS.length;
}

export function checkProTrialEligibility(): boolean {
  const state = getOnboardingState();
  if (!state.proTrialUnlocked || !state.proTrialExpiresAt) return false;
  return new Date(state.proTrialExpiresAt) > new Date();
}

// Generator recommendations per segment
const SEGMENT_GENERATORS: Record<UserSegment, string[]> = {
  freelancer: [
    "portfolio",
    "landing",
    "blog",
    "saas",
    "booking",
    "invoice",
  ],
  agency: [
    "multi-page-site",
    "fullstack-app",
    "ecommerce-store",
    "agency-portfolio",
    "white-label",
    "client-portal",
  ],
  business: [
    "landing",
    "restaurant",
    "realestate",
    "booking",
    "ecommerce-store",
    "directory",
  ],
  creator: [
    "portfolio",
    "blog",
    "landing",
    "event",
    "newsletter",
    "link-in-bio",
  ],
};

export function getRecommendedGenerators(segment: string): string[] {
  return SEGMENT_GENERATORS[segment as UserSegment] || SEGMENT_GENERATORS.creator;
}

// Personalized dashboard config per segment
const DASHBOARD_CONFIGS: Record<UserSegment, DashboardConfig> = {
  freelancer: {
    welcomeMessage: "Ready to build something great for your clients?",
    recommendedGenerators: SEGMENT_GENERATORS.freelancer,
    quickActions: [
      { label: "Build a Portfolio", href: "/builder?template=portfolio", icon: "Briefcase" },
      { label: "Create Landing Page", href: "/builder?template=landing", icon: "Layout" },
      { label: "View Generators", href: "/generators", icon: "Grid" },
    ],
    featuredTemplate: "portfolio",
  },
  agency: {
    welcomeMessage: "Scale your agency with AI-powered builds.",
    recommendedGenerators: SEGMENT_GENERATORS.agency,
    quickActions: [
      { label: "Agency Dashboard", href: "/agencies", icon: "Building2" },
      { label: "Bulk Generate", href: "/builder", icon: "Layers" },
      { label: "White-Label Setup", href: "/agencies", icon: "Palette" },
    ],
    featuredTemplate: "agency-portfolio",
  },
  business: {
    welcomeMessage: "Let's get your business online in minutes.",
    recommendedGenerators: SEGMENT_GENERATORS.business,
    quickActions: [
      { label: "Build Your Website", href: "/builder", icon: "Globe" },
      { label: "Browse Templates", href: "/builder?tab=templates", icon: "LayoutTemplate" },
      { label: "Get a Domain", href: "/domains", icon: "Link" },
    ],
    featuredTemplate: "landing",
  },
  creator: {
    welcomeMessage: "Create, share, and grow your online presence.",
    recommendedGenerators: SEGMENT_GENERATORS.creator,
    quickActions: [
      { label: "Build a Site", href: "/builder", icon: "Sparkles" },
      { label: "Try Generators", href: "/generators", icon: "Wand2" },
      { label: "Explore Templates", href: "/builder?tab=templates", icon: "LayoutTemplate" },
    ],
    featuredTemplate: "blog",
  },
};

export function getPersonalizedDashboardConfig(segment: string): DashboardConfig {
  return (
    DASHBOARD_CONFIGS[segment as UserSegment] || DASHBOARD_CONFIGS.creator
  );
}

export { ALL_STEPS };
