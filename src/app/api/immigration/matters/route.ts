/**
 * GET/POST /api/immigration/matters
 *
 * CRUD for immigration matters (cases).
 */

import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get("email");
    const status = request.nextUrl.searchParams.get("status");

    if (!email) {
      return NextResponse.json({ error: "email parameter required" }, { status: 400 });
    }

    let matters;
    if (status) {
      matters = await sql`
        SELECT * FROM immigration_matters
        WHERE user_email = ${email} AND status = ${status}
        ORDER BY updated_at DESC
      `;
    } else {
      matters = await sql`
        SELECT * FROM immigration_matters
        WHERE user_email = ${email}
        ORDER BY updated_at DESC
      `;
    }

    return NextResponse.json({ success: true, matters });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to fetch matters: ${String(error)}` },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      userEmail,
      candidateName,
      candidateData,
      sponsorData,
      jobTitle,
      jobDescription,
      offeredSalary,
      targetJurisdictions,
      priority,
      startDate,
      duration,
    } = body;

    if (!userEmail || !candidateName) {
      return NextResponse.json(
        { error: "userEmail and candidateName are required" },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO immigration_matters (
        user_email, candidate_name, candidate_data, sponsor_data,
        job_title, job_description, offered_salary,
        target_jurisdictions, priority, start_date, duration
      ) VALUES (
        ${userEmail},
        ${candidateName},
        ${JSON.stringify(candidateData ?? {})},
        ${JSON.stringify(sponsorData ?? {})},
        ${jobTitle ?? ""},
        ${jobDescription ?? ""},
        ${JSON.stringify(offeredSalary ?? {})},
        ${targetJurisdictions ?? []},
        ${priority ?? "standard"},
        ${startDate ?? null},
        ${duration ?? null}
      )
      RETURNING *
    `;

    return NextResponse.json({ success: true, matter: result[0] });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to create matter: ${String(error)}` },
      { status: 500 }
    );
  }
}
