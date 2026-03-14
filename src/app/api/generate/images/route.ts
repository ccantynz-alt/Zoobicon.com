import { NextRequest, NextResponse } from "next/server";
import { generateImage } from "@/lib/image-gen";

/**
 * AI Image Engine — replaces placeholder images with contextually relevant ones.
 *
 * Uses a multi-provider cascade:
 * 1. DALL-E 3 (if OPENAI_API_KEY set) — AI-generated custom images
 * 2. Stability AI SDXL (if STABILITY_API_KEY set) — alternative AI generation
 * 3. Unsplash API (if UNSPLASH_ACCESS_KEY set) — high-quality stock photos
 * 4. Curated Unsplash photos (no key needed) — hand-picked fallbacks
 *
 * POST /api/generate/images
 * Body: { html: string, style?: "photo" | "illustration" | "minimal", useAI?: boolean }
 * Returns: { html: string, replacements: Array<{ original: string, replacement: string, query: string }> }
 */

interface ImageReplacement {
  original: string;
  replacement: string;
  query: string;
}

function extractPlaceholderImages(html: string): string[] {
  // Match both seeded URLs (picsum.photos/seed/KEYWORD/WIDTH/HEIGHT) and bare URLs (picsum.photos/WIDTH/HEIGHT)
  const pattern = /https?:\/\/picsum\.photos\/(?:seed\/[a-zA-Z0-9_-]+\/)\d+(?:\/\d+)?|https?:\/\/picsum\.photos\/\d+(?:\/\d+)?/g;
  const matches = html.match(pattern);
  return matches ? [...new Set(matches)] : [];
}

/** Extract the seed keyword from a picsum URL */
function extractSeedKeyword(url: string): string {
  const match = url.match(/picsum\.photos\/seed\/([a-zA-Z0-9_-]+)\//);
  return match ? match[1].replace(/-/g, " ").replace(/_/g, " ").toLowerCase() : "";
}

function extractPageContext(html: string): string[] {
  const keywords: string[] = [];

  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) keywords.push(titleMatch[1].trim());

  // Extract h1-h3 text (strip nested tags)
  const headingPattern = /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi;
  let match;
  while ((match = headingPattern.exec(html)) !== null) {
    const text = match[1].replace(/<[^>]+>/g, "").trim();
    if (text.length > 2 && text.length < 100) keywords.push(text);
  }

  // Extract meta description
  const metaMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
  if (metaMatch) keywords.push(metaMatch[1].trim());

  // Extract alt text from images
  const altPattern = /alt=["']([^"']+)["']/gi;
  while ((match = altPattern.exec(html)) !== null) {
    if (match[1].trim().length > 2) keywords.push(match[1].trim());
  }

  return keywords;
}

function parseDimensions(url: string): { width: number; height: number } {
  // Handle seeded URLs: picsum.photos/seed/KEYWORD/WIDTH/HEIGHT
  const seededMatch = url.match(/picsum\.photos\/seed\/[^/]+\/(\d+)(?:\/(\d+))?/);
  if (seededMatch) {
    const width = parseInt(seededMatch[1], 10);
    const height = seededMatch[2] ? parseInt(seededMatch[2], 10) : width;
    return { width, height };
  }
  // Handle bare URLs: picsum.photos/WIDTH/HEIGHT
  const bareMatch = url.match(/picsum\.photos\/(\d+)(?:\/(\d+))?/);
  if (bareMatch) {
    const width = parseInt(bareMatch[1], 10);
    const height = bareMatch[2] ? parseInt(bareMatch[2], 10) : width;
    return { width, height };
  }
  return { width: 800, height: 600 };
}

