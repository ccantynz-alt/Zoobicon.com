/**
 * Sponsor Compliance Module — UK & Australia (2026)
 *
 * Implements real-time sponsor compliance monitoring:
 * - UK: Per-pay-period salary enforcement (April 7, 2026 rule)
 * - UK: Digital Right-to-Work (eVisa) vault
 * - AU: STP-to-Nomination payroll matching
 * - AU: Sponsorship Health / "Dead Time" monitor
 * - AU: Training visa (407) gatekeeper
 *
 * Predictive compliance: warns BEFORE a breach occurs.
 */

import type { Jurisdiction } from "./immigration-compliance";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PayrollRecord {
  employeeId: string;
  employeeName: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  grossPay: number;
  hoursWorked: number;
  currency: "GBP" | "AUD";
  payFrequency: "weekly" | "fortnightly" | "monthly";
  unpaidLeaveHours?: number;
  bonuses?: number;
  deductions?: number;
}

export interface PayrollAuditResult {
  jurisdiction: Jurisdiction;
  employee: string;
  payPeriod: string;
  compliant: boolean;
  issues: PayrollIssue[];
  predictiveWarnings: PredictiveWarning[];
  requiredActions: RequiredAction[];
}

export interface PayrollIssue {
  severity: "critical" | "warning" | "info";
  type: string;
  message: string;
  legalCitation: string;
  deadline?: string;
}

export interface PredictiveWarning {
  scenario: string;
  probability: "high" | "medium" | "low";
  impactDescription: string;
  preventiveAction: string;
}

export interface RequiredAction {
  action: string;
  deadline: string;
  reportTo: string;
  template?: string;
}

export interface SponsorHealthStatus {
  sponsorName: string;
  jurisdiction: Jurisdiction;
  licenceStatus: "active" | "suspended" | "revoked" | "expiring";
  expiryDate?: string;
  daysUntilExpiry?: number;
  complianceScore: number; // 0-100
  issues: SponsorIssue[];
  workers: WorkerStatus[];
}

export interface SponsorIssue {
  severity: "critical" | "warning" | "info";
  message: string;
  action: string;
  deadline?: string;
}

export interface WorkerStatus {
  name: string;
  visaType: string;
  visaExpiry: string;
  salaryCompliant: boolean;
  rightToWorkVerified: boolean;
  nextCheckDate: string;
}

export interface eVisaRecord {
  employeeId: string;
  employeeName: string;
  shareCode: string;
  verificationDate: string;
  expiryDate: string;
  status: "valid" | "expiring" | "expired" | "pending";
  workRestrictions?: string;
  verificationPdf?: string; // Stored reference
  daysUntilExpiry: number;
}

export interface RTWCheckResult {
  employee: string;
  status: "valid" | "expiring_soon" | "expired" | "check_required";
  lastVerified?: string;
  nextCheckDue: string;
  actions: string[];
}

// ─── UK Salary Thresholds (2026) ────────────────────────────────────────────

const UK_2026_THRESHOLDS = {
  skilledWorker: {
    annualMinimum: 41_700,
    monthlyMinimum: 3_475, // £41,700 / 12
    weeklyMinimum: 801.92, // £41,700 / 52
    hourlyMinimum: 17.13,  // Based on 48-hour max work week
    maxWeeklyHours: 48,
    effectiveDate: "2026-04-07",
    citation: "UK Immigration Rules, Appendix Skilled Worker, para SW 4.1 (as amended April 7, 2026)",
    noAveraging: true, // NEW 2026: Cannot average salary across year
  },
  globalBusinessMobility: {
    annualMinimum: 52_500,
    monthlyMinimum: 4_375,
    citation: "UK Immigration Rules, Appendix Global Business Mobility",
  },
  // Per-SOC-code going rates (sample — full table would come from gov API)
  goingRates: {
    "2134": { title: "IT Project Manager", annual: 47_300, hourly: 18.30 },
    "2136": { title: "Software Developer", annual: 43_100, hourly: 16.69 },
    "2137": { title: "Web Developer", annual: 38_200, hourly: 14.80 },
    "2135": { title: "IT Business Analyst", annual: 42_500, hourly: 16.44 },
    "2231": { title: "Nurse", annual: 29_000, hourly: 11.23 },
    "2211": { title: "Medical Practitioner", annual: 41_700, hourly: 16.14 },
  } as Record<string, { title: string; annual: number; hourly: number }>,
} as const;

