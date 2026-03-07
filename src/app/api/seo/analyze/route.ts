import { NextRequest } from "next/server";

interface SeoCheck {
  name: string;
  passed: boolean;
  message: string;
  impact: "high" | "medium" | "low";
}

interface SeoCategory {
  name: string;
  score: number;
  maxScore: number;
  checks: SeoCheck[];
}

interface SeoResult {
  score: number;
  categories: SeoCategory[];
  suggestions: Array<{
    priority: "high" | "medium" | "low";
    message: string;
    category: string;
  }>;
}

function extractTagContent(html: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = html.match(regex);
  return match ? match[1].trim() : null;
}

function extractMetaContent(html: string, nameOrProperty: string): string | null {
  // Match name="..." or property="..."
  const regex = new RegExp(
    `<meta[^>]*(?:name|property)=["']${nameOrProperty}["'][^>]*content=["']([^"']*)["'][^>]*>|<meta[^>]*content=["']([^"']*)["'][^>]*(?:name|property)=["']${nameOrProperty}["'][^>]*>`,
    "i"
  );
  const match = html.match(regex);
  return match ? (match[1] || match[2] || null) : null;
}

function countWords(text: string): number {
  const cleaned = text
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return 0;
  return cleaned.split(/\s+/).filter((w) => w.length > 0).length;
}

