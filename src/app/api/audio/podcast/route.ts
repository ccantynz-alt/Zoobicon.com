import { NextRequest, NextResponse } from 'next/server';
import {
  generatePodcast,
  type PodcastHost,
  type PodcastLine,
} from '@/lib/audio-generator';

export const runtime = 'nodejs';
export const maxDuration = 300;

interface PodcastBody {
  title?: string;
  hosts?: PodcastHost[];
  script?: PodcastLine[];
  intro?: string;
  outro?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PodcastBody;
    if (!body.title || typeof body.title !== 'string') {
      return NextResponse.json(
        { error: 'Missing required field: title (string)' },
        { status: 400 }
      );
    }
    if (!Array.isArray(body.hosts) || body.hosts.length === 0) {
      return NextResponse.json(
        { error: 'Missing required field: hosts (non-empty array of {name, voice})' },
        { status: 400 }
      );
    }
    if (!Array.isArray(body.script) || body.script.length === 0) {
      return NextResponse.json(
        { error: 'Missing required field: script (non-empty array of {speaker, line})' },
        { status: 400 }
      );
    }
    const result = await generatePodcast({
      title: body.title,
      hosts: body.hosts,
      script: body.script,
      intro: body.intro,
      outro: body.outro,
    });
    return NextResponse.json({
      segments: result.segments,
      totalDuration: result.totalDuration,
      ttsModel: result.ttsModel,
      instructions: result.instructions,
      introMusicUrl: result.introMusicUrl,
      outroMusicUrl: result.outroMusicUrl,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
