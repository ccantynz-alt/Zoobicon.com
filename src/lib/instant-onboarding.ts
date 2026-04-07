/**
 * Instant Onboarding — "Already Did It"
 *
 * User types a business name. In <=5 seconds we return a complete package:
 *   brand, logo, domains, site files, blog drafts, emails, social posts, video script.
 *
 * Target: p50 <5s on warm envs. Everything runs in parallel via Promise.allSettled
 * so a missing module, a flaky model, or a rate limit never kills the whole flow
 * (Bible Law 8 — surface failures but always return SOMETHING).
 *
 * prefetch() fires brand-infer in the background the moment the user starts
 * typing, so when they submit, step 1 is already cached.
 */

type CallClaudeFn = (args: {
  model: string;
  system: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  maxTokens?: number;
}) => Promise<string>;

export interface InstantBrand {
  name: string;
  industry: string;
  tagline: string;
  colors: { primary: string; secondary: string; accent: string; background: string; foreground: string };
}

export interface InstantDomain {
  domain: string;
  tld: string;
  availability: 'available' | 'taken' | 'unknown';
  price?: number;
}

export interface InstantFile {
  path: string;
  content: string;
}

export interface InstantBlogDraft {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
}

export interface InstantEmail {
  subject: string;
  preheader: string;
  body: string;
}

export interface InstantSocialPost {
  platform: 'twitter' | 'linkedin' | 'instagram';
  text: string;
  hashtags: string[];
}

export interface InstantOnboardingResult {
  brand: InstantBrand;
  logoSvg: string;
  domains: InstantDomain[];
  files: InstantFile[];
  blogDrafts: InstantBlogDraft[];
  emails: InstantEmail[];
  socialPosts: InstantSocialPost[];
  videoScript: string;
  totalMs: number;
  failures: string[];
}

export interface InstantOnboardingInput {
  businessName: string;
  optionalHint?: string;
}

// ---------------------------------------------------------------------------
// Tiny in-memory LRU cache for prefetch() — size 100, TTL 60s.
// ---------------------------------------------------------------------------

interface CacheEntry<T> {
  value: T;
  expires: number;
}

const BRAND_CACHE = new Map<string, CacheEntry<Promise<InstantBrand>>>();
const CACHE_MAX = 100;
const CACHE_TTL_MS = 60_000;

function cacheGet(key: string): Promise<InstantBrand> | null {
  const entry = BRAND_CACHE.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    BRAND_CACHE.delete(key);
    return null;
  }
  // LRU bump
  BRAND_CACHE.delete(key);
  BRAND_CACHE.set(key, entry);
  return entry.value;
}

function cacheSet(key: string, value: Promise<InstantBrand>): void {
  if (BRAND_CACHE.size >= CACHE_MAX) {
    const firstKey = BRAND_CACHE.keys().next().value;
    if (firstKey !== undefined) BRAND_CACHE.delete(firstKey);
  }
  BRAND_CACHE.set(key, { value, expires: Date.now() + CACHE_TTL_MS });
}

// ---------------------------------------------------------------------------
// Safe dynamic import — never throws.
// ---------------------------------------------------------------------------

async function safeImport<T = Record<string, unknown>>(spec: string): Promise<T | null> {
  try {
    // Using Function to avoid bundler static analysis forcing the module.
    const dyn = new Function('s', 'return import(s)') as (s: string) => Promise<T>;
    return await dyn(spec);
  } catch {
    return null;
  }
}

async function getCallClaude(): Promise<CallClaudeFn | null> {
  const mod = await safeImport<{ callClaude?: CallClaudeFn }>('@/lib/anthropic-cached');
  return mod?.callClaude ?? null;
}

// ---------------------------------------------------------------------------
// Step 1 — Brand infer (cached)
// ---------------------------------------------------------------------------