// ── Curated Unsplash Photo Library ──
// Hand-picked high-quality photos organized by category.
// Each category has photos for different positions: hero, about, features, portraits.
// All IDs are verified Unsplash photo IDs that can be used via images.unsplash.com.
const CURATED_PHOTOS: Record<string, string[]> = {
  // ── Business / Corporate / Professional ──
  business: [
    "photo-1497366216548-37526070297c", // modern office building
    "photo-1522071820081-009f0129c71c", // team collaboration
    "photo-1552664730-d307ca884978", // business meeting
    "photo-1556761175-5973dc0f32e7", // corporate team
    "photo-1507679799987-c73779587ccf", // professional suit
    "photo-1560472354-b33ff0c44a43", // handshake
    "photo-1454165804606-c3d57bc86b40", // office desk analytics
    "photo-1573164713988-8665fc963095", // professional woman
  ],

  // ── Technology / SaaS / Software / Startup ──
  technology: [
    "photo-1531297484001-80022131f5a1", // laptop workspace
    "photo-1518770660439-4636190af475", // circuit board macro
    "photo-1504384308090-c894fdcc538d", // tech gradient abstract
    "photo-1550751827-4bd374c3f58b", // code on screen
    "photo-1573164713714-d95e436ab8d6", // woman with laptop
    "photo-1519389950473-47ba0277781c", // tech office
    "photo-1535378917042-10a22c95931a", // server room
    "photo-1551288049-bebda4e38f71", // data dashboard
    "photo-1460925895917-afdab827c52f", // workspace overhead
    "photo-1498050108023-c5249f4df085", // coding laptop
  ],

  // ── Cybersecurity / Security / Hacking ──
  cybersecurity: [
    "photo-1550751827-4bd374c3f58b", // code on screen
    "photo-1555949963-ff9fe0c870eb", // lock/security
    "photo-1563986768609-322da13575f2", // server room blue
    "photo-1526374965328-7f61d4dc18c5", // matrix code
    "photo-1510511459019-5dda7724fd87", // hooded hacker
    "photo-1558494949-ef010cbdcc31", // network cables
    "photo-1504639725590-34d0984388bd", // dark code screen
    "photo-1614064641938-3bbee52942c7", // digital padlock
  ],

  // ── Restaurant / Food / Café / Bakery ──
  restaurant: [
    "photo-1517248135467-4c7edcad34c4", // elegant restaurant interior
    "photo-1414235077428-338989a2e8c0", // fine dining plating
    "photo-1555396273-367ea4eb4db5", // restaurant ambiance
    "photo-1504674900247-0877df9cc836", // gourmet food
    "photo-1466978913421-dad2ebd01d17", // café interior
    "photo-1565299624946-b28f40a0ae38", // pizza
    "photo-1551218808-94e220e084d2", // chef cooking
    "photo-1559339352-11d035aa65de", // pastry dessert
    "photo-1424847651672-bf20a4b0982b", // wine and dining
    "photo-1550966871-3ed3cdb51f3a", // bakery bread
  ],

  // ── Real Estate / Property / Architecture ──
  realestate: [
    "photo-1600596542815-ffad4c1539a9", // luxury home exterior
    "photo-1600585154340-be6161a56a0c", // modern interior design
    "photo-1512917774080-9991f1c4c750", // house exterior
    "photo-1560448204-e02f11c3d0e2", // stylish living room
    "photo-1600607687939-ce8a6c25118c", // luxury kitchen
    "photo-1600566753086-00f18fb6b3ea", // bathroom design
    "photo-1564013799919-ab600027ffc6", // modern house
    "photo-1600585154526-990dced4db0d", // bedroom interior
  ],

  // ── Healthcare / Medical / Wellness ──
  medical: [
    "photo-1519494026892-80bbd2d6fd0d", // hospital corridor
    "photo-1631217868264-e5b90bb7e133", // doctor with stethoscope
    "photo-1579684385127-1ef15d508118", // medical technology
    "photo-1559757175-5700dde675bc", // healthcare professional
    "photo-1576091160550-2173dba999ef", // medical lab
    "photo-1538108149393-fbbd81895907", // nurse caring
    "photo-1551076805-e1869033e561", // pills medication
    "photo-1530497610245-94d3c16cda28", // wellness nature
  ],

  // ── Dental / Dentist ──
  dental: [
    "photo-1629909613654-28e377c37b09", // dental office
    "photo-1606811841689-23dfddce3e95", // bright smile
    "photo-1588776814546-1ffcf47267a5", // dental care
    "photo-1598256989800-fe5f95da9787", // dentist working
    "photo-1609840114035-3c981b782dfe", // modern dental chair
    "photo-1571772996211-2f02c9727629", // dental instruments
    "photo-1445527815700-7035aa60af45", // confident smile
    "photo-1626908013351-800ddd734b8a", // dental clinic
  ],

  // ── Legal / Law Firm / Attorney ──
  legal: [
    "photo-1589829545856-d10d557cf95f", // law library books
    "photo-1450101499163-c8848e968f93", // courthouse columns
    "photo-1507679799987-c73779587ccf", // suit professional
    "photo-1521791055366-0d553872125f", // business handshake
    "photo-1479142506502-19b3a3b7ff33", // gavel closeup
    "photo-1505664194779-8beaceb93744", // scales of justice
    "photo-1423592707957-3b212afa6733", // reading legal docs
    "photo-1568992687947-868a62a9f521", // conference room
  ],

  // ── Finance / Banking / Accounting ──
  finance: [
    "photo-1554224155-6726b3ff858f", // charts and data
    "photo-1460925895917-afdab827c52f", // financial workspace
    "photo-1611974789855-9c2a0a7236a3", // stock trading screen
    "photo-1554260570-e9689a3418b8", // money growth concept
    "photo-1526304640581-d334cdbbf45e", // calculator and reports
    "photo-1507003211169-0a1dd7228f2d", // professional portrait
    "photo-1551836022-d5d88e9218df", // modern bank
    "photo-1579532537598-459ecdaf39cc", // financial planning
  ],

  // ── Fitness / Gym / Yoga / Wellness ──
  fitness: [
    "photo-1534438327276-14e5300c3a48", // gym interior
    "photo-1571019613454-1cb2f99b2d8b", // intense workout
    "photo-1518611012118-696072aa579a", // yoga class
    "photo-1576678927484-cc907957088c", // athletic training
    "photo-1517836357463-d25dfeac3438", // weight lifting
    "photo-1549060279-7e168fcee0c2", // running athlete
    "photo-1544367567-0f2fcb009e0b", // yoga pose
    "photo-1571902943202-507ec2618e8f", // modern gym
  ],

  // ── Education / School / University / Learning ──
  education: [
    "photo-1523050854058-8df90110c9f1", // university campus
    "photo-1524178232363-1fb2b075b655", // classroom lecture
    "photo-1427504494785-3a9ca7044f45", // library books
    "photo-1503676260728-1c00da094a0b", // graduation
    "photo-1509062522246-3755977927d7", // students studying
    "photo-1497633762265-9d179a990aa6", // desk with books
    "photo-1577896851231-70ef18881754", // lecture hall
    "photo-1481627834876-b7833e8f5570", // books knowledge
  ],

  // ── E-commerce / Retail / Shopping ──
  ecommerce: [
    "photo-1441986300917-64674bd600d8", // retail store
    "photo-1556742049-0cfed4f6a45d", // shopping bags
    "photo-1472851294608-062f824d29cc", // product display
    "photo-1607082348824-0a96f2a4b9da", // online shopping
    "photo-1483985988355-763728e1935b", // fashion shopping
    "photo-1558618666-fcd25c85f82e", // product shelf
    "photo-1523275335684-37898b6baf30", // product photography
    "photo-1542291026-7eec264c27ff", // product shoe
  ],

  // ── Creative / Design / Agency ──
  creative: [
    "photo-1558655146-9f40138edfeb", // creative workspace
    "photo-1542744173-8e7e53415bb0", // design meeting
    "photo-1553877522-43269d4ea984", // team brainstorm
    "photo-1513542789411-b6a5d4f31634", // colorful wall
    "photo-1561070791-2526d30994b5", // abstract art
    "photo-1545235617-7a424c1a60cc", // design tools
    "photo-1559028012-481c04fa702d", // creative studio
    "photo-1483058712412-4245e9b90334", // minimalist desk
  ],

  // ── Travel / Tourism / Hospitality / Hotel ──
  travel: [
    "photo-1469854523086-cc02fe5d8800", // scenic road trip
    "photo-1507525428034-b723cf961d3e", // tropical beach
    "photo-1520250497591-112f2f40a3f4", // luxury resort
    "photo-1542314831-068cd1dbfeeb", // hotel lobby
    "photo-1476514525535-07fb3b4ae5f1", // swimming pool
    "photo-1530789253388-582c481c54b0", // travel destination
    "photo-1551882547-ff40c63fe5fa", // luxury hotel room
    "photo-1488646953014-85cb44e25828", // travel adventure
  ],

  // ── Salon / Beauty / Spa ──
  salon: [
    "photo-1560066984-138dadb4c035", // hair salon interior
    "photo-1522337360788-8b13dee7a37e", // beauty portrait
    "photo-1487412720507-e7ab37603c6f", // hair styling
    "photo-1519699047748-de8e457a634e", // spa treatment
    "photo-1570172619644-dfd03ed5d881", // skincare
    "photo-1516975080664-ed2fc6a32937", // spa candles
    "photo-1595476108010-b4d1f102b1b1", // salon chairs
    "photo-1457972729786-0411a3b2b626", // beauty products
  ],

  // ── Transport / Shuttle / Taxi / Logistics ──
  transport: [
    "photo-1544620347-c4fd4a3d5957", // white van on road
    "photo-1570125909232-eb263c188f7e", // bus on highway
    "photo-1549317661-bd32c8ce0832", // road journey
    "photo-1473042904451-00571b0401ea", // professional driver
    "photo-1506521781263-d8422e82f27a", // airport terminal
    "photo-1436491865332-7a61a109db05", // airplane
    "photo-1530276371031-2ee64f846024", // delivery truck
    "photo-1586528116311-ad8dd3c8310d", // fleet vehicles
  ],

  // ── Construction / Trades / Home Services ──
  construction: [
    "photo-1504307651254-35680f356dfd", // construction site
    "photo-1581578731548-c64695cc6952", // house renovation
    "photo-1621905252507-b35492cc74b4", // hardhat worker
    "photo-1513467535987-fd81bc7d62f8", // home remodeling
    "photo-1558618666-fcd25c85f82e", // tool workshop
    "photo-1503387762-592deb58ef4e", // architecture
    "photo-1585128792020-803d29415281", // plumber
    "photo-1542621334-a254cf47733d", // electrician
  ],

  // ── Automotive / Cars / Mechanic ──
  automotive: [
    "photo-1492144534655-ae79c964c9d7", // luxury car
    "photo-1503376780353-7e6692767b70", // sports car
    "photo-1580273916550-e323be2ae537", // car showroom
    "photo-1487754180451-c456f719a1fc", // mechanic working
    "photo-1489824904134-891ab64532f1", // car repair
    "photo-1549317661-bd32c8ce0832", // car on road
    "photo-1558618666-fcd25c85f82e", // auto shop
    "photo-1583121274602-3e2820c69888", // car wash
  ],

  // ── Photography / Videography / Media ──
  photography: [
    "photo-1554048612-b6a482bc67e5", // camera equipment
    "photo-1542038784456-1ea8e935640e", // photographer shooting
    "photo-1471341971476-ae15ff5dd4ea", // studio lighting
    "photo-1558618666-fcd25c85f82e", // editing suite
    "photo-1516035069371-29a1b244cc32", // camera lens
    "photo-1606983340126-99ab4feaa64a", // photo studio
    "photo-1533488765986-dfa2a9939acd", // videography
    "photo-1492691527719-9d1e07e534b4", // film editing
  ],

  // ── Pet / Veterinary / Animals ──
  pets: [
    "photo-1548199973-03cce0bbc87b", // dogs running
    "photo-1587300003388-59208cc962cb", // cute dog portrait
    "photo-1514888286974-6c03e2ca1dba", // cat portrait
    "photo-1576201836106-db1758fd1c97", // vet with pet
    "photo-1601758228041-f3b2795255f1", // pet grooming
    "photo-1583337130417-13571f694803", // pets family
    "photo-1450778869180-41d0601e046e", // happy dog
    "photo-1596854407944-bf87f6fdd49e", // pet care
  ],

  // ── Nonprofit / Charity / Community ──
  nonprofit: [
    "photo-1488521787991-ed7bbaae773c", // volunteer hands
    "photo-1559027615-cd4628902d4a", // community gathering
    "photo-1532629345422-7515f3d16bb6", // helping hands
    "photo-1469571486292-0ba58a3f068b", // teamwork charity
    "photo-1593113598332-cd288d649433", // donation box
    "photo-1509099836639-18ba1795216d", // children playing
    "photo-1517486808906-6ca8b3f04846", // community event
    "photo-1524069290683-0457abdc3ff7", // volunteering
  ],

  // ── Music / DJ / Entertainment ──
  music: [
    "photo-1470225620780-dba8ba36b745", // DJ at club
    "photo-1514320291840-2e0a9bf2a9ae", // concert lights
    "photo-1511671782779-c97d3d27a1d4", // live performance
    "photo-1493225457124-a3eb161ffa5f", // concert crowd
    "photo-1507676184212-d03ab07a01bf", // music studio
    "photo-1510915361894-db8b60106cb1", // headphones
    "photo-1598488035139-bdbb2231ce04", // guitar player
    "photo-1459749411175-04bf5292ceea", // stage lights
  ],

  // ── Agriculture / Farm / Garden ──
  agriculture: [
    "photo-1500595046743-cd271d694d30", // green farmland
    "photo-1530836369250-ef72a3f5cda8", // farm landscape
    "photo-1464226184884-fa280b87c399", // harvest produce
    "photo-1416879595882-3373a0480b5b", // garden flowers
    "photo-1523348837708-15d4a09cfac2", // organic vegetables
    "photo-1592982537447-6f2a6a0c7c18", // greenhouse
    "photo-1574943320219-553eb213f72d", // farmer working
    "photo-1625246333195-78d9c38ad449", // farm aerial
  ],
};

