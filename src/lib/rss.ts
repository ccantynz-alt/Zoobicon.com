// RSS/Atom feed parser, generator, OPML import/export, and AI summarization.
// Zero external dependencies for parsing — uses regex only.

export interface FeedItem {
  title: string;
  link: string;
  pubDate: string;
  summary: string;
  author: string;
}

export interface Feed {
  title: string;
  link: string;
  items: FeedItem[];
}

function decodeEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .trim();
}

function stripTags(s: string): string {
  return decodeEntities(s.replace(/<[^>]+>/g, ''));
}

function pickTag(block: string, tag: string): string {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = block.match(re);
  return m ? decodeEntities(m[1]) : '';
}

function pickAttr(block: string, tag: string, attr: string): string {
  const re = new RegExp(`<${tag}[^>]*\\s${attr}=["']([^"']+)["'][^>]*\\/?>`, 'i');
  const m = block.match(re);
  return m ? m[1] : '';
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function parseFeed(url: string): Promise<Feed> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Zoobicon-RSS/1.0', Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml' },
  });
  if (!res.ok) throw new Error(`Failed to fetch feed: ${res.status}`);
  const xml = await res.text();

  const isAtom = /<feed[\s>]/i.test(xml);
  const channelBlock = isAtom
    ? (xml.match(/<feed[\s\S]*?<\/feed>/i)?.[0] ?? xml)
    : (xml.match(/<channel[\s\S]*?<\/channel>/i)?.[0] ?? xml);

  const title = stripTags(pickTag(channelBlock, 'title'));
  let link = '';
  if (isAtom) {
    link = pickAttr(channelBlock, 'link', 'href');
  } else {
    link = stripTags(pickTag(channelBlock, 'link'));
  }

  const itemTag = isAtom ? 'entry' : 'item';
  const itemRe = new RegExp(`<${itemTag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${itemTag}>`, 'gi');
  const items: FeedItem[] = [];
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(channelBlock)) !== null) {
    const block = m[1];
    const itemTitle = stripTags(pickTag(block, 'title'));
    let itemLink = '';
    if (isAtom) {
      itemLink = pickAttr(block, 'link', 'href') || stripTags(pickTag(block, 'id'));
    } else {
      itemLink = stripTags(pickTag(block, 'link'));
    }
    const pubDate = stripTags(pickTag(block, isAtom ? 'updated' : 'pubDate')) || stripTags(pickTag(block, 'published'));
    const summary = stripTags(pickTag(block, isAtom ? 'summary' : 'description')) || stripTags(pickTag(block, 'content'));
    const author = stripTags(pickTag(block, isAtom ? 'name' : 'author')) || stripTags(pickTag(block, 'dc:creator'));
    items.push({ title: itemTitle, link: itemLink, pubDate, summary, author });
  }

  return { title, link, items };
}

export function generateFeed(input: Feed): string {
  const itemsXml = input.items
    .map(
      (it) => `    <item>
      <title>${escapeXml(it.title)}</title>
      <link>${escapeXml(it.link)}</link>
      <pubDate>${escapeXml(it.pubDate)}</pubDate>
      <author>${escapeXml(it.author)}</author>
      <description>${escapeXml(it.summary)}</description>
    </item>`,
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(input.title)}</title>
    <link>${escapeXml(input.link)}</link>
    <description>${escapeXml(input.title)}</description>
${itemsXml}
  </channel>
</rss>`;
}

export function opmlImport(xml: string): string[] {
  const urls: string[] = [];
  const re = /<outline[^>]*xmlUrl=["']([^"']+)["'][^>]*\/?>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    urls.push(m[1]);
  }
  return urls;
}

export function opmlExport(feeds: string[]): string {
  const outlines = feeds
    .map((u) => `    <outline type="rss" xmlUrl="${escapeXml(u)}" />`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>Zoobicon Feeds</title>
  </head>
  <body>
${outlines}
  </body>
</opml>`;
}

export interface SummarizeResult {
  feed: string;
  summary: string;
  itemCount: number;
}

export async function summarizeFeedAI(feedUrl: string): Promise<SummarizeResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }
  const feed = await parseFeed(feedUrl);
  const top = feed.items.slice(0, 10);
  const corpus = top
    .map((it, i) => `${i + 1}. ${it.title}\n${it.summary.slice(0, 400)}`)
    .join('\n\n');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 600,
      messages: [
        {
          role: 'user',
          content: `Summarize the latest items from the feed "${feed.title}" in 4-6 concise bullet points. Highlight the most important news.\n\n${corpus}`,
        },
      ],
    }),
  });
  if (!res.ok) {
    throw new Error(`Anthropic API error: ${res.status}`);
  }
  const data: { content: Array<{ type: string; text: string }> } = await res.json();
  const summary = data.content
    .filter((c) => c.type === 'text')
    .map((c) => c.text)
    .join('\n')
    .trim();
  return { feed: feed.title, summary, itemCount: top.length };
}
