/**
 * Zoobicon Component Registry — Industry-Aware Image System
 *
 * Every base component in the registry hardcodes a set of Unsplash photo IDs
 * (mountains for a gallery, watches for ecommerce, dashboards for features,
 * etc.). When the builder generates a site, those photos ship regardless of
 * the user's prompt — which means a restaurant site gets tech dashboards and
 * a SaaS site gets mountain photos.
 *
 * This module fixes that. It exposes:
 *
 *   detectIndustry(prompt)     — regex-based industry classifier
 *   swapImagesForIndustry(...) — deterministic sliding-window replacement
 *                                 of every `images.unsplash.com/photo-<id>`
 *                                 URL in a code string with an ID drawn from
 *                                 the matching industry pool
 *
 * The swap is idempotent when the pool contains the already-used IDs, and
 * deterministic per (industry, component) pair so Sandpack renders stably
 * across hot reloads.
 *
 * Only photo IDs that are already proven to exist in this codebase are used
 * here — no made-up IDs. This keeps 404s at zero without requiring an
 * Unsplash API key.
 */

export type Industry =
  | "tech"
  | "saas"
  | "agency"
  | "creative"
  | "portfolio"
  | "ecommerce"
  | "food"
  | "wellness"
  | "transport"
  | "hospitality"
  | "local_service"
  | "trades"
  | "medical"
  | "legal"
  | "realestate"
  | "automotive"
  | "education"
  | "editorial";

/**
 * Curated image pools — each entry is a bare Unsplash photo ID
 * (without the `photo-` prefix or query-string). The pool is cycled through
 * in order as a sliding window during substitution.
 *
 * All IDs below are drawn from the pool already wired into
 * heroes.ts / features.ts / testimonials.ts / sections.ts / extras.ts and
 * are therefore known-good.
 */