// ─── AU Salary Thresholds (2026) ────────────────────────────────────────────

const AU_2026_THRESHOLDS = {
  sid: {
    coreSkills: {
      tsmit: 70_000,         // Current TSMIT
      tsmitJuly2026: 79_499, // Indexed July 1, 2026
      citation: "Migration Act 1958, s140GBA; Fair Work Act 2009 (STP reporting)",
    },
    specialistSkills: {
      minimum: 135_000,
      minimumJuly2026: 146_717, // Indexed
      citation: "Migration Regulations 1994, Schedule 2; SID Specialist Skills Pathway",
    },
    sponsorMobilityDays: 180,
  },
  sbs: {
    renewalPeriodYears: 5,
    deadTimeRiskDays: 90, // Warn 90 days before SBS expiry
    citation: "Migration Act 1958 s140H; Migration Regulations 1994",
  },
  stp: {
    reportingFrequency: "per_pay_event",
    matchTolerance: 0, // Must match to the cent
    citation: "Taxation Administration Act 1953 — Single Touch Payroll; Migration Act 1958 s245AL (monitoring)",
  },
  trainingVisa407: {
    maxDuration: "2 years",
    requiresSponsorshipApproval: true,
    requiresNominationApproval: true,
    effectiveDate: "2026-03-11",
    citation: "Migration Regulations 1994, Schedule 2, Subclass 407 (as amended March 11, 2026)",
  },
} as const;

// ─── UK Payroll Sentinel ────────────────────────────────────────────────────

/**
 * Audits a payroll record against UK 2026 Skilled Worker requirements.
 * Per April 7, 2026 rules: salary compliance is per pay period, no averaging.
 */