function getTextContent(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsKeyword(text: string, keyword: string): boolean {
  if (!keyword) return true; // no keyword to check
  return text.toLowerCase().includes(keyword.toLowerCase());
}

function analyzeTitleAndMeta(html: string, keyword: string): SeoCategory {
  const checks: SeoCheck[] = [];
  let score = 0;
  const maxScore = 100;

  // Title tag
  const title = extractTagContent(html, "title");
  if (title) {
    checks.push({ name: "Title tag exists", passed: true, message: "Title tag is present.", impact: "high" });
    score += 15;

    const titleLen = title.length;
    if (titleLen >= 50 && titleLen <= 60) {
      checks.push({ name: "Title length", passed: true, message: `Title is ${titleLen} characters (ideal: 50-60).`, impact: "medium" });
      score += 15;
    } else if (titleLen >= 30 && titleLen <= 70) {
      checks.push({ name: "Title length", passed: true, message: `Title is ${titleLen} characters (ideal: 50-60, acceptable).`, impact: "medium" });
      score += 10;
    } else {
      checks.push({ name: "Title length", passed: false, message: `Title is ${titleLen} characters (ideal: 50-60).`, impact: "medium" });
      score += 3;
    }

    if (keyword) {
      if (containsKeyword(title, keyword)) {
        checks.push({ name: "Keyword in title", passed: true, message: `Title contains target keyword "${keyword}".`, impact: "high" });
        score += 15;
      } else {
        checks.push({ name: "Keyword in title", passed: false, message: `Title does not contain target keyword "${keyword}".`, impact: "high" });
      }
    } else {
      score += 10;
    }
  } else {
    checks.push({ name: "Title tag exists", passed: false, message: "No title tag found. Every page needs a title.", impact: "high" });
    checks.push({ name: "Title length", passed: false, message: "Cannot check title length — no title tag.", impact: "medium" });
    if (keyword) {
      checks.push({ name: "Keyword in title", passed: false, message: "Cannot check keyword in title — no title tag.", impact: "high" });
    }
  }

  // Meta description
  const metaDesc = extractMetaContent(html, "description");
  if (metaDesc) {
    checks.push({ name: "Meta description exists", passed: true, message: "Meta description is present.", impact: "high" });
    score += 15;

    const descLen = metaDesc.length;
    if (descLen >= 150 && descLen <= 160) {
      checks.push({ name: "Meta description length", passed: true, message: `Meta description is ${descLen} characters (ideal: 150-160).`, impact: "medium" });
      score += 15;
    } else if (descLen >= 120 && descLen <= 180) {
      checks.push({ name: "Meta description length", passed: true, message: `Meta description is ${descLen} characters (ideal: 150-160, acceptable).`, impact: "medium" });
      score += 10;
    } else {
      checks.push({ name: "Meta description length", passed: false, message: `Meta description is ${descLen} characters (ideal: 150-160).`, impact: "medium" });
      score += 3;
    }

    if (keyword) {
      if (containsKeyword(metaDesc, keyword)) {
        checks.push({ name: "Keyword in meta description", passed: true, message: `Meta description contains target keyword "${keyword}".`, impact: "medium" });
        score += 10;
      } else {
        checks.push({ name: "Keyword in meta description", passed: false, message: `Meta description does not contain target keyword "${keyword}".`, impact: "medium" });
      }
    } else {
      score += 5;
    }
  } else {
    checks.push({ name: "Meta description exists", passed: false, message: "No meta description found.", impact: "high" });
    checks.push({ name: "Meta description length", passed: false, message: "Cannot check length — no meta description.", impact: "medium" });
    if (keyword) {
      checks.push({ name: "Keyword in meta description", passed: false, message: "Cannot check keyword — no meta description.", impact: "medium" });
    }
  }

  // Canonical URL
  const hasCanonical = /<link[^>]*rel=["']canonical["'][^>]*>/i.test(html);
  if (hasCanonical) {
    checks.push({ name: "Canonical URL", passed: true, message: "Canonical URL tag is present.", impact: "medium" });
    score += 10;
  } else {
    checks.push({ name: "Canonical URL", passed: false, message: "No canonical URL tag found.", impact: "medium" });
  }

  return { name: "Title & Meta", score: Math.min(score, maxScore), maxScore, checks };
}

function analyzeHeadings(html: string, keyword: string): SeoCategory {
  const checks: SeoCheck[] = [];
  let score = 0;
  const maxScore = 100;

  // H1 count
  const h1Matches = html.match(/<h1[^>]*>[\s\S]*?<\/h1>/gi) || [];
  const h1Count = h1Matches.length;

  if (h1Count === 1) {
    checks.push({ name: "Single H1 tag", passed: true, message: "Page has exactly one H1 tag.", impact: "high" });
    score += 30;
  } else if (h1Count === 0) {
    checks.push({ name: "Single H1 tag", passed: false, message: "No H1 tag found. Every page should have exactly one H1.", impact: "high" });
  } else {
    checks.push({ name: "Single H1 tag", passed: false, message: `Found ${h1Count} H1 tags. Use exactly one H1 per page.`, impact: "high" });
    score += 10;
  }

  // Keyword in H1
  if (h1Count > 0 && keyword) {
    const h1Text = (h1Matches[0] ?? "").replace(/<[^>]*>/g, "").trim();
    if (containsKeyword(h1Text, keyword)) {
      checks.push({ name: "Keyword in H1", passed: true, message: `H1 contains target keyword "${keyword}".`, impact: "high" });
      score += 25;
    } else {
      checks.push({ name: "Keyword in H1", passed: false, message: `H1 does not contain target keyword "${keyword}".`, impact: "high" });
    }
  } else if (keyword && h1Count === 0) {
    checks.push({ name: "Keyword in H1", passed: false, message: "Cannot check keyword — no H1 tag.", impact: "high" });
  } else {
    score += 15;
  }

  // Heading hierarchy
  const headingLevels: number[] = [];
  const headingRegex = /<h([1-6])[^>]*>/gi;
  let hMatch;
  while ((hMatch = headingRegex.exec(html)) !== null) {
    headingLevels.push(parseInt(hMatch[1]));
  }

  if (headingLevels.length > 0) {
    let hierarchyValid = true;
    for (let i = 1; i < headingLevels.length; i++) {
      if (headingLevels[i] > headingLevels[i - 1] + 1) {
        hierarchyValid = false;
        break;
      }
    }

    if (hierarchyValid) {
      checks.push({ name: "Heading hierarchy", passed: true, message: "Headings follow a logical hierarchy.", impact: "medium" });
      score += 20;
    } else {
      checks.push({ name: "Heading hierarchy", passed: false, message: "Heading levels are skipped (e.g., H1 to H3). Use sequential levels.", impact: "medium" });
      score += 5;
    }
  } else {
    checks.push({ name: "Heading hierarchy", passed: false, message: "No headings found on the page.", impact: "medium" });
  }

  // Has H2s
  const h2Count = (html.match(/<h2[^>]*>/gi) || []).length;
  if (h2Count > 0) {
    checks.push({ name: "Subheadings present", passed: true, message: `Found ${h2Count} H2 subheading(s) for content structure.`, impact: "low" });
    score += 25;
  } else {
    checks.push({ name: "Subheadings present", passed: false, message: "No H2 subheadings found. Use subheadings to structure content.", impact: "low" });
  }

  return { name: "Headings", score: Math.min(score, maxScore), maxScore, checks };
}

function analyzeContent(html: string, keyword: string): SeoCategory {
  const checks: SeoCheck[] = [];
  let score = 0;
  const maxScore = 100;

  const textContent = getTextContent(html);
  const wordCount = countWords(textContent);

  // Word count
  if (wordCount >= 300) {
    checks.push({ name: "Content length", passed: true, message: `Page has ${wordCount} words (300+ recommended).`, impact: "high" });
    score += 30;
  } else if (wordCount >= 100) {
    checks.push({ name: "Content length", passed: false, message: `Page has ${wordCount} words (300+ recommended for better rankings).`, impact: "high" });
    score += 15;
  } else {
    checks.push({ name: "Content length", passed: false, message: `Page has only ${wordCount} words. Add more content (300+ recommended).`, impact: "high" });
    score += 5;
  }

  // Keyword density
  if (keyword && wordCount > 0) {
    const keywordLower = keyword.toLowerCase();
    const words = textContent.toLowerCase();
    const keywordWords = keywordLower.split(/\s+/).length;
    let keywordCount = 0;
    let searchFrom = 0;
    while (true) {
      const idx = words.indexOf(keywordLower, searchFrom);
      if (idx === -1) break;
      keywordCount++;
      searchFrom = idx + 1;
    }

    const density = (keywordCount * keywordWords / wordCount) * 100;
    if (density >= 1 && density <= 3) {
      checks.push({ name: "Keyword density", passed: true, message: `Keyword density is ${density.toFixed(1)}% (ideal: 1-3%).`, impact: "medium" });
      score += 25;
    } else if (density > 0 && density < 1) {
      checks.push({ name: "Keyword density", passed: false, message: `Keyword density is ${density.toFixed(1)}% (low — aim for 1-3%).`, impact: "medium" });
      score += 10;
    } else if (density > 3) {
      checks.push({ name: "Keyword density", passed: false, message: `Keyword density is ${density.toFixed(1)}% (too high — may appear as keyword stuffing).`, impact: "medium" });
      score += 10;
    } else {
      checks.push({ name: "Keyword density", passed: false, message: `Target keyword "${keyword}" not found in content.`, impact: "medium" });
    }
  } else {
    score += 15;
  }

  // Readability — average sentence length
  const sentences = textContent.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  if (sentences.length > 0) {
    const avgSentenceLength = wordCount / sentences.length;
    if (avgSentenceLength <= 20) {
      checks.push({ name: "Readability", passed: true, message: `Average sentence length is ${avgSentenceLength.toFixed(0)} words (good readability).`, impact: "low" });
      score += 20;
    } else if (avgSentenceLength <= 25) {
      checks.push({ name: "Readability", passed: true, message: `Average sentence length is ${avgSentenceLength.toFixed(0)} words (acceptable).`, impact: "low" });
      score += 15;
    } else {
      checks.push({ name: "Readability", passed: false, message: `Average sentence length is ${avgSentenceLength.toFixed(0)} words. Shorter sentences improve readability.`, impact: "low" });
      score += 5;
    }
  } else {
    checks.push({ name: "Readability", passed: false, message: "Unable to assess readability — too little text content.", impact: "low" });
  }

  // Language attribute
  const hasLang = /<html[^>]*\slang=["'][^"']+["']/i.test(html);
  if (hasLang) {
    checks.push({ name: "Language attribute", passed: true, message: "HTML lang attribute is set.", impact: "medium" });
    score += 25;
  } else {
    checks.push({ name: "Language attribute", passed: false, message: "No lang attribute on <html> tag. Add lang=\"en\" or appropriate language.", impact: "medium" });
  }

  return { name: "Content", score: Math.min(score, maxScore), maxScore, checks };
}

function analyzeImages(html: string): SeoCategory {
  const checks: SeoCheck[] = [];
  let score = 0;
  const maxScore = 100;

  const imgTags = html.match(/<img[^>]*>/gi) || [];
  const totalImages = imgTags.length;

  if (totalImages === 0) {
    checks.push({ name: "Images present", passed: false, message: "No images found. Visual content can improve engagement.", impact: "low" });
    score += 50; // Not penalized heavily for no images
    return { name: "Images", score: Math.min(score, maxScore), maxScore, checks };
  }

  checks.push({ name: "Images present", passed: true, message: `Found ${totalImages} image(s).`, impact: "low" });
  score += 10;

  // Alt text check
  let missingAlt = 0;
  let emptyAlt = 0;
  for (const img of imgTags) {
    if (!/alt=/i.test(img)) {
      missingAlt++;
    } else if (/alt=["']\s*["']/i.test(img)) {
      emptyAlt++;
    }
  }

  const withoutAlt = missingAlt + emptyAlt;
  if (withoutAlt === 0) {
    checks.push({ name: "Image alt text", passed: true, message: "All images have descriptive alt text.", impact: "high" });
    score += 50;
  } else {
    checks.push({ name: "Image alt text", passed: false, message: `${withoutAlt} of ${totalImages} image(s) missing alt text.`, impact: "high" });
    score += Math.max(0, 50 - withoutAlt * 15);
  }

  // Image optimization hints (lazy loading)
  const lazyImages = imgTags.filter((img) => /loading=["']lazy["']/i.test(img)).length;
  if (lazyImages >= totalImages * 0.5 || totalImages <= 1) {
    checks.push({ name: "Lazy loading", passed: true, message: "Images use lazy loading for better performance.", impact: "low" });
    score += 20;
  } else {
    checks.push({ name: "Lazy loading", passed: false, message: `Only ${lazyImages} of ${totalImages} images use loading="lazy".`, impact: "low" });
    score += 5;
  }

  // Image dimensions
  const withDimensions = imgTags.filter((img) => /width=/i.test(img) && /height=/i.test(img)).length;
  if (withDimensions >= totalImages * 0.5) {
    checks.push({ name: "Image dimensions", passed: true, message: "Images specify width and height to prevent layout shift.", impact: "medium" });
    score += 20;
  } else {
    checks.push({ name: "Image dimensions", passed: false, message: `${totalImages - withDimensions} image(s) missing width/height attributes.`, impact: "medium" });
    score += 5;
  }

  return { name: "Images", score: Math.min(score, maxScore), maxScore, checks };
}

function analyzeLinks(html: string): SeoCategory {
  const checks: SeoCheck[] = [];
  let score = 0;
  const maxScore = 100;

  const linkTags = html.match(/<a[^>]*href=["'][^"']*["'][^>]*>/gi) || [];
  const totalLinks = linkTags.length;

  if (totalLinks === 0) {
    checks.push({ name: "Links present", passed: false, message: "No links found. Internal and external links help SEO.", impact: "medium" });
    return { name: "Links", score: 30, maxScore, checks };
  }

  // Classify internal vs external
  let internalLinks = 0;
  let externalLinks = 0;
  let nofollowCount = 0;
  let blankLinks = 0;

  for (const link of linkTags) {
    const hrefMatch = link.match(/href=["']([^"']*)["']/i);
    const href = hrefMatch ? hrefMatch[1] : "";

    if (href.startsWith("http://") || href.startsWith("https://")) {
      externalLinks++;
    } else if (href.startsWith("#") || href.startsWith("/") || href.startsWith("./")) {
      internalLinks++;
    } else if (href.startsWith("mailto:") || href.startsWith("tel:")) {
      // Contact links, counted as internal
      internalLinks++;
    } else {
      internalLinks++;
    }

    if (/rel=["'][^"']*nofollow[^"']*["']/i.test(link)) {
      nofollowCount++;
    }
    if (!href || href === "#") {
      blankLinks++;
    }
  }

  checks.push({ name: "Links found", passed: true, message: `Found ${totalLinks} link(s): ${internalLinks} internal, ${externalLinks} external.`, impact: "low" });
  score += 25;

  // Internal links
  if (internalLinks > 0) {
    checks.push({ name: "Internal links", passed: true, message: `${internalLinks} internal link(s) help with site navigation.`, impact: "medium" });
    score += 25;
  } else {
    checks.push({ name: "Internal links", passed: false, message: "No internal links found. Add links to other pages on your site.", impact: "medium" });
  }

  // External links
  if (externalLinks > 0) {
    checks.push({ name: "External links", passed: true, message: `${externalLinks} external link(s) found.`, impact: "low" });
    score += 15;
  } else {
    checks.push({ name: "External links", passed: false, message: "No external links. Linking to authoritative sources can improve credibility.", impact: "low" });
    score += 5;
  }

  // Nofollow
  if (nofollowCount > 0) {
    checks.push({ name: "Nofollow usage", passed: true, message: `${nofollowCount} link(s) use rel="nofollow".`, impact: "low" });
    score += 10;
  } else {
    checks.push({ name: "Nofollow usage", passed: true, message: "No nofollow links — acceptable for most pages.", impact: "low" });
    score += 10;
  }

  // Blank/empty links
  if (blankLinks > 0) {
    checks.push({ name: "Empty links", passed: false, message: `${blankLinks} link(s) have empty or "#" href. Give them proper destinations.`, impact: "medium" });
  } else {
    checks.push({ name: "Empty links", passed: true, message: "All links have proper destinations.", impact: "medium" });
    score += 25;
  }

  return { name: "Links", score: Math.min(score, maxScore), maxScore, checks };
}

function analyzeMobile(html: string): SeoCategory {
  const checks: SeoCheck[] = [];
  let score = 0;
  const maxScore = 100;

  // Viewport meta tag
  const hasViewport = /<meta[^>]*name=["']viewport["'][^>]*>/i.test(html);
  if (hasViewport) {
    checks.push({ name: "Viewport meta tag", passed: true, message: "Viewport meta tag is present for mobile responsiveness.", impact: "high" });
    score += 40;
  } else {
    checks.push({ name: "Viewport meta tag", passed: false, message: "No viewport meta tag. Add <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">.", impact: "high" });
  }

  // Responsive CSS indicators
  const hasMediaQueries = /@media/i.test(html);
  const hasFlexbox = /display:\s*flex/i.test(html);
  const hasGrid = /display:\s*grid/i.test(html);
  const hasResponsiveUnits = /\b(vw|vh|%|rem|em)\b/i.test(html);

  const responsiveIndicators = [hasMediaQueries, hasFlexbox, hasGrid, hasResponsiveUnits].filter(Boolean).length;

  if (responsiveIndicators >= 2) {
    checks.push({ name: "Responsive design", passed: true, message: "Page uses responsive CSS techniques (media queries, flexbox, or grid).", impact: "high" });
    score += 30;
  } else if (responsiveIndicators >= 1) {
    checks.push({ name: "Responsive design", passed: true, message: "Some responsive CSS detected. Consider adding more responsive techniques.", impact: "high" });
    score += 20;
  } else {
    checks.push({ name: "Responsive design", passed: false, message: "No responsive CSS patterns detected. Page may not display well on mobile.", impact: "high" });
  }

  // Touch-friendly sizing
  const hasTapTargets = /padding|min-height|min-width/i.test(html);
  if (hasTapTargets) {
    checks.push({ name: "Touch targets", passed: true, message: "CSS suggests adequate element sizing for touch interaction.", impact: "low" });
    score += 15;
  } else {
    checks.push({ name: "Touch targets", passed: false, message: "Ensure interactive elements are at least 44x44px for mobile users.", impact: "low" });
    score += 5;
  }

  // Font size
  const hasReadableFont = /font-size/i.test(html);
  if (hasReadableFont) {
    checks.push({ name: "Font sizing", passed: true, message: "Font-size declarations found.", impact: "low" });
    score += 15;
  } else {
    checks.push({ name: "Font sizing", passed: false, message: "No explicit font-size found. Ensure text is readable on mobile.", impact: "low" });
    score += 5;
  }

  return { name: "Mobile", score: Math.min(score, maxScore), maxScore, checks };
}

function analyzePerformance(html: string): SeoCategory {
  const checks: SeoCheck[] = [];
  let score = 0;
  const maxScore = 100;

  // Inline styles count
  const inlineStyles = (html.match(/<style[^>]*>[\s\S]*?<\/style>/gi) || []).length;
  const externalStyles = (html.match(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi) || []).length;

  if (inlineStyles === 0 && externalStyles > 0) {
    checks.push({ name: "CSS delivery", passed: true, message: "CSS is loaded via external stylesheets (cacheable).", impact: "medium" });
    score += 25;
  } else if (inlineStyles > 0 && externalStyles === 0) {
    checks.push({ name: "CSS delivery", passed: true, message: `${inlineStyles} inline style block(s). Acceptable for single-page sites.`, impact: "medium" });
    score += 20;
  } else if (inlineStyles > 2) {
    checks.push({ name: "CSS delivery", passed: false, message: `${inlineStyles} inline style blocks. Consider consolidating into external stylesheets.`, impact: "medium" });
    score += 10;
  } else {
    checks.push({ name: "CSS delivery", passed: true, message: "CSS delivery looks reasonable.", impact: "medium" });
    score += 20;
  }

  // Inline scripts
  const inlineScripts = (html.match(/<script(?![^>]*src=)[^>]*>[\s\S]*?<\/script>/gi) || []).length;
  const externalScripts = (html.match(/<script[^>]*src=["'][^"']+["'][^>]*>/gi) || []).length;

  if (inlineScripts <= 1) {
    checks.push({ name: "JavaScript delivery", passed: true, message: `Minimal inline scripts (${inlineScripts}).`, impact: "medium" });
    score += 25;
  } else {
    checks.push({ name: "JavaScript delivery", passed: false, message: `${inlineScripts} inline script blocks. Consider externalizing for caching.`, impact: "medium" });
    score += 10;
  }

  // Async/defer on scripts
  if (externalScripts > 0) {
    const asyncDefer = (html.match(/<script[^>]*(async|defer)[^>]*src=/gi) || []).length;
    if (asyncDefer >= externalScripts) {
      checks.push({ name: "Script loading", passed: true, message: "External scripts use async/defer for non-blocking loading.", impact: "medium" });
      score += 25;
    } else {
      checks.push({ name: "Script loading", passed: false, message: `${externalScripts - asyncDefer} external script(s) may block rendering. Add async or defer.`, impact: "medium" });
      score += 10;
    }
  } else {
    checks.push({ name: "Script loading", passed: true, message: "No render-blocking external scripts.", impact: "medium" });
    score += 25;
  }

  // Schema/structured data
  const hasSchemaJson = /application\/ld\+json/i.test(html);
  const hasMicrodata = /itemscope|itemtype/i.test(html);
  if (hasSchemaJson || hasMicrodata) {
    checks.push({ name: "Structured data", passed: true, message: "Schema.org structured data detected.", impact: "medium" });
    score += 25;
  } else {
    checks.push({ name: "Structured data", passed: false, message: "No structured data (JSON-LD or Microdata) found. Add Schema.org markup.", impact: "medium" });
  }

  return { name: "Performance", score: Math.min(score, maxScore), maxScore, checks };
}

function analyzeSocial(html: string): SeoCategory {
  const checks: SeoCheck[] = [];
  let score = 0;
  const maxScore = 100;

  // Open Graph tags
  const ogTitle = extractMetaContent(html, "og:title");
  const ogDesc = extractMetaContent(html, "og:description");
  const ogImage = extractMetaContent(html, "og:image");
  const ogType = extractMetaContent(html, "og:type");

  let ogScore = 0;
  if (ogTitle) ogScore++;
  if (ogDesc) ogScore++;
  if (ogImage) ogScore++;
  if (ogType) ogScore++;

  if (ogScore >= 3) {
    checks.push({ name: "Open Graph tags", passed: true, message: `${ogScore}/4 Open Graph tags present (title, description, image, type).`, impact: "medium" });
    score += 35;
  } else if (ogScore > 0) {
    checks.push({ name: "Open Graph tags", passed: false, message: `Only ${ogScore}/4 Open Graph tags found. Add og:title, og:description, og:image, og:type.`, impact: "medium" });
    score += ogScore * 8;
  } else {
    checks.push({ name: "Open Graph tags", passed: false, message: "No Open Graph tags found. These improve social media sharing.", impact: "medium" });
  }

  // Twitter Card tags
  const twCard = extractMetaContent(html, "twitter:card");
  const twTitle = extractMetaContent(html, "twitter:title");
  const twDesc = extractMetaContent(html, "twitter:description");
  const twImage = extractMetaContent(html, "twitter:image");

  let twScore = 0;
  if (twCard) twScore++;
  if (twTitle) twScore++;
  if (twDesc) twScore++;
  if (twImage) twScore++;

  if (twScore >= 3) {
    checks.push({ name: "Twitter Card tags", passed: true, message: `${twScore}/4 Twitter Card tags present.`, impact: "medium" });
    score += 35;
  } else if (twScore > 0) {
    checks.push({ name: "Twitter Card tags", passed: false, message: `Only ${twScore}/4 Twitter Card tags found. Add twitter:card, twitter:title, twitter:description, twitter:image.`, impact: "medium" });
    score += twScore * 8;
  } else {
    checks.push({ name: "Twitter Card tags", passed: false, message: "No Twitter Card tags found. These improve Twitter/X sharing.", impact: "medium" });
  }

  // Favicon
  const hasFavicon = /<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*>/i.test(html) ||
    /<link[^>]*rel=["']apple-touch-icon["'][^>]*>/i.test(html);
  if (hasFavicon) {
    checks.push({ name: "Favicon", passed: true, message: "Favicon/icon link tag detected.", impact: "low" });
    score += 30;
  } else {
    checks.push({ name: "Favicon", passed: false, message: "No favicon link tag found. Add a favicon for brand recognition in tabs.", impact: "low" });
  }

  return { name: "Social", score: Math.min(score, maxScore), maxScore, checks };
}

function collectSuggestions(categories: SeoCategory[]): SeoResult["suggestions"] {
  const suggestions: SeoResult["suggestions"] = [];

  for (const category of categories) {
    for (const check of category.checks) {
      if (!check.passed) {
        suggestions.push({
          priority: check.impact,
          message: check.message,
          category: category.name,
        });
      }
    }
  }

  // Sort: high > medium > low
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return suggestions;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, targetKeyword } = body as { code?: string; targetKeyword?: string };

    if (!code || typeof code !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'code' field." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const keyword = (targetKeyword || "").trim();

    const categories: SeoCategory[] = [
      analyzeTitleAndMeta(code, keyword),
      analyzeHeadings(code, keyword),
      analyzeContent(code, keyword),
      analyzeImages(code),
      analyzeLinks(code),
      analyzeMobile(code),
      analyzePerformance(code),
      analyzeSocial(code),
    ];

    // Overall score: weighted average
    const totalScore = categories.reduce((sum, c) => sum + c.score, 0);
    const totalMax = categories.reduce((sum, c) => sum + c.maxScore, 0);
    const overallScore = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

    const suggestions = collectSuggestions(categories);

    const result: SeoResult = {
      score: overallScore,
      categories,
      suggestions,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("SEO analysis error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to analyze SEO." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
