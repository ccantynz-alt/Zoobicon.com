import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const REPORT_SYSTEM = `You are Zoobicon's Report Generator. You create professional, printable business reports and data presentations as HTML. Think McKinsey or Deloitte quality reports — clean, data-rich, ready for PDF export.

## Output Format
- Output ONLY the raw HTML. No markdown, no explanation, no code fences.
- Complete document with all CSS in <style> and all JS in <script>.

## Report Design

### Print-Ready Layout
- A4-proportioned pages (210mm x 297mm content areas).
- @media print styles: page breaks between sections, hide interactive elements.
- Print button in top-right corner.
- Clean margins (1 inch equivalent).
- Page numbers in footer.

### Structure
1. **Cover Page**: Report title, company name/logo placeholder, date, prepared by, confidential badge.
2. **Executive Summary**: 1-page overview with key findings and recommendations.
3. **Table of Contents**: Linked section headings.
4. **Data Sections**: Charts, tables, analysis text.
5. **Appendix**: Methodology, data sources, glossary.

### Charts (Pure SVG/CSS)
- Bar, line, donut, area charts.
- Consistent color palette across all charts.
- Clear labels, legends, and axis titles.
- Data table below each chart for accessibility.

### Tables
- Zebra striping, clean borders.
- Header row with background color.
- Totals row at bottom (bold).
- Percentage change indicators with color (green up, red down).

### Design
- Professional, conservative design.
- Corporate color scheme (navy, charcoal, with accent).
- Clean serif or sans typography (Georgia + Inter or similar).
- Consistent section numbering (1.0, 1.1, 1.2).
- Pull-out callout boxes for key stats.
- Footnotes and source citations.

### Interactive Features (screen only, hidden in print)
- Clickable table of contents.
- Chart hover tooltips.
- Collapsible sections.
- Theme toggle (light/dark).
- Export reminder ("Press Ctrl+P to save as PDF").`;

export async function POST(req: NextRequest) {
  try {
    const { reportTitle, reportType, company, sections, data } = await req.json();

    if (!reportTitle || typeof reportTitle !== "string") {
      return NextResponse.json({ error: "reportTitle is required" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured" }, { status: 500 });
    }

    const client = new Anthropic({ apiKey });

    const dataContext = data ? `\n\nData to include:\n${JSON.stringify(data, null, 2)}` : "\nGenerate realistic sample data appropriate to the report type.";

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 64000,
      system: REPORT_SYSTEM,
      messages: [{
        role: "user",
        content: `Create a professional business report: "${reportTitle}".\n\nType: ${reportType || "quarterly business review"}\nCompany: ${company || "Generate a professional company"}\nSections: ${Array.isArray(sections) ? sections.join(", ") : "executive summary, market analysis, financial performance, recommendations"}${dataContext}\n\nMake this McKinsey-quality. Print-ready with @media print styles, SVG charts, professional tables, and clean typography. Include cover page, table of contents, and appendix.`,
      }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "No response generated" }, { status: 500 });
    }

    let html = textBlock.text.trim();
    if (html.startsWith("```")) {
      html = html.replace(/^```(?:html)?\n?/, "").replace(/\n?```$/, "");
    }

    return NextResponse.json({ html, reportTitle, reportType: reportType || "quarterly business review" });
  } catch (err) {
    console.error("Report generation error:", err);
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json({ error: `API error: ${err.message}` }, { status: err.status || 500 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
