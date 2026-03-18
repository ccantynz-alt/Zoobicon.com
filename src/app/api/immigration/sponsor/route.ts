/**
 * POST /api/immigration/sponsor
 *
 * Sponsor Compliance endpoints:
 * - Payroll audit (UK/AU)
 * - Sponsor health check
 * - eVisa share code verification
 */

import { NextResponse } from "next/server";
import {
  auditUKPayroll,
  auditAUPayroll,
  checkSponsorHealth,
  processEVisaCheck,
  batchRTWCheck,
} from "@/lib/sponsor-compliance";
import type { PayrollRecord } from "@/lib/sponsor-compliance";
import type { Jurisdiction } from "@/lib/immigration-compliance";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body as { action: string };

    switch (action) {
      case "audit-payroll": {
        const { record, jurisdiction, socCode, nominatedSalary, visaPathway } = body as {
          record: PayrollRecord;
          jurisdiction: Jurisdiction;
          socCode?: string;
          nominatedSalary?: number;
          visaPathway?: "core" | "specialist";
        };

        if (!record || !jurisdiction) {
          return NextResponse.json({ error: "record and jurisdiction required" }, { status: 400 });
        }

        if (jurisdiction === "UK") {
          const result = auditUKPayroll(record, socCode);
          return NextResponse.json({ success: true, audit: result });
        } else if (jurisdiction === "AU") {
          const result = auditAUPayroll(record, nominatedSalary ?? 70000, visaPathway ?? "core");
          return NextResponse.json({ success: true, audit: result });
        } else {
          return NextResponse.json({ error: "Payroll audit available for UK and AU only" }, { status: 400 });
        }
      }

      case "sponsor-health": {
        const { sponsor } = body;
        if (!sponsor) {
          return NextResponse.json({ error: "sponsor data required" }, { status: 400 });
        }
        const result = checkSponsorHealth(sponsor);
        return NextResponse.json({ success: true, health: result });
      }

      case "evisa-check": {
        const { employeeId, employeeName, shareCode, expiryDate } = body;
        if (!employeeId || !shareCode || !expiryDate) {
          return NextResponse.json({ error: "employeeId, shareCode, and expiryDate required" }, { status: 400 });
        }
        const result = processEVisaCheck(employeeId, employeeName, shareCode, expiryDate);
        return NextResponse.json({ success: true, eVisa: result });
      }

      case "batch-rtw": {
        const { employees } = body;
        if (!employees?.length) {
          return NextResponse.json({ error: "employees array required" }, { status: 400 });
        }
        const results = batchRTWCheck(employees);
        return NextResponse.json({ success: true, results });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Use: audit-payroll, sponsor-health, evisa-check, batch-rtw` },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      { error: `Sponsor compliance check failed: ${String(error)}` },
      { status: 500 }
    );
  }
}