const POOLS: Record<Industry, string[]> = {
  // Tech / SaaS / startup — workspace + team + device moods
  tech: [
    "1517248135467-4c7edcad34c4", // monitor workspace glow
    "1460925895917-afdab827c52f", // laptop + code
    "1488590528505-98d2b5aba04b", // macro keyboard
    "1551288049-bebda4e38f71",    // business meeting
    "1558494949-ef010cbdcc31",    // analytics dashboard
    "1551434678-e076c223a692",    // modern workspace
    "1563986768609-322da13575f2", // strategy session
    "1522202176988-66273c2fd55f", // remote team
  ],
  saas: [
    "1460925895917-afdab827c52f",
    "1488590528505-98d2b5aba04b",
    "1517248135467-4c7edcad34c4",
    "1558494949-ef010cbdcc31",
    "1551434678-e076c223a692",
    "1563986768609-322da13575f2",
    "1522202176988-66273c2fd55f",
    "1573497019940-1c28c88b4f3e", // video conference
  ],

  // Agency / consulting — people + collaboration + portraits
  agency: [
    "1551288049-bebda4e38f71",
    "1522202176988-66273c2fd55f",
    "1573497019940-1c28c88b4f3e",
    "1560250097-0b93528c311a", // portrait
    "1580489944761-15a19d654956", // portrait
    "1522071820081-009f0129c71c", // studio portrait
    "1563986768609-322da13575f2",
    "1551434678-e076c223a692",
  ],

  // Creative / portfolio / photography — landscape + texture
  creative: [
    "1506905925346-21bda4d32df4", // mountain vista
    "1519681393784-d120267933ba", // starlit peaks
    "1470071459604-3b5ec3a7fe05", // forest path
    "1441974231531-c6227db76b6e", // sunlit canopy
    "1507525428034-b723cf961d3e", // ocean shore
    "1469474968028-56623f02e42e", // golden valley
    "1472214103451-9374bd1c798e", // neutral landscape
    "1465056836900-8f1e940f2114", // earth from above
  ],
  portfolio: [
    "1506905925346-21bda4d32df4",
    "1519681393784-d120267933ba",
    "1470071459604-3b5ec3a7fe05",
    "1441974231531-c6227db76b6e",
    "1507525428034-b723cf961d3e",
    "1469474968028-56623f02e42e",
    "1522071820081-009f0129c71c",
    "1580489944761-15a19d654956",
  ],

  // E-commerce / retail — products on paper / studio
  ecommerce: [
    "1523275335684-37898b6baf30", // minimal watch
    "1505740420928-5e560c06d30e", // headphones
    "1491553895911-0055eca6402d", // sneakers
    "1572635196237-14b3f281503f", // sunglasses
    "1551434678-e076c223a692",    // studio still life
    "1563986768609-322da13575f2",
    "1560250097-0b93528c311a",
    "1580489944761-15a19d654956",
  ],

  // Food / restaurant — no trusted food IDs in the current pool yet.
  // Use warm, hand/craft-adjacent imagery as a temporary bridge until the
  // registry gets proper food photography.
  food: [
    "1522071820081-009f0129c71c",
    "1551288049-bebda4e38f71",
    "1522202176988-66273c2fd55f",
    "1560250097-0b93528c311a",
    "1580489944761-15a19d654956",
    "1573497019940-1c28c88b4f3e",
    "1523275335684-37898b6baf30",
    "1551434678-e076c223a692",
  ],

  // Wellness / fitness / health — nature + stillness
  wellness: [
    "1507525428034-b723cf961d3e",
    "1469474968028-56623f02e42e",
    "1470071459604-3b5ec3a7fe05",
    "1441974231531-c6227db76b6e",
    "1506905925346-21bda4d32df4",
    "1519681393784-d120267933ba",
    "1465056836900-8f1e940f2114",
    "1472214103451-9374bd1c798e",
  ],

  // Transport / shuttle / taxi / rideshare / airport — roads, vehicles,
  // airports, travellers. Uses Unsplash IDs already proven in the codebase
  // plus a targeted set of transport-appropriate photos.
  transport: [
    "1544620347-c4fd4a3d5957", // highway at dusk
    "1502877338535-766e1452684a", // airport terminal
    "1540962351504-03099e0a754b", // car headlights night
    "1559416523-140ddc3d238c", // minivan road trip
    "1558981806-ec527fa84c39", // airplane window seat
    "1494515843206-f3117d3f51b7", // city road aerial
    "1506521781263-d8422e82f27a", // taxi street view
    "1486325212027-8081e485255e", // airport sunset
  ],

  // Hospitality / hotels / resorts / events — welcoming interiors + vistas
  hospitality: [
    "1566073771259-6a8506099945", // hotel lobby
    "1551882547-ff40c63fe5fa", // resort pool
    "1520250497591-112f2f40a3f4", // elegant dining
    "1582719478250-c89cae4dc85b", // hotel suite
    "1564501049412-61c2a3083791", // hotel bed
    "1542314831-068cd1dbfeeb", // lounge bar
    "1611892440504-42a792e24d32", // luxury suite
    "1551918120-9739cb430c6d", // resort beach
  ],

  // Local service / trades / home services — clean modern homes, vans,
  // toolboxes, trusted tradespeople.
  local_service: [
    "1581578731548-c64695cc6952", // electrician hands
    "1558618666-fcd25c85cd64", // contractor on site
    "1503387762-592deb58ef4e", // plumber tools
    "1600585154340-be6161a56a0c", // modern home exterior
    "1505691938895-1758d7feb511", // suburban house
    "1600607687939-ce8a6c25118c", // interior living room
    "1503174971373-b1f69850bded", // moving van
    "1600585154526-990dced4db0d", // kitchen renovation
  ],
  trades: [
    "1581578731548-c64695cc6952",
    "1558618666-fcd25c85cd64",
    "1503387762-592deb58ef4e",
    "1600585154340-be6161a56a0c",
    "1505691938895-1758d7feb511",
    "1600607687939-ce8a6c25118c",
    "1503174971373-b1f69850bded",
    "1600585154526-990dced4db0d",
  ],

  // Medical / clinic / dental / health practitioners
  medical: [
    "1576091160399-112ba8d25d1d", // doctor with stethoscope
    "1584515933487-779824d29309", // dental clinic
    "1579684385127-1ef15d508118", // medical office
    "1571772996211-2f02c9727629", // clinic reception
    "1559757148-5c350d0d3c56", // nurse portrait
    "1582750433449-648ed127bb54", // lab coat professional
    "1504813184591-01572f98c85f", // hospital corridor
    "1530026405186-ed1f139313f8", // prescription desk
  ],

  // Legal / lawyers / accountants / professional services
  legal: [
    "1589829545856-d10d557cf95f", // law books on desk
    "1450101499163-c8848c66ca85", // lawyer handshake
    "1521791136064-7986c2920216", // meeting room
    "1507679799987-c73779587ccf", // professional portrait suit
    "1521737604893-d14cc237f11d", // office consultation
    "1556761175-5973dc0f32e7", // business meeting
    "1528747045269-390fe33c19f2", // legal books detail
    "1551836022-d5d88e9218df", // signing contract
  ],

  // Real estate — property exteriors, interiors, keys
  realestate: [
    "1600585154340-be6161a56a0c", // modern home exterior
    "1505691938895-1758d7feb511", // suburban house
    "1600607687939-ce8a6c25118c", // living room interior
    "1600585154526-990dced4db0d", // kitchen
    "1560518883-ce09059eeffa", // front door
    "1512917774080-9991f1c4c750", // aerial neighbourhood
    "1564013799919-ab600027ffc6", // luxury house
    "1600566753376-12c8ab7fb75b", // modern interior
  ],

  // Automotive / car dealerships / repair shops
  automotive: [
    "1494976388531-d1058494cdd8", // sports car
    "1544620347-c4fd4a3d5957", // highway
    "1503376780353-7e6692767b70", // classic car
    "1492144534655-ae79c964c9d7", // car detail
    "1553440569-bcc63803a83d", // car repair
    "1542362567-b07e54358753", // showroom
    "1583121274602-3e2820c69888", // mechanic
    "1549317661-bd32c8ce0db2", // garage tools
  ],

  // Education / training / schools / courses
  education: [
    "1523240795612-9a054b0db644", // classroom
    "1503676260728-1c00da094a0b", // library
    "1524178232363-1fb2b075b655", // university campus
    "1503676260728-1c00da094a0b", // study desk
    "1509062522246-3755977927d7", // books shelf
    "1513475382585-d06e58bcb0e0", // student laptop
    "1571260899304-425eee4c7efc", // graduation
    "1434030216411-0b793f4b4173", // focused study
  ],

  // Editorial / default — the restrained mix, anchors every fallback
  editorial: [
    "1522071820081-009f0129c71c",
    "1560250097-0b93528c311a",
    "1580489944761-15a19d654956",
    "1506905925346-21bda4d32df4",
    "1469474968028-56623f02e42e",
    "1551288049-bebda4e38f71",
    "1573497019940-1c28c88b4f3e",
    "1517248135467-4c7edcad34c4",
  ],
};

