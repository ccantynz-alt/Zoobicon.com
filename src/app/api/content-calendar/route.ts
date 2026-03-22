import { NextRequest, NextResponse } from "next/server";

/* ─── Content Calendar API ─── */

interface ScheduledPost {
  id: string;
  platform: "twitter" | "linkedin" | "instagram" | "tiktok" | "facebook";
  caption: string;
  imagePrompt?: string;
  hashtags: string[];
  scheduledAt: string;
  status: "scheduled" | "published" | "draft" | "failed";
  createdAt: string;
}

/* ─── Demo posts (MVP — localStorage on client, this API returns seed data) ─── */

const DEMO_POSTS: ScheduledPost[] = [
  { id: "p1", platform: "twitter", caption: "Just launched our new AI-powered feature! Build websites in seconds, not hours. The future of web development is here.", imagePrompt: "Futuristic glowing website builder dashboard", hashtags: ["#AI", "#WebDev", "#NoCode"], scheduledAt: "2026-03-23T10:00:00Z", status: "scheduled", createdAt: "2026-03-20T08:00:00Z" },
  { id: "p2", platform: "linkedin", caption: "Excited to share how our team reduced website build time by 95% using AI agents. Here's a behind-the-scenes look at our 7-agent pipeline and what it means for the future of digital agencies.", imagePrompt: "Professional team reviewing AI dashboard", hashtags: ["#AI", "#DigitalTransformation", "#WebDevelopment"], scheduledAt: "2026-03-23T14:00:00Z", status: "scheduled", createdAt: "2026-03-20T08:00:00Z" },
  { id: "p3", platform: "instagram", caption: "Before AI vs After AI website building. Swipe to see the difference. Which one would you choose?", imagePrompt: "Split screen comparison of manual coding vs AI generation", hashtags: ["#AIDesign", "#WebDesign", "#BeforeAndAfter", "#TechInnovation"], scheduledAt: "2026-03-24T11:00:00Z", status: "scheduled", createdAt: "2026-03-20T08:00:00Z" },
  { id: "p4", platform: "tiktok", caption: "POV: You just built an entire website in 90 seconds. Watch the AI agents do their thing.", imagePrompt: "Screen recording style of website being generated", hashtags: ["#AIWebsite", "#TechTok", "#NoCode", "#WebDev"], scheduledAt: "2026-03-24T18:00:00Z", status: "scheduled", createdAt: "2026-03-20T08:00:00Z" },
  { id: "p5", platform: "facebook", caption: "Small business owners: you no longer need to spend thousands on a website. Our AI builds professional sites in under 2 minutes. Here's proof.", imagePrompt: "Small business owner smiling at laptop", hashtags: ["#SmallBusiness", "#AIWebsite", "#Entrepreneur"], scheduledAt: "2026-03-25T09:00:00Z", status: "scheduled", createdAt: "2026-03-20T08:00:00Z" },
  { id: "p6", platform: "twitter", caption: "Thread: 5 things I learned building an AI website builder that nobody talks about. 1/ The hardest part isn't the AI...", imagePrompt: "", hashtags: ["#BuildInPublic", "#StartupLife", "#AI"], scheduledAt: "2026-03-25T15:00:00Z", status: "scheduled", createdAt: "2026-03-20T08:00:00Z" },
  { id: "p7", platform: "linkedin", caption: "Case study: How a fitness studio went from no web presence to a fully functional booking site in 90 seconds using AI. The results after 30 days were incredible.", imagePrompt: "Modern fitness studio website on laptop", hashtags: ["#CaseStudy", "#AISuccess", "#DigitalMarketing"], scheduledAt: "2026-03-26T10:00:00Z", status: "scheduled", createdAt: "2026-03-20T08:00:00Z" },
  { id: "p8", platform: "instagram", caption: "Our top 5 AI-generated website designs this week. Which is your favorite? Comment below!", imagePrompt: "Collage of 5 beautiful website designs", hashtags: ["#WebDesign", "#AIArt", "#DesignInspiration", "#UX"], scheduledAt: "2026-03-26T12:00:00Z", status: "scheduled", createdAt: "2026-03-20T08:00:00Z" },
  { id: "p9", platform: "twitter", caption: "We just hit 50,000 AI-generated websites. Thank you to every creator, freelancer, and business owner who trusted us with their vision.", imagePrompt: "Celebration confetti with milestone counter", hashtags: ["#Milestone", "#AIWebsite", "#ThankYou"], scheduledAt: "2026-03-27T10:00:00Z", status: "published", createdAt: "2026-03-19T08:00:00Z" },
  { id: "p10", platform: "tiktok", caption: "Replying to @user: Yes, the AI can build ecommerce sites too. Watch this.", imagePrompt: "Ecommerce site being generated with products", hashtags: ["#Ecommerce", "#AIWebsite", "#TechTok"], scheduledAt: "2026-03-27T17:00:00Z", status: "scheduled", createdAt: "2026-03-20T08:00:00Z" },
  { id: "p11", platform: "linkedin", caption: "Agencies: what if you could deliver client websites in a single meeting? We're seeing agencies 10x their output. Here's how the smartest ones are using AI.", imagePrompt: "Agency team in modern office", hashtags: ["#AgencyLife", "#AITools", "#Productivity"], scheduledAt: "2026-03-28T09:00:00Z", status: "scheduled", createdAt: "2026-03-20T08:00:00Z" },
  { id: "p12", platform: "facebook", caption: "Free workshop this Friday: 'Build Your Business Website in 5 Minutes with AI' — no coding required. Drop a comment to save your spot!", imagePrompt: "Workshop promotional banner", hashtags: ["#FreeWorkshop", "#SmallBusiness", "#WebDesign"], scheduledAt: "2026-03-28T11:00:00Z", status: "draft", createdAt: "2026-03-20T08:00:00Z" },
  { id: "p13", platform: "twitter", caption: "Hot take: In 2 years, building a website from scratch will feel like developing film photography. AI website builders are the digital camera moment.", imagePrompt: "", hashtags: ["#HotTake", "#FutureTech", "#AI"], scheduledAt: "2026-03-29T14:00:00Z", status: "scheduled", createdAt: "2026-03-20T08:00:00Z" },
  { id: "p14", platform: "instagram", caption: "Step 1: Describe your dream website. Step 2: Wait 90 seconds. Step 3: There is no step 3. Your site is live.", imagePrompt: "Minimalist 3-step infographic", hashtags: ["#SimpleAsThat", "#AIWebsite", "#NoCode", "#WebDesign"], scheduledAt: "2026-03-30T10:00:00Z", status: "scheduled", createdAt: "2026-03-20T08:00:00Z" },
  { id: "p15", platform: "linkedin", caption: "We analyzed 10,000 AI-generated websites to find what makes the top 1% convert better. Here are the 7 patterns every high-performing site shares.", imagePrompt: "Data visualization chart", hashtags: ["#DataDriven", "#CRO", "#WebDesign", "#AI"], scheduledAt: "2026-03-30T14:00:00Z", status: "scheduled", createdAt: "2026-03-20T08:00:00Z" },
  { id: "p16", platform: "tiktok", caption: "When the client says 'I need the website by tomorrow' and you pull out the AI builder.", imagePrompt: "Meme-style reaction then showing AI building", hashtags: ["#FreelancerLife", "#AIWebsite", "#TechTok"], scheduledAt: "2026-03-31T18:00:00Z", status: "scheduled", createdAt: "2026-03-20T08:00:00Z" },
  { id: "p17", platform: "twitter", caption: "New feature drop: Multi-page site generation. Describe your business and get 3-6 pages with consistent branding, navigation, and responsive design. All in under 2 minutes.", imagePrompt: "Multi-page website fanning out", hashtags: ["#NewFeature", "#AIWebsite", "#WebDev"], scheduledAt: "2026-04-01T10:00:00Z", status: "draft", createdAt: "2026-03-20T08:00:00Z" },
  { id: "p18", platform: "facebook", caption: "April content calendar idea: Share your website transformation story. We'll feature the best ones on our page. Tag us to enter!", imagePrompt: "Community spotlight graphic", hashtags: ["#Community", "#WebsiteTransformation", "#FeatureMe"], scheduledAt: "2026-04-01T09:00:00Z", status: "draft", createdAt: "2026-03-20T08:00:00Z" },
];

