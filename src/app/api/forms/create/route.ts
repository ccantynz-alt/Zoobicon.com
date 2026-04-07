import { NextRequest, NextResponse } from "next/server";
import {
  createForm,
  generateFormFromPrompt,
  type FormField,
} from "@/lib/form-builder";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      ownerId?: string;
      name?: string;
      fields?: FormField[];
      prompt?: string;
    };
    const ownerId = body.ownerId;
    const name = body.name;
    if (!ownerId || !name) {
      return NextResponse.json(
        { error: "ownerId and name are required" },
        { status: 400 }
      );
    }
    let fields: FormField[] = [];
    if (Array.isArray(body.fields) && body.fields.length > 0) {
      fields = body.fields;
    } else if (body.prompt) {
      fields = await generateFormFromPrompt(body.prompt);
    } else {
      return NextResponse.json(
        { error: "Provide fields[] or prompt" },
        { status: 400 }
      );
    }
    const form = await createForm(ownerId, name, fields);
    return NextResponse.json({ ok: true, form });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