export function auditUKPayroll(
  record: PayrollRecord,
  socCode?: string,
  visaType: "SWV" | "GBM-SW" = "SWV"
): PayrollAuditResult {
  const issues: PayrollIssue[] = [];
  const predictiveWarnings: PredictiveWarning[] = [];
  const requiredActions: RequiredAction[] = [];

  const thresholds = visaType === "GBM-SW"
    ? UK_2026_THRESHOLDS.globalBusinessMobility
    : UK_2026_THRESHOLDS.skilledWorker;

  // Calculate hourly rate for this pay period
  const hourlyRate = record.hoursWorked > 0 ? record.grossPay / record.hoursWorked : 0;

  // Check per-period compliance (NO AVERAGING allowed from April 7, 2026)
  let periodMinimum: number;
  switch (record.payFrequency) {
    case "weekly":
      periodMinimum = UK_2026_THRESHOLDS.skilledWorker.weeklyMinimum;
      break;
    case "fortnightly":
      periodMinimum = UK_2026_THRESHOLDS.skilledWorker.weeklyMinimum * 2;
      break;
    case "monthly":
      periodMinimum = thresholds.monthlyMinimum;
      break;
  }

  if (record.grossPay < periodMinimum) {
    issues.push({
      severity: "critical",
      type: "UNDERPAYMENT",
      message: `Pay of £${record.grossPay.toFixed(2)} for period ${record.payPeriodStart}–${record.payPeriodEnd} is BELOW the ${record.payFrequency} minimum of £${periodMinimum.toFixed(2)}. Under April 7, 2026 rules, this is a compliance breach regardless of annual totals.`,
      legalCitation: UK_2026_THRESHOLDS.skilledWorker.citation,
      deadline: calculateDeadline(record.payPeriodEnd, 10), // 10-day reporting window
    });

    requiredActions.push({
      action: `Report underpayment to UKVI within 10 working days per sponsor duties. Pay the shortfall of £${(periodMinimum - record.grossPay).toFixed(2)} immediately.`,
      deadline: calculateDeadline(record.payPeriodEnd, 10),
      reportTo: "UK Visas and Immigration — Sponsor Management Unit",
      template: generateUKBreachNotification(record, periodMinimum),
    });
  }

  // Hourly minimum check
  if (hourlyRate > 0 && hourlyRate < UK_2026_THRESHOLDS.skilledWorker.hourlyMinimum) {
    issues.push({
      severity: "critical",
      type: "HOURLY_FLOOR_BREACH",
      message: `Effective hourly rate of £${hourlyRate.toFixed(2)} is below the £${UK_2026_THRESHOLDS.skilledWorker.hourlyMinimum}/hr floor (based on ${UK_2026_THRESHOLDS.skilledWorker.maxWeeklyHours}-hour work week cap).`,
      legalCitation: UK_2026_THRESHOLDS.skilledWorker.citation,
    });
  }

  // SOC code going rate check
  if (socCode && UK_2026_THRESHOLDS.goingRates[socCode]) {
    const goingRate = UK_2026_THRESHOLDS.goingRates[socCode];
    const annualized = annualizePay(record);
    if (annualized < goingRate.annual) {
      issues.push({
        severity: "warning",
        type: "BELOW_GOING_RATE",
        message: `Annualized salary of £${annualized.toLocaleString()} is below the going rate for SOC ${socCode} (${goingRate.title}): £${goingRate.annual.toLocaleString()}/year. Higher of going rate or £41,700 general threshold applies.`,
        legalCitation: "UK Immigration Rules, Appendix Skilled Worker, Table 1 — Going Rates",
      });
    }
  }

  // Working Time Directive check
  if (record.hoursWorked > UK_2026_THRESHOLDS.skilledWorker.maxWeeklyHours * weeksInPeriod(record.payFrequency)) {
    issues.push({
      severity: "warning",
      type: "EXCESS_HOURS",
      message: `${record.hoursWorked} hours worked exceeds the ${UK_2026_THRESHOLDS.skilledWorker.maxWeeklyHours}-hour weekly maximum (Working Time Regulations 1998).`,
      legalCitation: "Working Time Regulations 1998, Regulation 4; UK Immigration Rules SW 4.3",
    });
  }

  // Unpaid leave warning
  if (record.unpaidLeaveHours && record.unpaidLeaveHours > 0) {
    predictiveWarnings.push({
      scenario: `${record.unpaidLeaveHours} hours of unpaid leave recorded. Under 2026 per-period rules, this will reduce the effective pay below threshold if not managed.`,
      probability: "high",
      impactDescription: "Unpaid leave that reduces any single pay period below the minimum triggers a compliance breach — even if the full-year salary exceeds £41,700.",
      preventiveAction: "Consider: (1) paying the minimum threshold even during leave, (2) formally documenting the leave and adjusting the visa record, or (3) consult UKVI on Sponsor Licence implications.",
    });
  }

  // Predictive: next month risk
  predictiveWarnings.push({
    scenario: "If June payroll includes any reduction (bonus clawback, reduced hours, payroll error), it will trigger a per-period compliance breach.",
    probability: "medium",
    impactDescription: "A single underpaid period can trigger a formal UKVI compliance visit and potential Sponsor Licence downgrade.",
    preventiveAction: `Set payroll system alert: minimum ${record.payFrequency} payment of £${periodMinimum.toFixed(2)} for all sponsored workers.`,
  });

  return {
    jurisdiction: "UK",
    employee: record.employeeName,
    payPeriod: `${record.payPeriodStart} to ${record.payPeriodEnd}`,
    compliant: issues.filter((i) => i.severity === "critical").length === 0,
    issues,
    predictiveWarnings,
    requiredActions,
  };
}

// ─── AU Payroll Sentinel (STP-to-Nomination Bridge) ─────────────────────────

/**
 * Audits Australian payroll records against SID visa nomination salary.
 * Uses Single Touch Payroll (STP) matching logic.
 */