/* ─── GET: return calendar data + scheduled posts ─── */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month"); // "2026-03"
  const status = searchParams.get("status"); // filter by status

  let posts = [...DEMO_POSTS];

  if (month) {
    posts = posts.filter((p) => p.scheduledAt.startsWith(month));
  }

  if (status) {
    posts = posts.filter((p) => p.status === status);
  }

  // Sort by scheduledAt
  posts.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  const insights = [
    { label: "Best posting time", value: "Tuesday 10:00 AM", icon: "clock" },
    { label: "Most engaged platform", value: "LinkedIn", icon: "trending" },
    { label: "Posts with questions get", value: "2.3x more engagement", icon: "help" },
    { label: "Optimal post length", value: "150-280 characters", icon: "text" },
    { label: "Best day for engagement", value: "Wednesday", icon: "calendar" },
    { label: "Hashtag sweet spot", value: "3-5 per post", icon: "hash" },
  ];

  return NextResponse.json({
    posts,
    insights,
    stats: {
      scheduledThisMonth: posts.filter((p) => p.status === "scheduled").length,
      published: posts.filter((p) => p.status === "published").length,
      totalEngagement: 12847,
      contentScore: 87,
    },
  });
}

/* ─── POST: create a post or generate a 30-day plan ─── */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "generate-plan") {
      const { businessDescription } = body;
      if (!businessDescription) {
        return NextResponse.json({ error: "Business description is required" }, { status: 400 });
      }

      // MVP: return pre-generated plan (in production, this would call the AI)
      const platforms: ScheduledPost["platform"][] = ["twitter", "linkedin", "instagram", "tiktok", "facebook"];
      const today = new Date();
      const plan: ScheduledPost[] = [];

      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i + 1);
        const platform = platforms[i % platforms.length];
        const hour = platform === "linkedin" ? 10 : platform === "tiktok" ? 18 : platform === "instagram" ? 12 : platform === "twitter" ? 14 : 9;
        date.setHours(hour, 0, 0, 0);

        plan.push({
          id: `gen-${i + 1}`,
          platform,
          caption: getGeneratedCaption(platform, i, businessDescription),
          imagePrompt: i % 3 === 0 ? `Professional ${businessDescription} themed image for ${platform}` : undefined,
          hashtags: getHashtagsForPlatform(platform),
          scheduledAt: date.toISOString(),
          status: "draft",
          createdAt: new Date().toISOString(),
        });
      }

      return NextResponse.json({ plan, message: "30-day content plan generated" });
    }

    // Create single post
    const post: ScheduledPost = {
      id: `post-${Date.now()}`,
      platform: body.platform || "twitter",
      caption: body.caption || "",
      imagePrompt: body.imagePrompt,
      hashtags: body.hashtags || [],
      scheduledAt: body.scheduledAt || new Date().toISOString(),
      status: body.status || "draft",
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ post, message: "Post created" });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

