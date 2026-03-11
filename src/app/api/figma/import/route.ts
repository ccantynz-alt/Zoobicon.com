import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
  absoluteBoundingBox?: { x: number; y: number; width: number; height: number };
  constraints?: { vertical: string; horizontal: string };
  fills?: Array<{
    type: string;
    color?: { r: number; g: number; b: number; a: number };
    gradientStops?: Array<{ color: { r: number; g: number; b: number; a: number }; position: number }>;
  }>;
  strokes?: Array<{ type: string; color?: { r: number; g: number; b: number; a: number } }>;
  strokeWeight?: number;
  cornerRadius?: number;
  rectangleCornerRadii?: number[];
  characters?: string;
  style?: {
    fontFamily?: string;
    fontWeight?: number;
    fontSize?: number;
    lineHeightPx?: number;
    letterSpacing?: number;
    textAlignHorizontal?: string;
  };
  layoutMode?: string;
  primaryAxisAlignItems?: string;
  counterAxisAlignItems?: string;
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  itemSpacing?: number;
  effects?: Array<{
    type: string;
    color?: { r: number; g: number; b: number; a: number };
    offset?: { x: number; y: number };
    radius?: number;
    spread?: number;
  }>;
  opacity?: number;
  clipsContent?: boolean;
  transitionNodeID?: string;
  transitionDuration?: number;
  transitionEasing?: { type: string };
}

interface DesignTokens {
  colors: string[];
  fonts: string[];
  spacing: number[];
}

function parseFigmaUrl(url: string): { fileKey: string; nodeIds: string[] } {
  const figmaUrlPattern = /figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/;
  const match = url.match(figmaUrlPattern);

  if (!match) {
    throw new Error("Invalid Figma URL. Expected format: https://www.figma.com/file/{file_key}/...");
  }

  const fileKey = match[1];
  const nodeIds: string[] = [];

  const nodeIdPattern = /node-id=([^&]+)/;
  const nodeMatch = url.match(nodeIdPattern);
  if (nodeMatch) {
    const decoded = decodeURIComponent(nodeMatch[1]);
    nodeIds.push(...decoded.split(",").map((id) => id.trim()));
  }

  return { fileKey, nodeIds };
}

