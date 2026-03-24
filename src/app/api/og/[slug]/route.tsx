import { ImageResponse } from "next/og";
import { sql } from "@/lib/db";

export const runtime = "edge";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  let siteName = "";
  try {
    const [site] = await sql`
      SELECT name FROM sites WHERE slug = ${slug} AND status = 'active' LIMIT 1
    `;
    if (site) {
      siteName = site.name;
    }
  } catch {
    // DB unavailable — fall through to generic image
  }

  const isGeneric = !siteName;
  const title = isGeneric ? "Zoobicon" : siteName;
  const subtitle = isGeneric
    ? "AI Website Builder — Build stunning sites in seconds"
    : "Built with Zoobicon";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1e1040 0%, #0f172a 40%, #0c1445 70%, #1a0a3e 100%)",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative gradient orbs */}
        <div
          style={{
            position: "absolute",
            top: "-120px",
            right: "-80px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-100px",
            left: "-60px",
            width: "350px",
            height: "350px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(59,130,246,0.25) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1,
            padding: "40px 60px",
            maxWidth: "100%",
          }}
        >
          {/* Site title */}
          <div
            style={{
              fontSize: isGeneric ? "72px" : "64px",
              fontWeight: 800,
              color: "#ffffff",
              textAlign: "center",
              lineHeight: 1.1,
              marginBottom: "20px",
              maxWidth: "1000px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "flex",
            }}
          >
            {title}
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: "28px",
              fontWeight: 400,
              color: "rgba(255,255,255,0.6)",
              textAlign: "center",
              display: "flex",
            }}
          >
            {subtitle}
          </div>

          {/* Divider line */}
          <div
            style={{
              width: "80px",
              height: "4px",
              borderRadius: "2px",
              background: "linear-gradient(90deg, #8b5cf6, #3b82f6)",
              marginTop: "32px",
              marginBottom: "32px",
              display: "flex",
            }}
          />

          {/* Zoobicon logo text */}
          <div
            style={{
              fontSize: "20px",
              fontWeight: 600,
              letterSpacing: "0.15em",
              textTransform: "uppercase" as const,
              color: "rgba(255,255,255,0.35)",
              display: "flex",
            }}
          >
            zoobicon.com
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    }
  );
}