/* ─── PUT: update a post ─── */

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
    }
    return NextResponse.json({ id, ...updates, message: "Post updated" });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

/* ─── DELETE: delete a post ─── */

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
  }
  return NextResponse.json({ deleted: id, message: "Post deleted" });
}

/* ─── helpers ─── */

function getGeneratedCaption(platform: string, dayIndex: number, biz: string): string {
  const captions: Record<string, string[]> = {
    twitter: [
      `Just a reminder: your ${biz} website doesn't have to be complicated. AI makes it simple.`,
      `The best time to build your online presence was yesterday. The second best time? Right now. Let AI handle the heavy lifting.`,
      `Fun fact: 75% of consumers judge a business by its website. Make yours unforgettable with AI.`,
      `Thread: 3 ways AI is changing ${biz} forever. Let's dive in.`,
      `Your competitors are already using AI. Are you keeping up?`,
      `We've seen ${biz} businesses transform overnight with the right website. Here's how.`,
    ],
    linkedin: [
      `I've been thinking a lot about the future of ${biz}. Here's what I've learned: the businesses that embrace AI aren't just surviving — they're thriving.`,
      `Case study: A ${biz} company went from zero online presence to 500 monthly leads in 30 days. The secret? An AI-built website that actually converts.`,
      `Hot take: In ${biz}, your website isn't a brochure. It's your hardest-working employee. Make sure it's performing.`,
      `3 lessons from helping ${biz} businesses build their digital presence with AI. Number 2 surprised me.`,
      `The ROI on a professional website for ${biz} businesses is staggering. Here are the numbers.`,
      `Why the smartest ${biz} leaders are investing in AI-powered web presence right now.`,
    ],
    instagram: [
      `Your ${biz} deserves a stunning website. Swipe to see what AI can create in 90 seconds.`,
      `Before vs After: Manual website building vs AI-powered creation. The results speak for themselves.`,
      `Design of the day: AI-generated ${biz} website with a modern, clean aesthetic.`,
      `5 website must-haves for every ${biz} business. Save this for later!`,
      `Behind the scenes: Watch AI build a complete ${biz} website from a single prompt.`,
      `Tag a ${biz} owner who needs to see this website transformation.`,
    ],
    tiktok: [
      `POV: You need a ${biz} website by tomorrow and you discover AI builders.`,
      `How to build a ${biz} website in 90 seconds. No, I'm not kidding.`,
      `When someone says ${biz} websites cost thousands. Me: watch this.`,
      `${biz} website glow-up in real time. Sound on for the reaction.`,
      `Replying to comments: Yes, AI can really build a full ${biz} site. Proof:`,
      `The website hack every ${biz} owner needs to know about.`,
    ],
    facebook: [
      `Attention ${biz} business owners: Your website is your first impression. Make it count with AI-powered design.`,
      `Free resource: How to describe your ${biz} to get the perfect AI-generated website. Link in comments!`,
      `We're hosting a free webinar on AI website building for ${biz} businesses. Drop a comment to join!`,
      `Real talk: If you're in ${biz} and still don't have a website, you're leaving money on the table.`,
      `Customer spotlight: See how this ${biz} owner built their dream website in under 2 minutes.`,
      `Poll: What's the biggest challenge you face with your ${biz} website? Comment below!`,
    ],
  };

  const platformCaptions = captions[platform] || captions.twitter;
  return platformCaptions[dayIndex % platformCaptions.length];
}

function getHashtagsForPlatform(platform: string): string[] {
  const tags: Record<string, string[]> = {
    twitter: ["#AI", "#WebDev", "#BuildInPublic"],
    linkedin: ["#AI", "#DigitalTransformation", "#Business"],
    instagram: ["#WebDesign", "#AIDesign", "#SmallBusiness", "#Entrepreneur"],
    tiktok: ["#TechTok", "#AIWebsite", "#NoCode"],
    facebook: ["#SmallBusiness", "#WebDesign", "#AI"],
  };
  return tags[platform] || tags.twitter;
}