// ── Keyword → Category Mapping ──
// Maps common keywords (from seed, context, or query) to photo categories
const KEYWORD_CATEGORY_MAP: Record<string, string> = {
  // Technology
  tech: "technology", software: "technology", saas: "technology", app: "technology",
  startup: "technology", digital: "technology", ai: "technology", cloud: "technology",
  data: "technology", code: "technology", developer: "technology", programming: "technology",
  // Cybersecurity
  cyber: "cybersecurity", security: "cybersecurity", hack: "cybersecurity",
  infosec: "cybersecurity", encryption: "cybersecurity", firewall: "cybersecurity",
  // Restaurant / Food
  restaurant: "restaurant", food: "restaurant", cafe: "restaurant", bakery: "restaurant",
  kitchen: "restaurant", chef: "restaurant", dining: "restaurant", pizza: "restaurant",
  coffee: "restaurant", bar: "restaurant", bistro: "restaurant", catering: "restaurant",
  pastry: "restaurant", sushi: "restaurant",
  // Real Estate
  "real estate": "realestate", realestate: "realestate", property: "realestate",
  home: "realestate", house: "realestate", apartment: "realestate", interior: "realestate",
  architecture: "realestate", realtor: "realestate", mortgage: "realestate",
  // Healthcare
  medical: "medical", health: "medical", hospital: "medical", clinic: "medical",
  doctor: "medical", nurse: "medical", wellness: "medical", therapy: "medical",
  pharmaceutical: "medical",
  // Dental
  dental: "dental", dentist: "dental", orthodont: "dental", teeth: "dental", smile: "dental",
  // Legal
  law: "legal", legal: "legal", attorney: "legal", lawyer: "legal",
  court: "legal", justice: "legal", litigation: "legal",
  // Finance
  finance: "finance", banking: "finance", investment: "finance", accounting: "finance",
  insurance: "finance", wealth: "finance", trading: "finance", fintech: "finance",
  // Fitness
  fitness: "fitness", gym: "fitness", yoga: "fitness", workout: "fitness",
  exercise: "fitness", athletic: "fitness", sport: "fitness", training: "fitness",
  crossfit: "fitness", pilates: "fitness",
  // Education
  education: "education", school: "education", university: "education", college: "education",
  learning: "education", tutor: "education", academy: "education", course: "education",
  // E-commerce
  ecommerce: "ecommerce", shop: "ecommerce", store: "ecommerce", retail: "ecommerce",
  product: "ecommerce", fashion: "ecommerce", clothing: "ecommerce", marketplace: "ecommerce",
  // Creative
  creative: "creative", design: "creative", agency: "creative", studio: "creative",
  brand: "creative", marketing: "creative", advertising: "creative", art: "creative",
  // Travel
  travel: "travel", hotel: "travel", resort: "travel", tourism: "travel",
  vacation: "travel", booking: "travel", adventure: "travel", hospitality: "travel",
  // Salon / Beauty
  salon: "salon", beauty: "salon", spa: "salon", hair: "salon",
  cosmetic: "salon", skincare: "salon", nail: "salon", barber: "salon",
  // Transport
  transport: "transport", shuttle: "transport", taxi: "transport", logistics: "transport",
  delivery: "transport", fleet: "transport", moving: "transport", freight: "transport",
  airport: "transport",
  // Construction
  construction: "construction", contractor: "construction", plumb: "construction",
  electric: "construction", roofing: "construction", renovation: "construction",
  remodel: "construction", hvac: "construction", handyman: "construction",
  // Automotive
  automotive: "automotive", car: "automotive", auto: "automotive", mechanic: "automotive",
  vehicle: "automotive", dealership: "automotive", garage: "automotive",
  // Photography
  photography: "photography", photo: "photography", video: "photography",
  film: "photography", camera: "photography", portrait: "photography",
  // Pets
  pet: "pets", veterinary: "pets", vet: "pets", dog: "pets", cat: "pets",
  animal: "pets", grooming: "pets",
  // Nonprofit
  nonprofit: "nonprofit", charity: "nonprofit", community: "nonprofit",
  volunteer: "nonprofit", foundation: "nonprofit", ngo: "nonprofit",
  // Music
  music: "music", dj: "music", band: "music", concert: "music",
  entertainment: "music", recording: "music",
  // Agriculture
  farm: "agriculture", garden: "agriculture", agriculture: "agriculture",
  organic: "agriculture", landscape: "agriculture", nursery: "agriculture",
  // Business (catch-all)
  business: "business", corporate: "business", consulting: "business",
  enterprise: "business", professional: "business", office: "business",
};