function rgbaToHex(r: number, g: number, b: number, a: number = 1): string {
  const toHex = (v: number) =>
    Math.round(v * 255)
      .toString(16)
      .padStart(2, "0");
  if (a < 1) {
    return `#${toHex(r)}${toHex(g)}${toHex(b)}${toHex(a)}`;
  }
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function extractDesignData(node: FigmaNode): {
  tokens: DesignTokens;
  layerCount: number;
  structure: string;
} {
  const colors = new Set<string>();
  const fonts = new Set<string>();
  const spacingSet = new Set<number>();
  let layerCount = 0;

  function traverse(n: FigmaNode, depth: number = 0): string {
    layerCount++;
    const lines: string[] = [];
    const indent = "  ".repeat(depth);
    const bounds = n.absoluteBoundingBox;

    lines.push(`${indent}[${n.type}] "${n.name}" ${bounds ? `(${bounds.width}x${bounds.height})` : ""}`);

    // Extract colors from fills
    if (n.fills) {
      for (const fill of n.fills) {
        if (fill.type === "SOLID" && fill.color) {
          const hex = rgbaToHex(fill.color.r, fill.color.g, fill.color.b, fill.color.a);
          colors.add(hex);
          lines.push(`${indent}  fill: ${hex}`);
        }
        if (fill.type === "GRADIENT_LINEAR" && fill.gradientStops) {
          for (const stop of fill.gradientStops) {
            const hex = rgbaToHex(stop.color.r, stop.color.g, stop.color.b, stop.color.a);
            colors.add(hex);
          }
          lines.push(`${indent}  gradient: ${fill.gradientStops.length} stops`);
        }
      }
    }

    // Extract stroke colors
    if (n.strokes) {
      for (const stroke of n.strokes) {
        if (stroke.color) {
          const hex = rgbaToHex(stroke.color.r, stroke.color.g, stroke.color.b, stroke.color.a);
          colors.add(hex);
        }
      }
    }

    // Extract text styles
    if (n.type === "TEXT" && n.style) {
      if (n.style.fontFamily) {
        fonts.add(n.style.fontFamily);
        lines.push(`${indent}  font: ${n.style.fontFamily} ${n.style.fontWeight || 400} ${n.style.fontSize || 16}px`);
      }
      if (n.characters) {
        lines.push(`${indent}  text: "${n.characters.substring(0, 80)}${n.characters.length > 80 ? "..." : ""}"`);
      }
    }

    // Extract layout info
    if (n.layoutMode) {
      lines.push(`${indent}  layout: ${n.layoutMode} align=${n.primaryAxisAlignItems || "MIN"} cross=${n.counterAxisAlignItems || "MIN"} gap=${n.itemSpacing || 0}`);
    }

    // Extract spacing
    if (n.paddingLeft) spacingSet.add(n.paddingLeft);
    if (n.paddingRight) spacingSet.add(n.paddingRight);
    if (n.paddingTop) spacingSet.add(n.paddingTop);
    if (n.paddingBottom) spacingSet.add(n.paddingBottom);
    if (n.itemSpacing) spacingSet.add(n.itemSpacing);

    // Corner radius
    if (n.cornerRadius) {
      lines.push(`${indent}  borderRadius: ${n.cornerRadius}px`);
    }

    // Effects (shadows, blur)
    if (n.effects) {
      for (const effect of n.effects) {
        if (effect.type === "DROP_SHADOW" && effect.color && effect.offset) {
          const hex = rgbaToHex(effect.color.r, effect.color.g, effect.color.b, effect.color.a);
          lines.push(`${indent}  shadow: ${effect.offset.x}px ${effect.offset.y}px ${effect.radius || 0}px ${hex}`);
        }
      }
    }

    // Prototype interactions
    if (n.transitionNodeID) {
      lines.push(`${indent}  interaction: navigates to ${n.transitionNodeID} (${n.transitionDuration || 300}ms ${n.transitionEasing?.type || "EASE_IN_OUT"})`);
    }

    // Opacity
    if (n.opacity !== undefined && n.opacity < 1) {
      lines.push(`${indent}  opacity: ${n.opacity}`);
    }

    // Recurse children
    if (n.children) {
      for (const child of n.children) {
        lines.push(traverse(child, depth + 1));
      }
    }

    return lines.join("\n");
  }

  const structure = traverse(node);

  return {
    tokens: {
      colors: Array.from(colors),
      fonts: Array.from(fonts),
      spacing: Array.from(spacingSet).sort((a, b) => a - b),
    },
    layerCount,
    structure,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { figmaUrl, accessToken, figmaJson } = body;

    if (!figmaUrl && !figmaJson) {
      return NextResponse.json(
        { error: "Either figmaUrl or figmaJson is required" },
        { status: 400 }
      );
    }

    let designNodes: FigmaNode[];

    if (figmaJson) {
      // Handle pasted Figma JSON
      try {
        const parsed = typeof figmaJson === "string" ? JSON.parse(figmaJson) : figmaJson;

        if (parsed.document) {
          designNodes = [parsed.document];
        } else if (parsed.nodes) {
          designNodes = Object.values(parsed.nodes).map(
            (n: unknown) => (n as { document: FigmaNode }).document
          );
        } else if (parsed.type) {
          designNodes = [parsed as FigmaNode];
        } else {
          return NextResponse.json(
            { error: "Unrecognized Figma JSON structure. Expected a document, nodes, or a single node object." },
            { status: 400 }
          );
        }
      } catch {
        return NextResponse.json(
          { error: "Invalid JSON. Please paste valid Figma JSON data." },
          { status: 400 }
        );
      }
    } else {
      // Handle Figma URL
      if (!accessToken) {
        return NextResponse.json(
          { error: "Access token is required when importing from a Figma URL" },
          { status: 400 }
        );
      }

      let fileKey: string;
      let nodeIds: string[];

      try {
        ({ fileKey, nodeIds } = parseFigmaUrl(figmaUrl));
      } catch (err) {
        return NextResponse.json(
          { error: (err as Error).message },
          { status: 400 }
        );
      }

      // Fetch from Figma API
      let figmaApiUrl: string;
      if (nodeIds.length > 0) {
        figmaApiUrl = `https://api.figma.com/v1/files/${fileKey}/nodes?ids=${encodeURIComponent(nodeIds.join(","))}`;
      } else {
        figmaApiUrl = `https://api.figma.com/v1/files/${fileKey}`;
      }

      const figmaResponse = await fetch(figmaApiUrl, {
        headers: {
          "X-FIGMA-TOKEN": accessToken,
        },
      });

      if (figmaResponse.status === 403) {
        return NextResponse.json(
          { error: "Invalid or expired Figma access token. Please generate a new token from Figma settings." },
          { status: 403 }
        );
      }

      if (figmaResponse.status === 404) {
        return NextResponse.json(
          { error: "Figma file not found. Check the URL and ensure you have access to this file." },
          { status: 404 }
        );
      }

      if (figmaResponse.status === 429) {
        return NextResponse.json(
          { error: "Figma API rate limit exceeded. Please wait a moment and try again." },
          { status: 429 }
        );
      }

      if (!figmaResponse.ok) {
        const errorText = await figmaResponse.text();
        return NextResponse.json(
          { error: `Figma API error (${figmaResponse.status}): ${errorText}` },
          { status: figmaResponse.status }
        );
      }

      const figmaData = await figmaResponse.json();

      if (figmaData.nodes) {
        designNodes = Object.values(figmaData.nodes).map(
          (n: unknown) => (n as { document: FigmaNode }).document
        );
      } else if (figmaData.document) {
        designNodes = [figmaData.document];
      } else {
        return NextResponse.json(
          { error: "Unexpected Figma API response format" },
          { status: 500 }
        );
      }
    }

    // Extract design data from all nodes
    let combinedStructure = "";
    const allTokens: DesignTokens = { colors: [], fonts: [], spacing: [] };
    let totalLayers = 0;

    for (const node of designNodes) {
      const { tokens, layerCount, structure } = extractDesignData(node);
      combinedStructure += structure + "\n\n";
      allTokens.colors.push(...tokens.colors);
      allTokens.fonts.push(...tokens.fonts);
      allTokens.spacing.push(...tokens.spacing);
      totalLayers += layerCount;
    }

    // Deduplicate tokens
    allTokens.colors = [...new Set(allTokens.colors)];
    allTokens.fonts = [...new Set(allTokens.fonts)];
    allTokens.spacing = [...new Set(allTokens.spacing)].sort((a, b) => a - b);

    // Use Claude AI to convert design to HTML/CSS
    const anthropic = new Anthropic();

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 16000,
      messages: [
        {
          role: "user",
          content: `You are an expert frontend developer. Convert the following Figma design structure into clean, responsive HTML with inline CSS.

DESIGN STRUCTURE:
${combinedStructure}

DESIGN TOKENS:
- Colors: ${allTokens.colors.join(", ")}
- Fonts: ${allTokens.fonts.join(", ")}
- Spacing scale: ${allTokens.spacing.join(", ")}px

REQUIREMENTS:
1. Generate a complete, self-contained HTML document with embedded CSS
2. Map Figma auto-layout (HORIZONTAL/VERTICAL) to CSS Flexbox or Grid
3. Use the exact colors, fonts, and spacing from the design tokens
4. Add responsive breakpoints:
   - Mobile: max-width 768px
   - Tablet: max-width 1024px
   - Desktop: min-width 1025px
5. Convert Figma prototype interactions to CSS hover states and transitions
6. Use semantic HTML elements (header, nav, main, section, footer, etc.)
7. Include Google Fonts link if custom fonts are used
8. Ensure accessibility: proper contrast, alt text placeholders, ARIA labels
9. Add smooth transitions for interactive elements (300ms ease)
10. Use CSS custom properties for design tokens (colors, spacing, fonts)

Return ONLY the complete HTML code, no explanations or markdown code blocks.`,
        },
      ],
    });

    const html =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Clean up the HTML if wrapped in code blocks
    const cleanHtml = html
      .replace(/^```html?\n?/i, "")
      .replace(/\n?```$/i, "")
      .trim();

    return NextResponse.json({
      html: cleanHtml,
      designTokens: allTokens,
      layers: totalLayers,
    });
  } catch (error) {
    console.error("Figma import error:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid request body. Expected valid JSON." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process Figma design. Please try again." },
      { status: 500 }
    );
  }
}