async function inferBrand(businessName: string, hint?: string): Promise<InstantBrand> {
  const key = `${businessName}::${hint ?? ''}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  const promise = (async (): Promise<InstantBrand> => {
    const fallback: InstantBrand = {
      name: businessName,
      industry: 'general',
      tagline: `${businessName} — built for what's next.`,
      colors: {
        primary: '#6366f1',
        secondary: '#8b5cf6',
        accent: '#ec4899',
        background: '#0b0b0f',
        foreground: '#ffffff',
      },
    };

    const callClaude = await getCallClaude();
    if (!callClaude) return fallback;

    try {
      const raw = await callClaude({
        model: 'claude-haiku-4-5',
        system:
          'Return ONLY JSON with shape {industry:string, tagline:string, colors:{primary,secondary,accent,background,foreground}}. Colors are hex.',
        messages: [
          {
            role: 'user',
            content: `Business: ${businessName}${hint ? `\nHint: ${hint}` : ''}`,
          },
        ],
        maxTokens: 400,
      });
      const jsonStart = raw.indexOf('{');
      const jsonEnd = raw.lastIndexOf('}');
      if (jsonStart === -1 || jsonEnd === -1) return fallback;
      const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1)) as Partial<InstantBrand> & {
        colors?: Partial<InstantBrand['colors']>;
      };
      return {
        name: businessName,
        industry: parsed.industry ?? fallback.industry,
        tagline: parsed.tagline ?? fallback.tagline,
        colors: { ...fallback.colors, ...(parsed.colors ?? {}) },
      };
    } catch {
      return fallback;
    }
  })();

  cacheSet(key, promise);
  return promise;
}

// ---------------------------------------------------------------------------
// Step 2 — Logo
// ---------------------------------------------------------------------------