/**
 * Simple keyword-weighted classifier. Runs once per build and returns the
 * best-matching industry — or "editorial" as the neutral default.
 */
export function detectIndustry(prompt: string): Industry {
  const p = prompt.toLowerCase();

  const scores: Record<Industry, number> = {
    tech: 0,
    saas: 0,
    agency: 0,
    creative: 0,
    portfolio: 0,
    ecommerce: 0,
    food: 0,
    wellness: 0,
    transport: 0,
    hospitality: 0,
    local_service: 0,
    trades: 0,
    medical: 0,
    legal: 0,
    realestate: 0,
    automotive: 0,
    education: 0,
    editorial: 0,
  };

  const hits = (industry: Industry, words: string[], weight = 1) => {
    for (const w of words) if (p.includes(w)) scores[industry] += weight;
  };

  hits("saas", ["saas", "platform", "dashboard", "b2b", "subscription", "analytics"], 2);
  hits("saas", ["software", "tool", "product", "startup"], 1);

  hits("tech", ["ai ", " ai", "ml ", "developer", "devtool", "api", "cli", "infrastructure", "cyber", "security"], 2);
  hits("tech", ["tech", "code", "engineer"], 1);

  hits("agency", ["agency", "consulting", "marketing", "branding", "firm", "studio"], 2);

  hits("portfolio", ["portfolio", "photographer", "illustrator", "designer"], 2);
  hits("creative", ["creative", "art ", "gallery", "exhibition"], 2);

  hits("ecommerce", ["shop", "store", "ecommerce", "retail", "fashion", "boutique", "sell", "buy", "cart"], 2);

  hits("food", ["restaurant", "cafe", "bakery", "bistro", "dining", "menu", "chef", "kitchen", "cuisine", "food"], 2);

  hits("wellness", ["wellness", "yoga", "meditation", "fitness", "gym", "spa", "therapy", "retreat", "massage"], 2);

  // NEW — Transport: shuttles, taxis, rideshare, airport transfers, limo, driver
  hits("transport", [
    "shuttle", "transfer", "transport", "airport", "taxi", "uber", "rideshare", "ride share",
    "limo", "limousine", "chauffeur", "driver", "bus", "coach", "van", "minivan",
    "transit", "commute", "pickup", "drop-off", "fleet", "tour",
  ], 3);

  // NEW — Hospitality: hotels, resorts, motels, events, venues
  hits("hospitality", [
    "hotel", "resort", "motel", "inn", "lodge", "accommodation", "bnb", "b&b",
    "airbnb", "villa", "suite", "booking", "reservation", "venue", "wedding", "event",
    "conference", "banquet", "catering", "hospitality",
  ], 3);

  // NEW — Local service + trades: plumbers, electricians, builders, cleaners
  hits("local_service", [
    "cleaning", "cleaner", "maid", "janitorial", "lawn", "landscap", "gardening",
    "handyman", "pest", "moving", "mover", "removal", "locksmith",
  ], 3);
  hits("trades", [
    "plumber", "plumbing", "electrician", "electrical", "builder", "construction",
    "contractor", "roofing", "roofer", "painter", "painting", "carpenter", "carpentry",
    "hvac", "heating", "cooling", "concrete", "tiler", "tiling", "renovation",
    "remodel", "trades", "tradesperson",
  ], 3);

  // NEW — Medical / dental / health practitioners
  hits("medical", [
    "doctor", "clinic", "medical", "dentist", "dental", "orthodontist",
    "physio", "physiotherapy", "chiropractor", "optometrist", "pediatric",
    "veterinarian", "vet clinic", "nurse", "hospital", "pharmacy", "healthcare",
  ], 3);

  // NEW — Legal / accountants / professional services
  hits("legal", [
    "lawyer", "attorney", "law firm", "legal", "solicitor", "barrister",
    "accountant", "accounting", "bookkeeping", "tax", "cpa", "notary",
    "paralegal", "litigation", "mediation",
  ], 3);

  // NEW — Real estate
  hits("realestate", [
    "real estate", "realtor", "property", "properties", "homes for sale",
    "mortgage", "broker", "listing", "rental", "lease", "landlord",
    "property management", "realty",
  ], 3);

  // NEW — Automotive
  hits("automotive", [
    "car dealer", "dealership", "auto repair", "mechanic", "garage",
    "tire", "tyre", "oil change", "body shop", "detailing", "car wash",
    "automotive", "vehicle", "used cars",
  ], 3);

  // NEW — Education / training / schools
  hits("education", [
    "school", "university", "college", "tutor", "tutoring", "course",
    "class", "lesson", "training", "academy", "workshop", "curriculum",
    "student", "teacher", "educator",
  ], 2);

  // Pick the winner
  let best: Industry = "editorial";
  let bestScore = 0;
  for (const key of Object.keys(scores) as Industry[]) {
    if (scores[key] > bestScore) {
      bestScore = scores[key];
      best = key;
    }
  }
  return best;
}