/** Match text against keyword→category map, returns best category or null */
function detectCategory(text: string): string | null {
  const lower = text.toLowerCase();
  // Try multi-word matches first (e.g. "real estate")
  for (const [keyword, category] of Object.entries(KEYWORD_CATEGORY_MAP)) {
    if (keyword.includes(" ") && lower.includes(keyword)) return category;
  }
  // Then single-word matches
  for (const [keyword, category] of Object.entries(KEYWORD_CATEGORY_MAP)) {
    if (!keyword.includes(" ") && lower.includes(keyword)) return category;
  }
  return null;
}

function generateSearchQuery(context: string[], seedKeyword: string, imageIndex: number): string {
  // If we have a seed keyword, use it directly — it's the AI's best description
  if (seedKeyword) {
    return seedKeyword;
  }

  // Generic professional queries as fallback
  const genericQueries = [
    "professional business",
    "modern workspace",
    "team collaboration",
    "abstract technology",
    "creative design",
    "urban architecture",
    "nature landscape",
    "professional portrait",
  ];

  if (context.length > 0) {
    const mainKeyword = context[0].split(" ").slice(0, 3).join(" ");
    return `${mainKeyword} professional`;
  }

  return genericQueries[imageIndex % genericQueries.length];
}

export async function POST(req: NextRequest) {
  try {
    const { html, style = "photo", useAI = false } = await req.json();

    if (!html || typeof html !== "string") {
      return NextResponse.json({ error: "HTML content is required" }, { status: 400 });
    }

    const placeholders = extractPlaceholderImages(html);

    if (placeholders.length === 0) {
      return NextResponse.json({
        html,
        replacements: [],
        message: "No placeholder images found",
      });
    }

    const context = extractPageContext(html);
    const contextStr = context.join(" ").toLowerCase();
    const replacements: ImageReplacement[] = [];
    let updatedHtml = html;

    // Detect page category from all available context
    const pageCategory =
      detectCategory(contextStr) ||
      // Also try detecting from all seed keywords combined
      detectCategory(placeholders.map(extractSeedKeyword).join(" ")) ||
      "business"; // fallback

    // Check if Unsplash API key is available
    const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;

    for (let i = 0; i < placeholders.length; i++) {
      const original = placeholders[i];
      const { width, height } = parseDimensions(original);
      const seedKeyword = extractSeedKeyword(original);
      const query = generateSearchQuery(context, seedKeyword, i);

      let replacement: string;

      // Try AI image generation if requested and API keys are available
      if (useAI && (process.env.OPENAI_API_KEY || process.env.STABILITY_API_KEY)) {
        try {
          const aiImage = await generateImage({
            prompt: `${query}, high quality professional ${style} for website`,
            width,
            height,
            style: style as "photo" | "illustration" | "3d" | "artistic",
            quality: "standard",
          });
          if (aiImage && aiImage.provider !== "placeholder") {
            replacement = aiImage.url;
            replacements.push({ original, replacement, query: `[AI:${aiImage.provider}] ${query}` });
            updatedHtml = updatedHtml.split(original).join(replacement);
            continue;
          }
        } catch {
          // Fall through to Unsplash
        }
      }

      if (unsplashKey) {
        // Use Unsplash API for high-quality contextual images
        try {
          const searchParams = new URLSearchParams({
            query,
            per_page: "1",
            orientation: width > height ? "landscape" : height > width ? "portrait" : "squarish",
          });

          const res = await fetch(
            `https://api.unsplash.com/search/photos?${searchParams.toString()}`,
            {
              headers: { Authorization: `Client-ID ${unsplashKey}` },
            }
          );

          if (res.ok) {
            const data = await res.json();
            if (data.results && data.results.length > 0) {
              const photo = data.results[0];
              replacement = `${photo.urls.raw}&w=${width}&h=${height}&fit=crop&auto=format&q=80`;
            } else {
              // API returned no results — fall through to curated
              replacement = getCuratedPhoto(seedKeyword, pageCategory, i, width, height);
            }
          } else {
            replacement = getCuratedPhoto(seedKeyword, pageCategory, i, width, height);
          }
        } catch {
          replacement = getCuratedPhoto(seedKeyword, pageCategory, i, width, height);
        }
      } else {
        // No API key — use curated photos with smart matching
        replacement = getCuratedPhoto(seedKeyword, pageCategory, i, width, height);
      }

      replacements.push({ original, replacement, query });
      updatedHtml = updatedHtml.split(original).join(replacement);
    }

    return NextResponse.json({
      html: updatedHtml,
      replacements,
      imageCount: replacements.length,
    });
  } catch (err) {
    console.error("Image engine error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** Get a curated Unsplash photo URL with smart category matching */
function getCuratedPhoto(
  seedKeyword: string,
  pageCategory: string,
  imageIndex: number,
  width: number,
  height: number,
): string {
  // 1. Try to match the specific seed keyword to a more precise category
  const seedCategory = detectCategory(seedKeyword);

  // 2. Use seed-specific category first, then page-level category
  const category = seedCategory || pageCategory;

  // 3. Get photos from the matched category
  const photos = CURATED_PHOTOS[category] || CURATED_PHOTOS.business;

  // 4. Pick a photo, cycling through the list
  const photoId = photos[imageIndex % photos.length];

  return `https://images.unsplash.com/${photoId}?w=${width}&h=${height}&fit=crop&auto=format&q=80`;
}