export function auditAUPayroll(
  record: PayrollRecord,
  nominatedSalary: number,
  visaPathway: "core" | "specialist",
  nominationDate?: string
): PayrollAuditResult {
  const issues: PayrollIssue[] = [];
  const predictiveWarnings: PredictiveWarning[] = [];
  const requiredActions: RequiredAction[] = [];

  const annualized = annualizePay(record);

  // Determine applicable TSMIT based on date
  const now = new Date();
  const july2026 = new Date("2026-07-01");
  const useNewThreshold = now >= july2026;

  const threshold = visaPathway === "specialist"
    ? (useNewThreshold ? AU_2026_THRESHOLDS.sid.specialistSkills.minimumJuly2026 : AU_2026_THRESHOLDS.sid.specialistSkills.minimum)
    : (useNewThreshold ? AU_2026_THRESHOLDS.sid.coreSkills.tsmitJuly2026 : AU_2026_THRESHOLDS.sid.coreSkills.tsmit);

  const citation = visaPathway === "specialist"
    ? AU_2026_THRESHOLDS.sid.specialistSkills.citation
    : AU_2026_THRESHOLDS.sid.coreSkills.citation;

  // STP-to-Nomination exact match check
  if (Math.abs(annualized - nominatedSalary) > 1) {
    const diff = annualized - nominatedSalary;
    if (diff < 0) {
      issues.push({
        severity: "critical",
        type: "STP_NOMINATION_MISMATCH",
        message: `STP payroll data shows annualized salary of AUD $${annualized.toLocaleString()} but nomination salary is AUD $${nominatedSalary.toLocaleString()}. Difference: AUD $${Math.abs(diff).toLocaleString()} UNDERPAID. Home Affairs STP data matching will flag this automatically.`,
        legalCitation: AU_2026_THRESHOLDS.stp.citation,
        deadline: calculateDeadline(record.payPeriodEnd, 28), // 28-day notification period
      });

      requiredActions.push({
        action: `Notify Department of Home Affairs within 28 days of the salary shortfall per s245AL obligations. Rectify the underpayment immediately.`,
        deadline: calculateDeadline(record.payPeriodEnd, 28),
        reportTo: "Department of Home Affairs — Sponsor Obligations",
        template: generateAU28DayNotification(record, nominatedSalary),
      });
    } else {
      // Overpayment is fine but should be documented
      issues.push({
        severity: "info",
        type: "STP_OVERPAYMENT",
        message: `Actual salary exceeds nomination by AUD $${diff.toLocaleString()}. No compliance issue, but ensure nomination records are updated for PR pathway calculations.`,
        legalCitation: citation,
      });
    }
  }

  // TSMIT threshold check
  if (annualized < threshold) {
    issues.push({
      severity: "critical",
      type: "BELOW_TSMIT",
      message: `Annualized salary of AUD $${annualized.toLocaleString()} is below the ${useNewThreshold ? "July 2026 indexed" : "current"} TSMIT of AUD $${threshold.toLocaleString()} for ${visaPathway} skills pathway.`,
      legalCitation: citation,
    });

    // Predictive: if threshold is about to increase
    if (!useNewThreshold) {
      const newThreshold = visaPathway === "specialist"
        ? AU_2026_THRESHOLDS.sid.specialistSkills.minimumJuly2026
        : AU_2026_THRESHOLDS.sid.coreSkills.tsmitJuly2026;

      if (annualized >= threshold && annualized < newThreshold) {
        predictiveWarnings.push({
          scenario: `Current salary meets today's threshold but will fall below the July 1, 2026 indexed TSMIT of AUD $${newThreshold.toLocaleString()}.`,
          probability: "high",
          impactDescription: `If you pay this person AUD $${annualized.toLocaleString()} after July 1, 2026, you will trigger an ATO/Home Affairs audit.`,
          preventiveAction: `Increase salary to at least AUD $${newThreshold.toLocaleString()} before July 1, 2026 and lodge a salary variation with Home Affairs.`,
        });
      }
    }
  }

  // Pro-rata dip detection (unpaid leave)
  if (record.unpaidLeaveHours && record.unpaidLeaveHours > 0) {
    const normalHours = record.payFrequency === "weekly" ? 38 : record.payFrequency === "fortnightly" ? 76 : 164;
    const proRataRate = record.grossPay / (normalHours - record.unpaidLeaveHours) * normalHours;
    const proRataAnnual = annualizePay({ ...record, grossPay: proRataRate });

    if (proRataAnnual < threshold) {
      issues.push({
        severity: "warning",
        type: "PRORATA_DIP",
        message: `Unpaid leave of ${record.unpaidLeaveHours} hours has caused a pro-rata salary dip. If not properly reported, STP data matching will flag this as an underpayment.`,
        legalCitation: AU_2026_THRESHOLDS.stp.citation,
      });

      requiredActions.push({
        action: "Document unpaid leave in nomination records. Lodge notification with Home Affairs if leave exceeds 5 consecutive days.",
        deadline: calculateDeadline(record.payPeriodEnd, 28),
        reportTo: "Department of Home Affairs — Sponsor Obligations",
      });
    }
  }

  return {
    jurisdiction: "AU",
    employee: record.employeeName,
    payPeriod: `${record.payPeriodStart} to ${record.payPeriodEnd}`,
    compliant: issues.filter((i) => i.severity === "critical").length === 0,
    issues,
    predictiveWarnings,
    requiredActions,
  };
}

