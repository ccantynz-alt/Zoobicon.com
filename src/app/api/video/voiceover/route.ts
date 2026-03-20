import { NextResponse } from "next/server";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

// Popular ElevenLabs voices for marketing content
const VOICES: Record<string, { id: string; name: string; description: string }> = {
  professional: { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", description: "Professional, warm, clear" },
  energetic: { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella", description: "Young, energetic, engaging" },
  authoritative: { id: "ErXwobaYiN019PkySvjV", name: "Antoni", description: "Deep, authoritative, trustworthy" },
  casual: { id: "MF3mGyEYCl7XYWbV9V6O", name: "Emily", description: "Casual, friendly, relatable" },
  narrator: { id: "VR6AewLTigWG4xSOukaG", name: "Arnold", description: "Cinematic narrator voice" },
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text, voice = "energetic", stability = 0.5, clarity = 0.75 } = body;

    if (!text?.trim()) {
      return NextResponse.json({ error: "Voiceover text is required" }, { status: 400 });
    }

    if (!ELEVENLABS_API_KEY) {
      // Return a placeholder response when API key not configured
      return NextResponse.json({
        audioUrl: null,
        voice: VOICES[voice] || VOICES.energetic,
        text,
        status: "not_configured",
        message: "ElevenLabs API key not configured. Add ELEVENLABS_API_KEY to .env.local to enable voiceover generation.",
        setup: {
          steps: [
            "Sign up at elevenlabs.io (free tier: 10,000 chars/month)",
            "Go to Profile → API Keys → Create API Key",
            "Add ELEVENLABS_API_KEY=your_key to .env.local",
            "Restart the dev server",
          ],
        },
      });
    }

    const selectedVoice = VOICES[voice] || VOICES.energetic;

    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${selectedVoice.id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability,
          similarity_boost: clarity,
          style: 0.5,
          use_speaker_boost: true,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`ElevenLabs API error ${res.status}: ${errText}`);
    }

    // Return audio as base64
    const audioBuffer = await res.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString("base64");

    return NextResponse.json({
      audioUrl: `data:audio/mpeg;base64,${base64Audio}`,
      voice: selectedVoice,
      text,
      status: "generated",
      durationEstimate: Math.ceil(text.split(" ").length / 2.5), // rough seconds estimate
    });
  } catch (err) {
    console.error("Voiceover generation error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Voiceover generation failed" },
      { status: 500 }
    );
  }
}

// Return available voices
export async function GET() {
  return NextResponse.json({
    voices: Object.entries(VOICES).map(([key, v]) => ({
      id: key,
      name: v.name,
      description: v.description,
    })),
    configured: !!ELEVENLABS_API_KEY,
  });
}