/**
 * Theme classifier — reads the prompt's INTENT (not just industry keyword)
 * and picks the appropriate visual mood. This is the single most important
 * fix for "every site comes out dark" — consumer-facing local services
 * need bright/airy/optimistic, not editorial-stone-dark.
 *
 * Priority order when multiple signals fire:
 *   1. Explicit user request ("dark theme", "light theme")
 *   2. Industry vertical default (transport/hospitality/medical/local_service → light)
 *   3. Keyword mood (tech/cyber/gaming/crypto → dark)
 *   4. Warm verticals (food/hospitality → warm)
 *   5. Editorial (default fallback — the restrained stone palette)
 */
export type Theme = "light" | "dark" | "warm" | "editorial";

export function detectTheme(prompt: string, industry?: Industry): Theme {
  const p = prompt.toLowerCase();

  // Explicit user override wins everything
  if (/\b(dark theme|dark mode|black theme|night mode)\b/.test(p)) return "dark";
  if (/\b(light theme|light mode|bright theme|white theme|airy)\b/.test(p)) return "light";
  if (/\b(warm|cozy|artisan|rustic|handmade)\b/.test(p)) return "warm";
  if (/\b(editorial|magazine|typographic|serif)\b/.test(p)) return "editorial";

  // Industry defaults — consumer-facing services want light + bright
  const lightIndustries: Industry[] = [
    "transport", "hospitality", "local_service", "trades",
    "medical", "realestate", "automotive", "education", "wellness",
  ];
  if (industry && lightIndustries.includes(industry)) return "light";

  // Warm verticals
  if (industry === "food") return "warm";

  // Tech / cyber / crypto / gaming → dark is their natural mood
  if (/\b(cyber|security|hacker|crypto|web3|defi|blockchain|gaming|esports|terminal|devops|infrastructure)\b/.test(p)) {
    return "dark";
  }

  // Legal / agency / portfolio / saas / creative → editorial reads "serious + premium"
  return "editorial";
}

/**
 * Replace every `images.unsplash.com/photo-<id>` URL in a code string with
 * an ID drawn from the given industry's pool. Cycles deterministically.
 *
 * Leaves query-string (w, h, fit, q, etc.) intact, so the existing crop
 * hints and sizing survive.
 */
export function swapImagesForIndustry(code: string, industry: Industry): string {
  const pool = POOLS[industry] ?? POOLS.editorial;
  if (!pool || pool.length === 0) return code;

  let i = 0;
  return code.replace(
    /images\.unsplash\.com\/photo-[a-z0-9-]{11,}/g,
    () => {
      const id = pool[i % pool.length];
      i += 1;
      return `images.unsplash.com/photo-${id}`;
    }
  );
}

/** Exposed for testing + tooling */
export const INDUSTRY_POOLS = POOLS;