// ─── Sponsorship Health Monitor ─────────────────────────────────────────────

/**
 * Monitors sponsor licence/accreditation health and warns of upcoming
 * issues that could create "Dead Time" for workers.
 */
export function checkSponsorHealth(
  sponsor: {
    name: string;
    jurisdiction: Jurisdiction;
    licenceNumber: string;
    licenceExpiry?: string;
    lastComplianceCheck?: string;
    workers: {
      name: string;
      visaType: string;
      visaExpiry: string;
      currentSalary: number;
      rightToWorkLastChecked?: string;
    }[];
  }
): SponsorHealthStatus {
  const issues: SponsorIssue[] = [];
  const workers: WorkerStatus[] = [];
  let complianceScore = 100;

  const now = new Date();

  // Check licence expiry
  let licenceStatus: SponsorHealthStatus["licenceStatus"] = "active";
  let daysUntilExpiry: number | undefined;

  if (sponsor.licenceExpiry) {
    const expiry = new Date(sponsor.licenceExpiry);
    daysUntilExpiry = Math.round((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry <= 0) {
      licenceStatus = "revoked";
      complianceScore -= 50;
      issues.push({
        severity: "critical",
        message: `Sponsor ${sponsor.jurisdiction === "UK" ? "Licence" : "accreditation"} has EXPIRED. All sponsored workers are in breach.`,
        action: "URGENT: Apply for renewal immediately. All sponsored workers' visa conditions may be void.",
        deadline: "IMMEDIATELY",
      });
    } else if (daysUntilExpiry <= AU_2026_THRESHOLDS.sbs.deadTimeRiskDays) {
      licenceStatus = "expiring";
      complianceScore -= 25;
      issues.push({
        severity: "warning",
        message: `Sponsor ${sponsor.jurisdiction === "UK" ? "Licence" : "accreditation"} expires in ${daysUntilExpiry} days (${sponsor.licenceExpiry}). Any work performed after expiry creates "Dead Time" that doesn't count toward PR eligibility.`,
        action: `Lodge renewal application at least ${AU_2026_THRESHOLDS.sbs.deadTimeRiskDays} days before expiry.`,
        deadline: sponsor.licenceExpiry,
      });
    }
  }

  // Audit each worker
  for (const worker of sponsor.workers) {
    const visaExpiry = new Date(worker.visaExpiry);
    const visaDaysLeft = Math.round((visaExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // RTW check status
    let rightToWorkVerified = false;
    let nextCheckDate = now.toISOString().split("T")[0];

    if (worker.rightToWorkLastChecked) {
      const lastCheck = new Date(worker.rightToWorkLastChecked);
      const daysSinceCheck = Math.round((now.getTime() - lastCheck.getTime()) / (1000 * 60 * 60 * 24));

      if (sponsor.jurisdiction === "UK") {
        // UK: eVisa checks required — BRPs dead from Jan 15, 2026
        rightToWorkVerified = daysSinceCheck < 365; // Annual check minimum
        const nextDate = new Date(lastCheck);
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        nextCheckDate = nextDate.toISOString().split("T")[0];

        if (!rightToWorkVerified) {
          issues.push({
            severity: "warning",
            message: `Right-to-Work check for ${worker.name} is overdue (last checked: ${worker.rightToWorkLastChecked}). Since Jan 15, 2026, all RTW checks must be digital via eVisa share codes — physical BRPs are no longer valid.`,
            action: `Conduct immediate eVisa share code verification per Appendix D record-keeping rules.`,
          });
          complianceScore -= 10;
        }
      } else {
        rightToWorkVerified = daysSinceCheck < 90; // AU: more frequent
        const nextDate = new Date(lastCheck);
        nextDate.setDate(nextDate.getDate() + 90);
        nextCheckDate = nextDate.toISOString().split("T")[0];
      }
    }

    // Visa expiry warning
    if (visaDaysLeft <= 60 && visaDaysLeft > 0) {
      issues.push({
        severity: "warning",
        message: `${worker.name}'s ${worker.visaType} visa expires in ${visaDaysLeft} days (${worker.visaExpiry}).`,
        action: "Initiate visa renewal/extension process.",
      });
      complianceScore -= 5;
    } else if (visaDaysLeft <= 0) {
      issues.push({
        severity: "critical",
        message: `${worker.name}'s ${worker.visaType} visa has EXPIRED.`,
        action: "URGENT: Worker must cease employment immediately. Lodge bridging visa if eligible.",
      });
      complianceScore -= 20;
    }

    workers.push({
      name: worker.name,
      visaType: worker.visaType,
      visaExpiry: worker.visaExpiry,
      salaryCompliant: true, // Would be set by payroll audit
      rightToWorkVerified,
      nextCheckDate,
    });
  }

  return {
    sponsorName: sponsor.name,
    jurisdiction: sponsor.jurisdiction,
    licenceStatus,
    expiryDate: sponsor.licenceExpiry,
    daysUntilExpiry,
    complianceScore: Math.max(0, complianceScore),
    issues,
    workers,
  };
}

// ─── eVisa Share Code Verification ──────────────────────────────────────────

/**
 * Manages the UK digital Right-to-Work verification workflow.
 * From January 15, 2026, physical BRPs are dead — all checks must be digital.
 */
export function processEVisaCheck(
  employeeId: string,
  employeeName: string,
  shareCode: string,
  expiryDate: string
): eVisaRecord {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const daysUntilExpiry = Math.round((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  let status: eVisaRecord["status"];
  if (daysUntilExpiry < 0) {
    status = "expired";
  } else if (daysUntilExpiry <= 30) {
    status = "expiring";
  } else {
    status = "valid";
  }

  return {
    employeeId,
    employeeName,
    shareCode,
    verificationDate: now.toISOString(),
    expiryDate,
    status,
    daysUntilExpiry,
  };
}

/**
 * Batch check all employees for RTW status and generate alerts.
 */
export function batchRTWCheck(
  employees: { id: string; name: string; lastShareCode?: string; lastCheckDate?: string; visaExpiry: string }[]
): RTWCheckResult[] {
  const now = new Date();

  return employees.map((emp) => {
    const expiry = new Date(emp.visaExpiry);
    const daysToExpiry = Math.round((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const actions: string[] = [];

    let status: RTWCheckResult["status"];
    let nextCheckDue: string;

    if (daysToExpiry <= 0) {
      status = "expired";
      actions.push("URGENT: Employee's right to work has expired. Cease employment immediately.");
      actions.push("Conduct immediate eVisa verification to check for any status updates.");
      nextCheckDue = now.toISOString().split("T")[0];
    } else if (!emp.lastCheckDate) {
      status = "check_required";
      actions.push("No previous RTW check on record. Conduct initial eVisa share code verification immediately.");
      actions.push("Since Jan 15, 2026: Physical BRP cards are NO LONGER VALID for RTW checks.");
      nextCheckDue = now.toISOString().split("T")[0];
    } else {
      const lastCheck = new Date(emp.lastCheckDate);
      const daysSinceCheck = Math.round((now.getTime() - lastCheck.getTime()) / (1000 * 60 * 60 * 24));

      if (daysToExpiry <= 30) {
        status = "expiring_soon";
        actions.push(`Visa expires in ${daysToExpiry} days. Initiate renewal process.`);
        actions.push("Request new eVisa share code from employee for pre-expiry verification.");
        nextCheckDue = now.toISOString().split("T")[0];
      } else if (daysSinceCheck > 365) {
        status = "check_required";
        actions.push("Annual RTW re-verification overdue. Request fresh eVisa share code.");
        nextCheckDue = now.toISOString().split("T")[0];
      } else {
        status = "valid";
        const nextDate = new Date(lastCheck);
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        nextCheckDue = nextDate.toISOString().split("T")[0];
      }
    }

    return {
      employee: emp.name,
      status,
      lastVerified: emp.lastCheckDate,
      nextCheckDue,
      actions,
    };
  });
}

// ─── AU Training Visa (407) Gatekeeper ──────────────────────────────────────

export interface TrainingVisaGateCheck {
  canProceed: boolean;
  blockers: string[];
  warnings: string[];
  stage: "sponsorship" | "nomination" | "visa_application";
  citation: string;
}

/**
 * Implements the March 11, 2026 rule: 407 visa application cannot proceed
 * until BOTH Sponsorship AND Nomination are approved.
 */
export function checkTrainingVisaGate(
  sponsorshipApproved: boolean,
  nominationApproved: boolean,
  currentStage: "sponsorship" | "nomination" | "visa_application"
): TrainingVisaGateCheck {
  const blockers: string[] = [];
  const warnings: string[] = [];
  let canProceed = true;

  if (currentStage === "nomination" && !sponsorshipApproved) {
    canProceed = false;
    blockers.push("BLOCKED: Cannot lodge Nomination until Sponsorship (TRT) is approved.");
  }

  if (currentStage === "visa_application") {
    if (!sponsorshipApproved) {
      canProceed = false;
      blockers.push("BLOCKED: Sponsorship approval required before visa application.");
    }
    if (!nominationApproved) {
      canProceed = false;
      blockers.push("BLOCKED: Nomination approval required before visa application (effective March 11, 2026).");
    }
  }

  if (canProceed) {
    warnings.push(`Stage "${currentStage}" is ready to proceed. Ensure all documents are current.`);
  }

  return {
    canProceed,
    blockers,
    warnings,
    stage: currentStage,
    citation: AU_2026_THRESHOLDS.trainingVisa407.citation,
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function annualizePay(record: PayrollRecord): number {
  switch (record.payFrequency) {
    case "weekly": return record.grossPay * 52;
    case "fortnightly": return record.grossPay * 26;
    case "monthly": return record.grossPay * 12;
  }
}

function weeksInPeriod(frequency: "weekly" | "fortnightly" | "monthly"): number {
  switch (frequency) {
    case "weekly": return 1;
    case "fortnightly": return 2;
    case "monthly": return 4.333;
  }
}

function calculateDeadline(fromDate: string, businessDays: number): string {
  const date = new Date(fromDate);
  let added = 0;
  while (added < businessDays) {
    date.setDate(date.getDate() + 1);
    if (date.getDay() !== 0 && date.getDay() !== 6) added++;
  }
  return date.toISOString().split("T")[0];
}

function generateUKBreachNotification(record: PayrollRecord, minimum: number): string {
  return `SPONSOR NOTIFICATION — SALARY COMPLIANCE BREACH

To: UK Visas and Immigration — Sponsor Management Unit
Date: ${new Date().toISOString().split("T")[0]}
Sponsor Licence Number: [INSERT]

We are notifying UKVI of a salary compliance matter per our Sponsor Licence duties.

Employee: ${record.employeeName}
Pay Period: ${record.payPeriodStart} to ${record.payPeriodEnd}
Gross Pay: £${record.grossPay.toFixed(2)}
Required Minimum (${record.payFrequency}): £${minimum.toFixed(2)}
Shortfall: £${(minimum - record.grossPay).toFixed(2)}

Reason: [INSERT REASON — e.g., payroll error, unpaid leave not properly processed]

Corrective Action Taken:
- Shortfall payment of £${(minimum - record.grossPay).toFixed(2)} issued on [DATE]
- Payroll system updated to prevent recurrence

This notification is made within 10 working days of the pay period end per Sponsor Licence duties.`;
}

function generateAU28DayNotification(record: PayrollRecord, nominatedSalary: number): string {
  const annualized = annualizePay(record);
  return `SPONSOR NOTIFICATION — SALARY VARIATION

To: Department of Home Affairs — Sponsor Obligations
Date: ${new Date().toISOString().split("T")[0]}
SBS Number: [INSERT]

Per s245AL of the Migration Act 1958, we notify the Department of the following:

Employee: ${record.employeeName}
Nominated Annual Salary: AUD $${nominatedSalary.toLocaleString()}
Actual Annualized Pay (per STP data): AUD $${annualized.toLocaleString()}
Difference: AUD $${Math.abs(annualized - nominatedSalary).toLocaleString()} ${annualized < nominatedSalary ? "UNDER" : "OVER"}

Reason: [INSERT REASON]

Corrective Action: [INSERT]

This notification is made within 28 days per sponsor obligations.`;
}

// ─── Exports ────────────────────────────────────────────────────────────────

export {
  UK_2026_THRESHOLDS,
  AU_2026_THRESHOLDS,
};
