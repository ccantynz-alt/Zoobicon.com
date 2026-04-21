import { NextRequest, NextResponse } from "next/server";
import {
  getProviderName,
  getTranscriptionPlans,
  transcribeAudio,
  transcribeUrl,
} from "@/lib/transcription-provider";

export async function GET() {
  try {
    const plans = await getTranscriptionPlans();
    return NextResponse.json({ provider: getProviderName(), plans });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch transcription plans" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json(
          { success: false, error: "No file provided in form data" },
          { status: 400 }
        );
      }

      const language = (formData.get("language") as string) || undefined;
      const punctuate = formData.get("punctuate") === "true" ? true : formData.get("punctuate") === "false" ? false : undefined;
      const paragraphs = formData.get("paragraphs") === "true" ? true : formData.get("paragraphs") === "false" ? false : undefined;
      const summarize = formData.get("summarize") === "true" ? true : formData.get("summarize") === "false" ? false : undefined;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const result = await transcribeAudio(buffer, language, {
        punctuate,
        paragraphs,
        summarize,
      });

      return NextResponse.json({ success: true, transcription: result });
    }

    // JSON body with audioUrl
    const body = await req.json();
    const { audioUrl, language, punctuate, paragraphs, summarize } = body;

    if (!audioUrl) {
      return NextResponse.json(
        { success: false, error: "audioUrl is required in JSON body" },
        { status: 400 }
      );
    }

    if (typeof audioUrl !== "string") {
      return NextResponse.json(
        { success: false, error: "audioUrl must be a string" },
        { status: 400 }
      );
    }

    // For URL-based transcription, if options are provided, use transcribeAudio via fetch
    // Otherwise use the simpler transcribeUrl
    if (punctuate !== undefined || paragraphs !== undefined || summarize !== undefined) {
      const audioRes = await fetch(audioUrl);
      if (!audioRes.ok) {
        return NextResponse.json(
          { success: false, error: `Failed to fetch audio from URL: ${audioRes.status}` },
          { status: 400 }
        );
      }
      const buffer = Buffer.from(await audioRes.arrayBuffer());
      const result = await transcribeAudio(buffer, language, {
        punctuate,
        paragraphs,
        summarize,
      });
      return NextResponse.json({ success: true, transcription: result });
    }

    const result = await transcribeUrl(audioUrl, language);
    return NextResponse.json({ success: true, transcription: result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Transcription failed" },
      { status: 500 }
    );
  }
}