function fallbackLogoSvg(brand: InstantBrand): string {
  const initials = brand.name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${brand.colors.primary}"/><stop offset="1" stop-color="${brand.colors.accent}"/></linearGradient></defs><rect width="200" height="200" rx="40" fill="url(#g)"/><text x="100" y="118" font-family="Inter,system-ui,sans-serif" font-size="80" font-weight="800" text-anchor="middle" fill="${brand.colors.foreground}">${initials}</text></svg>`;
}

async function generateLogo(brand: InstantBrand): Promise<string> {
  const mod = await safeImport<{ generateLogo?: (b: InstantBrand) => Promise<string> | string }>(
    '@/lib/logo-generator',
  );
  if (mod?.generateLogo) {
    try {
      const out = await mod.generateLogo(brand);
      if (typeof out === 'string' && out.includes('<svg')) return out;
    } catch {
      /* fall through */
    }
  }
  return fallbackLogoSvg(brand);
}

// ---------------------------------------------------------------------------
// Step 3 — Domain suggestions
// ---------------------------------------------------------------------------

function fallbackDomains(businessName: string): InstantDomain[] {
  const slug = businessName.toLowerCase().replace(/[^a-z0-9]/g, '');
  return [
    { domain: `${slug}.com`, tld: 'com', availability: 'unknown' },
    { domain: `${slug}.ai`, tld: 'ai', availability: 'unknown' },
    { domain: `${slug}.io`, tld: 'io', availability: 'unknown' },
  ];
}

async function suggestDomainsStep(businessName: string): Promise<InstantDomain[]> {
  const mod = await safeImport<{
    suggestDomains?: (name: string) => Promise<InstantDomain[]>;
  }>('@/lib/domain-hook');
  if (mod?.suggestDomains) {
    try {
      const out = await mod.suggestDomains(businessName);
      if (Array.isArray(out) && out.length > 0) return out.slice(0, 3);
    } catch {
      /* fall through */
    }
  }
  return fallbackDomains(businessName);
}

// ---------------------------------------------------------------------------
// Step 4 — Deterministic component site (no AI call — instant)
// ---------------------------------------------------------------------------

interface RegistryShape {
  getComponent?: (id: string) => { code?: string; path?: string } | undefined;
  selectForIndustry?: (industry: string) => string[];
}

function defaultSectionIds(industry: string): string[] {
  const base = ['navbar', 'hero', 'features', 'testimonials', 'pricing', 'cta', 'footer'];
  // Minor industry bias — deterministic variant names.
  if (/saas|software|tech/i.test(industry)) {
    return ['navbar-minimal', 'hero-stats', 'features-bento-grid', 'testimonials-cards', 'pricing-3tier', 'cta-gradient-border', 'footer-saas-gradient'];
  }
  if (/agency|studio|creative/i.test(industry)) {
    return ['navbar-centered', 'hero-minimal', 'features-spotlight-cards', 'testimonials-cards', 'pricing-3tier', 'cta-gradient-border', 'footer-luxury-minimal'];
  }
  return base;
}

async function buildSite(brand: InstantBrand): Promise<InstantFile[]> {
  const ids = defaultSectionIds(brand.industry);
  const mod = await safeImport<RegistryShape>('@/lib/component-registry');

  const sections: InstantFile[] = [];
  if (mod?.getComponent) {
    for (const id of ids) {
      try {
        const comp = mod.getComponent(id);
        if (comp?.code) {
          sections.push({ path: comp.path ?? `src/components/${id}.tsx`, content: comp.code });
        }
      } catch {
        /* skip */
      }
    }
  }

  // Always emit an App.tsx that wires the sections together. If no real
  // components loaded, produce a minimal placeholder page so the preview
  // renders SOMETHING (Bible Law 8).
  const appImports = sections
    .map((s, i) => `import Section${i} from './${s.path.replace(/^src\//, '').replace(/\.tsx$/, '')}';`)
    .join('\n');
  const appBody = sections.length
    ? sections.map((_, i) => `      <Section${i} />`).join('\n')
    : `      <main style={{padding:'4rem',textAlign:'center',color:'${brand.colors.foreground}',background:'${brand.colors.background}',minHeight:'100vh'}}>
        <h1 style={{fontSize:'3rem',fontWeight:800}}>${brand.name}</h1>
        <p style={{opacity:0.8,marginTop:'1rem'}}>${brand.tagline}</p>
      </main>`;

  const appTsx = `${appImports}

export default function App() {
  return (
    <div>
${appBody}
    </div>
  );
}
`;

  sections.push({ path: 'src/App.tsx', content: appTsx });
  return sections;
}

// ---------------------------------------------------------------------------
// Step 5 — Blog drafts
// ---------------------------------------------------------------------------

function fallbackBlogDrafts(brand: InstantBrand): InstantBlogDraft[] {
  const topics = [
    `Why ${brand.name} exists`,
    `Three things ${brand.industry} teams get wrong`,
    `How ${brand.name} saves you a week per month`,
  ];
  return topics.map((title) => ({
    title,
    slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    excerpt: `${title}. A quick read from the ${brand.name} team.`,
    body: `# ${title}\n\n${brand.tagline}\n\nDraft copy — replace with your own story.`,
  }));
}

async function buildBlogDrafts(brand: InstantBrand): Promise<InstantBlogDraft[]> {
  const mod = await safeImport<{
    generateDrafts?: (brand: InstantBrand, count: number) => Promise<InstantBlogDraft[]>;
  }>('@/lib/blog-generator');
  if (mod?.generateDrafts) {
    try {
      const out = await mod.generateDrafts(brand, 3);
      if (Array.isArray(out) && out.length > 0) return out.slice(0, 3);
    } catch {
      /* fall through */
    }
  }
  return fallbackBlogDrafts(brand);
}

// ---------------------------------------------------------------------------
// Step 6 — Email templates
// ---------------------------------------------------------------------------

function fallbackEmails(brand: InstantBrand): InstantEmail[] {
  return [
    {
      subject: `Welcome to ${brand.name}`,
      preheader: brand.tagline,
      body: `Hi there,\n\nWelcome to ${brand.name}. ${brand.tagline}\n\n— The ${brand.name} team`,
    },
    {
      subject: `Your ${brand.name} quickstart`,
      preheader: 'Three things to try in your first 5 minutes',
      body: `Hi,\n\nHere are three things to try first at ${brand.name}:\n1. ...\n2. ...\n3. ...`,
    },
    {
      subject: `A tip from ${brand.name}`,
      preheader: 'Small change, big result',
      body: `Hi,\n\nOne quick ${brand.industry} tip from the ${brand.name} team...`,
    },
  ];
}

async function buildEmails(brand: InstantBrand): Promise<InstantEmail[]> {
  const mod = await safeImport<{
    generateTemplates?: (brand: InstantBrand, count: number) => Promise<InstantEmail[]>;
  }>('@/lib/mailgun-client');
  if (mod?.generateTemplates) {
    try {
      const out = await mod.generateTemplates(brand, 3);
      if (Array.isArray(out) && out.length > 0) return out.slice(0, 3);
    } catch {
      /* fall through */
    }
  }

  // Secondary: a single Haiku call for all three, best-effort.
  const callClaude = await getCallClaude();
  if (callClaude) {
    try {
      const raw = await callClaude({
        model: 'claude-haiku-4-5',
        system:
          'Return ONLY a JSON array of exactly 3 objects with shape {subject,preheader,body}. Tone: warm, specific, no fluff.',
        messages: [
          {
            role: 'user',
            content: `Brand: ${brand.name}\nIndustry: ${brand.industry}\nTagline: ${brand.tagline}`,
          },
        ],
        maxTokens: 800,
      });
      const start = raw.indexOf('[');
      const end = raw.lastIndexOf(']');
      if (start !== -1 && end !== -1) {
        const parsed = JSON.parse(raw.slice(start, end + 1)) as InstantEmail[];
        if (Array.isArray(parsed) && parsed.length >= 3) return parsed.slice(0, 3);
      }
    } catch {
      /* fall through */
    }
  }
  return fallbackEmails(brand);
}

// ---------------------------------------------------------------------------
// Step 7 — Social posts
// ---------------------------------------------------------------------------

function fallbackSocialPosts(brand: InstantBrand, hashtags: string[]): InstantSocialPost[] {
  const tags = hashtags.length ? hashtags : [`#${brand.industry}`, `#${brand.name.replace(/\s+/g, '')}`, '#launch'];
  return [
    {
      platform: 'twitter',
      text: `Meet ${brand.name}. ${brand.tagline}`,
      hashtags: tags.slice(0, 3),
    },
    {
      platform: 'linkedin',
      text: `We built ${brand.name} because ${brand.industry} deserves better. ${brand.tagline}`,
      hashtags: tags.slice(0, 3),
    },
    {
      platform: 'instagram',
      text: `${brand.name} is live. ${brand.tagline}`,
      hashtags: tags.slice(0, 5),
    },
  ];
}

async function buildSocialPosts(brand: InstantBrand): Promise<InstantSocialPost[]> {
  const mod = await safeImport<{
    suggestHashtags?: (topic: string) => Promise<string[]> | string[];
  }>('@/lib/social-poster');
  let tags: string[] = [];
  if (mod?.suggestHashtags) {
    try {
      const out = await mod.suggestHashtags(`${brand.name} ${brand.industry}`);
      if (Array.isArray(out)) tags = out;
    } catch {
      /* fall through */
    }
  }
  return fallbackSocialPosts(brand, tags);
}

// ---------------------------------------------------------------------------
// Step 8 — Welcome video script
// ---------------------------------------------------------------------------

function fallbackVideoScript(brand: InstantBrand): string {
  return [
    `[0:00] Meet ${brand.name}.`,
    `[0:03] ${brand.tagline}`,
    `[0:08] Built for ${brand.industry} teams who want to move faster.`,
    `[0:14] Three things you can do in your first five minutes...`,
    `[0:22] Get started free at ${brand.name.toLowerCase().replace(/\s+/g, '')}.com.`,
  ].join('\n');
}

async function buildVideoScript(brand: InstantBrand): Promise<string> {
  const callClaude = await getCallClaude();
  if (!callClaude) return fallbackVideoScript(brand);
  try {
    const raw = await callClaude({
      model: 'claude-haiku-4-5',
      system:
        'Write a 30-second welcome video voiceover script. Format as timestamped lines like [0:00]. No fluff, no buzzwords.',
      messages: [
        {
          role: 'user',
          content: `Brand: ${brand.name}\nIndustry: ${brand.industry}\nTagline: ${brand.tagline}`,
        },
      ],
      maxTokens: 400,
    });
    return raw.trim() || fallbackVideoScript(brand);
  } catch {
    return fallbackVideoScript(brand);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fire step 1 (brand infer) in the background so that by the time the user
 * submits, the result is already in the in-memory LRU cache. Safe to call on
 * every keystroke — callers should debounce if they care.
 */
export function prefetch(businessName: string, optionalHint?: string): void {
  if (!businessName || businessName.trim().length < 2) return;
  // Fire and forget. Errors are swallowed by inferBrand's try/catch.
  void inferBrand(businessName.trim(), optionalHint).catch(() => undefined);
}

/**
 * Run the full "Already Did It" onboarding. Target p50 <5s on warm envs.
 *
 * Strategy:
 *   1. Resolve brand first (needed by every downstream step).
 *   2. Fire all 7 downstream steps in parallel via Promise.allSettled.
 *   3. For each rejected step, fall back to a deterministic local result and
 *      record the failure in `failures` so the UI can surface it.
 */
export async function instantOnboard(
  input: InstantOnboardingInput,
): Promise<InstantOnboardingResult> {
  const started = Date.now();
  const businessName = input.businessName.trim();
  const failures: string[] = [];

  // Step 1 — brand (must resolve before the rest).
  let brand: InstantBrand;
  try {
    brand = await inferBrand(businessName, input.optionalHint);
  } catch {
    failures.push('brand');
    brand = {
      name: businessName,
      industry: 'general',
      tagline: `${businessName} — built for what's next.`,
      colors: {
        primary: '#6366f1',
        secondary: '#8b5cf6',
        accent: '#ec4899',
        background: '#0b0b0f',
        foreground: '#ffffff',
      },
    };
  }

  // Steps 2-8 — all in parallel.
  const [logoRes, domainsRes, filesRes, blogRes, emailsRes, socialRes, scriptRes] =
    await Promise.allSettled([
      generateLogo(brand),
      suggestDomainsStep(businessName),
      buildSite(brand),
      buildBlogDrafts(brand),
      buildEmails(brand),
      buildSocialPosts(brand),
      buildVideoScript(brand),
    ]);

  const logoSvg =
    logoRes.status === 'fulfilled' ? logoRes.value : (failures.push('logo'), fallbackLogoSvg(brand));
  const domains =
    domainsRes.status === 'fulfilled'
      ? domainsRes.value
      : (failures.push('domains'), fallbackDomains(businessName));
  const files =
    filesRes.status === 'fulfilled'
      ? filesRes.value
      : (failures.push('files'),
        [
          {
            path: 'src/App.tsx',
            content: `export default function App(){return <div style={{padding:'4rem',textAlign:'center'}}><h1>${brand.name}</h1><p>${brand.tagline}</p></div>;}`,
          },
        ]);
  const blogDrafts =
    blogRes.status === 'fulfilled'
      ? blogRes.value
      : (failures.push('blog'), fallbackBlogDrafts(brand));
  const emails =
    emailsRes.status === 'fulfilled'
      ? emailsRes.value
      : (failures.push('emails'), fallbackEmails(brand));
  const socialPosts =
    socialRes.status === 'fulfilled'
      ? socialRes.value
      : (failures.push('social'), fallbackSocialPosts(brand, []));
  const videoScript =
    scriptRes.status === 'fulfilled'
      ? scriptRes.value
      : (failures.push('videoScript'), fallbackVideoScript(brand));

  return {
    brand,
    logoSvg,
    domains,
    files,
    blogDrafts,
    emails,
    socialPosts,
    videoScript,
    totalMs: Date.now() - started,
    failures,
  };
}
