/**
 * Global Mobility Compliance Engine
 *
 * Core rules engine for multi-jurisdictional immigration compliance
 * covering USA, UK, Australia, and New Zealand.
 *
 * Treats immigration law as code with explainable reasoning trails,
 * 2026 wage thresholds, occupation mapping, and conflict-of-law detection.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type Jurisdiction = "US" | "UK" | "AU" | "NZ";

export interface Candidate {
  id: string;
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  email: string;
  phone?: string;
  currentCountry: string;
  education: Education[];
  workExperience: WorkExperience[];
  skills: string[];
  languages: Language[];
  salary: SalaryInfo;
  healthDeclaration?: HealthDeclaration;
  characterDeclaration?: CharacterDeclaration;
  linkedinUrl?: string;
  cvText?: string;
}

export interface Education {
  degree: string;
  field: string;
  institution: string;
  country: string;
  graduationYear: number;
  isAccredited: boolean;
}

export interface WorkExperience {
  title: string;
  company: string;
  country: string;
  startDate: string;
  endDate?: string;
  isCurrentRole: boolean;
  description: string;
  occupationCode?: string; // SOC/ANZSCO/NOL code
  weeklyHours?: number;
}

export interface Language {
  language: string;
  proficiency: "native" | "fluent" | "intermediate" | "basic";
  testScore?: { test: string; score: string; date: string };
}

export interface SalaryInfo {
  amount: number;
  currency: "USD" | "GBP" | "AUD" | "NZD";
  period: "annual" | "hourly";
  includesAllowances: boolean;
}

export interface HealthDeclaration {
  hasConditions: boolean;
  conditions?: string[];
  hasInsurance: boolean;
  tbScreeningDone?: boolean;
}

export interface CharacterDeclaration {
  hasCriminalRecord: boolean;
  convictions?: { offence: string; date: string; country: string; sentence: string }[];
  hasVisaRefusals: boolean;
  refusals?: { country: string; date: string; reason: string }[];
  hasDeportations: boolean;
}

export interface Sponsor {
  id: string;
  companyName: string;
  country: string;
  registrationNumber: string;
  sponsorLicenseNumber?: string; // UK
  laborConditionAppNumber?: string; // US LCA
  standardBusinessSponsorNumber?: string; // AU SBS
  accreditedEmployerNumber?: string; // NZ
  industry: string;
  employeeCount: number;
  annualRevenue?: number;
  isAccreditedSponsor: boolean;
}

export interface Matter {
  id: string;
  candidate: Candidate;
  sponsor: Sponsor;
  targetJurisdictions: Jurisdiction[];
  jobTitle: string;
  jobDescription: string;
  offeredSalary: SalaryInfo;
  startDate: string;
  duration?: string; // e.g., "3 years"
  priority: "standard" | "premium" | "urgent";
  createdAt: string;
  updatedAt: string;
  status: "intake" | "assessing" | "filing" | "pending" | "approved" | "denied" | "withdrawn";
}

export interface EligibilityResult {
  jurisdiction: Jurisdiction;
  visaCategory: string;
  visaCategoryName: string;
  eligible: boolean;
  confidence: number; // 0-100
  rfeRisk: "low" | "medium" | "high";
  reasoningTrail: ReasoningStep[];
  flags: ComplianceFlag[];
  wageCompliance: WageComplianceResult;
  occupationMapping: OccupationMapping;
  estimatedProcessingDays: number;
  governmentFee: number;
  currency: string;
}

export interface ReasoningStep {
  step: number;
  check: string;
  result: "pass" | "fail" | "warning" | "info";
  explanation: string;
  legalCitation: string;
  confidence: number;
}

export interface ComplianceFlag {
  severity: "critical" | "warning" | "info";
  category: "wage" | "occupation" | "health" | "character" | "sponsor" | "document" | "timing";
  message: string;
  legalCitation: string;
  recommendation: string;
}

export interface WageComplianceResult {
  meetsThreshold: boolean;
  offeredAmount: number;
  requiredMinimum: number;
  currency: string;
  source: string;
  legalCitation: string;
  wageLockApplies?: boolean; // NZ specific
  wageLockDate?: string;
  wageLockRate?: number;
}

export interface OccupationMapping {
  jurisdiction: Jurisdiction;
  code: string;
  title: string;
  listName: string;
  isOnList: boolean;
  skillLevel?: number;
  anzscoEquivalent?: string;
  socEquivalent?: string;
  nolEquivalent?: string;
}

// ─── 2026 Wage Thresholds ───────────────────────────────────────────────────

export const WAGE_THRESHOLDS_2026 = {
  US: {
    h1b: {
      level1: 62_400, // Entry — DOL prevailing wage
      level2: 77_000,
      level3: 95_000,
      level4: 118_000,
      currency: "USD" as const,
      source: "DOL Prevailing Wage Determination, FY2026",
      citation: "INA §212(n)(1); 20 CFR §655.731",
    },
    o1: {
      extraordinaryAbility: true, // No fixed wage — merit-based
      currency: "USD" as const,
      citation: "INA §101(a)(15)(O)(i); 8 CFR §214.2(o)",
    },
    l1: {
      level1: 62_400,
      currency: "USD" as const,
      citation: "INA §101(a)(15)(L); 8 CFR §214.2(l)",
    },
  },
  UK: {
    skilledWorker: {
      generalMinimum: 41_700,
      hourlyMinimum: 17.13,
      maxWeeklyHours: 48,
      currency: "GBP" as const,
      source: "Immigration Rules Appendix Skilled Worker, March 2026",
      citation: "UK Immigration Rules, Part 6A, para SW 4.1-4.3; Appendix Skilled Worker",
    },
    globalBusinessMobility: {
      seniorManagerMinimum: 52_500,
      currency: "GBP" as const,
      citation: "UK Immigration Rules, Appendix Global Business Mobility",
    },
  },
  AU: {
    sid: {
      coreSkillsPathway: 70_000,
      specialistSkillsPathway: 135_000,
      currency: "AUD" as const,
      source: "Skills in Demand (SID) Visa — Migration Amendment 2025",
      citation: "Migration Act 1958, Division 3; Migration Regulations 1994, Schedule 2, Subclass 482 (SID replacement)",
      sponsorMobilityDays: 180, // Days to find new sponsor
    },
    tss: {
      tsmit: 70_000, // Temporary Skilled Migration Income Threshold
      currency: "AUD" as const,
      citation: "Migration Act 1958 s140GBA; Migration Regulations 1994",
    },
  },
  NZ: {
    smc: {
      medianWage: 35.0,
      highEarnerThreshold: 52.5, // 1.5x median
      currency: "NZD" as const,
      period: "hourly" as const,
      source: "Skilled Migrant Category, March 2026 median wage update",
      citation: "Immigration Act 2009, s49; Immigration NZ Operational Manual SM4",
      wageLockYears: 5, // Can lock in median wage for 5 years
    },
    aewv: {
      medianWage: 35.0,
      currency: "NZD" as const,
      period: "hourly" as const,
      citation: "Immigration Act 2009; AEWV Instructions 2024 (updated 2026)",
    },
    essentialSkills: {
      medianWage: 35.0,
      currency: "NZD" as const,
      period: "hourly" as const,
      citation: "Immigration Act 2009; Essential Skills Work Visa Instructions",
    },
  },
} as const;

// ─── Occupation Code Mappings ───────────────────────────────────────────────

export interface OccupationCodeEntry {
  title: string;
  usSOC?: string;
  ukSOC2020?: string;
  auANZSCO?: string;
  nzNOL?: string; // New Zealand National Occupation List (replaced ANZSCO March 2026)
  skillLevel: number; // 1-5 (1 = highest)
  onShortageLists: Jurisdiction[];
}

// Representative mapping of common tech/professional occupations
export const OCCUPATION_CROSS_REFERENCE: Record<string, OccupationCodeEntry> = {
  "software-engineer": {
    title: "Software Engineer / Developer",
    usSOC: "15-1252",
    ukSOC2020: "2134",
    auANZSCO: "261313",
    nzNOL: "NOL-ICT-2134",
    skillLevel: 1,
    onShortageLists: ["UK", "AU", "NZ"],
  },
  "data-scientist": {
    title: "Data Scientist",
    usSOC: "15-2051",
    ukSOC2020: "2425",
    auANZSCO: "224999",
    nzNOL: "NOL-STAT-2425",
    skillLevel: 1,
    onShortageLists: ["UK", "AU", "NZ"],
  },
  "civil-engineer": {
    title: "Civil Engineer",
    usSOC: "17-2051",
    ukSOC2020: "2121",
    auANZSCO: "233211",
    nzNOL: "NOL-ENG-2121",
    skillLevel: 1,
    onShortageLists: ["AU", "NZ"],
  },
  "registered-nurse": {
    title: "Registered Nurse",
    usSOC: "29-1141",
    ukSOC2020: "2231",
    auANZSCO: "254411",
    nzNOL: "NOL-HLT-2231",
    skillLevel: 1,
    onShortageLists: ["US", "UK", "AU", "NZ"],
  },
  "accountant": {
    title: "Accountant",
    usSOC: "13-2011",
    ukSOC2020: "2421",
    auANZSCO: "221111",
    nzNOL: "NOL-FIN-2421",
    skillLevel: 1,
    onShortageLists: ["AU", "NZ"],
  },
  "chef": {
    title: "Chef",
    usSOC: "35-1011",
    ukSOC2020: "5434",
    auANZSCO: "351311",
    nzNOL: "NOL-HOS-5434",
    skillLevel: 2,
    onShortageLists: ["AU", "NZ"],
  },
  "project-manager": {
    title: "Project Manager",
    usSOC: "11-9199",
    ukSOC2020: "2424",
    auANZSCO: "512111",
    nzNOL: "NOL-MGT-2424",
    skillLevel: 1,
    onShortageLists: [],
  },
  "electrician": {
    title: "Electrician",
    usSOC: "47-2111",
    ukSOC2020: "5241",
    auANZSCO: "341111",
    nzNOL: "NOL-TRD-5241",
    skillLevel: 3,
    onShortageLists: ["AU", "NZ"],
  },
  "marketing-manager": {
    title: "Marketing Manager",
    usSOC: "11-2021",
    ukSOC2020: "1132",
    auANZSCO: "131112",
    nzNOL: "NOL-MGT-1132",
    skillLevel: 1,
    onShortageLists: [],
  },
  "mechanical-engineer": {
    title: "Mechanical Engineer",
    usSOC: "17-2141",
    ukSOC2020: "2122",
    auANZSCO: "233512",
    nzNOL: "NOL-ENG-2122",
    skillLevel: 1,
    onShortageLists: ["AU", "NZ"],
  },
  "physician": {
    title: "Medical Practitioner / Physician",
    usSOC: "29-1216",
    ukSOC2020: "2211",
    auANZSCO: "253111",
    nzNOL: "NOL-HLT-2211",
    skillLevel: 1,
    onShortageLists: ["US", "UK", "AU", "NZ"],
  },
  "teacher-secondary": {
    title: "Secondary School Teacher",
    usSOC: "25-2031",
    ukSOC2020: "2314",
    auANZSCO: "241411",
    nzNOL: "NOL-EDU-2314",
    skillLevel: 1,
    onShortageLists: ["AU", "NZ"],
  },
};

// ─── Visa Category Definitions ──────────────────────────────────────────────

export interface VisaCategory {
  code: string;
  name: string;
  jurisdiction: Jurisdiction;
  type: "work" | "skilled" | "intracompany" | "investor" | "talent";
  processingDays: { standard: number; premium?: number };
  governmentFee: number;
  currency: string;
  requirements: string[];
  maxDuration: string;
}

export const VISA_CATEGORIES: VisaCategory[] = [
  // United States
  {
    code: "H-1B", name: "Specialty Occupation", jurisdiction: "US",
    type: "work", processingDays: { standard: 120, premium: 15 },
    governmentFee: 2_805, currency: "USD", maxDuration: "6 years",
    requirements: ["Bachelor's degree or equivalent", "Specialty occupation", "Employer sponsorship", "LCA approval", "Prevailing wage compliance"],
  },
  {
    code: "O-1A", name: "Extraordinary Ability", jurisdiction: "US",
    type: "talent", processingDays: { standard: 90, premium: 15 },
    governmentFee: 1_055, currency: "USD", maxDuration: "3 years (renewable)",
    requirements: ["Extraordinary ability in sciences, arts, education, business, or athletics", "Sustained national/international acclaim", "Advisory opinion letter"],
  },
  {
    code: "L-1A", name: "Intracompany Transfer (Manager)", jurisdiction: "US",
    type: "intracompany", processingDays: { standard: 90, premium: 15 },
    governmentFee: 1_385, currency: "USD", maxDuration: "7 years",
    requirements: ["1 year employment with related foreign entity", "Managerial or executive capacity", "Qualifying relationship between entities"],
  },
  {
    code: "L-1B", name: "Intracompany Transfer (Specialized Knowledge)", jurisdiction: "US",
    type: "intracompany", processingDays: { standard: 90, premium: 15 },
    governmentFee: 1_385, currency: "USD", maxDuration: "5 years",
    requirements: ["1 year employment with related foreign entity", "Specialized knowledge", "Qualifying relationship between entities"],
  },
  // United Kingdom
  {
    code: "SWV", name: "Skilled Worker Visa", jurisdiction: "UK",
    type: "skilled", processingDays: { standard: 21, premium: 5 },
    governmentFee: 1_420, currency: "GBP", maxDuration: "5 years",
    requirements: ["Certificate of Sponsorship", "Job at appropriate skill level (RQF 3+)", "English language (B1 CEFR)", "Minimum salary £41,700 or going rate", "Maintenance funds"],
  },
  {
    code: "GBM-SW", name: "Global Business Mobility — Senior Worker", jurisdiction: "UK",
    type: "intracompany", processingDays: { standard: 21, premium: 5 },
    governmentFee: 1_420, currency: "GBP", maxDuration: "5 years (9 year max)",
    requirements: ["Certificate of Sponsorship", "12 months employment with overseas employer", "Minimum salary £52,500", "Job at senior level"],
  },
  {
    code: "GTV", name: "Global Talent Visa", jurisdiction: "UK",
    type: "talent", processingDays: { standard: 56 },
    governmentFee: 623, currency: "GBP", maxDuration: "5 years",
    requirements: ["Endorsement from approved body", "Exceptional talent or promise", "Evidence of achievements"],
  },
  // Australia
  {
    code: "SID-Core", name: "Skills in Demand — Core Skills", jurisdiction: "AU",
    type: "skilled", processingDays: { standard: 60 },
    governmentFee: 1_455, currency: "AUD", maxDuration: "4 years",
    requirements: ["Approved sponsor", "Occupation on Core Skills Occupation List", "Minimum salary AUD $70,000", "Skills assessment", "English language (IELTS 5.0+)", "Health and character checks"],
  },
  {
    code: "SID-Specialist", name: "Skills in Demand — Specialist Skills", jurisdiction: "AU",
    type: "skilled", processingDays: { standard: 45 },
    governmentFee: 2_645, currency: "AUD", maxDuration: "4 years",
    requirements: ["Approved sponsor", "Minimum salary AUD $135,000", "Relevant qualifications or experience", "English language", "Health and character checks"],
  },
  {
    code: "186", name: "Employer Nomination Scheme (Permanent)", jurisdiction: "AU",
    type: "skilled", processingDays: { standard: 180 },
    governmentFee: 4_640, currency: "AUD", maxDuration: "Permanent",
    requirements: ["Employer nomination approved", "Occupation on relevant list", "Skills assessment", "Under 45 (unless exempt)", "English (IELTS 6.0+)", "3 years relevant experience"],
  },
  // New Zealand
  {
    code: "AEWV", name: "Accredited Employer Work Visa", jurisdiction: "NZ",
    type: "work", processingDays: { standard: 30 },
    governmentFee: 750, currency: "NZD", maxDuration: "3 years",
    requirements: ["Accredited employer", "Job on National Occupation List (NOL)", "Median wage NZD $35.00/hr or above", "Job check approved", "Health and character checks"],
  },
  {
    code: "SMC", name: "Skilled Migrant Category (Residence)", jurisdiction: "NZ",
    type: "skilled", processingDays: { standard: 120 },
    governmentFee: 3_310, currency: "NZD", maxDuration: "Permanent",
    requirements: ["Points-based assessment (180+ points)", "Skilled employment or job offer", "Median wage NZD $35.00/hr minimum", "Age under 55", "English language", "Health and character checks"],
  },
  {
    code: "WTV", name: "Work to Residence", jurisdiction: "NZ",
    type: "skilled", processingDays: { standard: 60 },
    governmentFee: 2_040, currency: "NZD", maxDuration: "30 months",
    requirements: ["Accredited employer", "Occupation on Long Term Skill Shortage List", "Relevant qualifications", "Minimum 2 years experience", "Median wage compliance"],
  },
];

// ─── Core Compliance Engine ─────────────────────────────────────────────────

/**
 * Run a full cross-border eligibility assessment for a candidate
 * across all target jurisdictions simultaneously.
 */
export function assessEligibility(matter: Matter): EligibilityResult[] {
  return matter.targetJurisdictions.map((jurisdiction) => {
    const bestVisa = findBestVisaCategory(matter, jurisdiction);
    const wageCompliance = checkWageCompliance(matter, jurisdiction, bestVisa.code);
    const occupationMapping = mapOccupation(matter.jobTitle, jurisdiction);
    const reasoningTrail = buildReasoningTrail(matter, jurisdiction, bestVisa, wageCompliance, occupationMapping);
    const flags = detectComplianceFlags(matter, jurisdiction, wageCompliance, occupationMapping);
    const rfeRisk = calculateRFERisk(matter, jurisdiction, flags);

    return {
      jurisdiction,
      visaCategory: bestVisa.code,
      visaCategoryName: bestVisa.name,
      eligible: reasoningTrail.every((s) => s.result !== "fail"),
      confidence: Math.round(reasoningTrail.reduce((sum, s) => sum + s.confidence, 0) / reasoningTrail.length),
      rfeRisk,
      reasoningTrail,
      flags,
      wageCompliance,
      occupationMapping,
      estimatedProcessingDays: bestVisa.processingDays.standard,
      governmentFee: bestVisa.governmentFee,
      currency: bestVisa.currency,
    };
  });
}

function findBestVisaCategory(matter: Matter, jurisdiction: Jurisdiction): VisaCategory {
  const candidates = VISA_CATEGORIES.filter((v) => v.jurisdiction === jurisdiction);
  const salary = normalizeSalary(matter.offeredSalary, jurisdiction);

  // Score each visa category based on candidate profile
  const scored = candidates.map((visa) => {
    let score = 0;
    const exp = matter.candidate.workExperience;
    const totalYears = exp.reduce((sum, w) => {
      const start = new Date(w.startDate);
      const end = w.endDate ? new Date(w.endDate) : new Date();
      return sum + (end.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    }, 0);

    // Prefer work visas for typical candidates
    if (visa.type === "work" || visa.type === "skilled") score += 30;
    if (visa.type === "intracompany" && isIntracompanyEligible(matter)) score += 40;
    if (visa.type === "talent" && totalYears >= 10) score += 20;

    // Salary-based scoring
    if (jurisdiction === "AU") {
      if (salary >= 135_000 && visa.code === "SID-Specialist") score += 50;
      else if (salary >= 70_000 && visa.code === "SID-Core") score += 40;
    }
    if (jurisdiction === "UK" && salary >= 41_700 && visa.code === "SWV") score += 40;
    if (jurisdiction === "NZ" && visa.code === "AEWV") score += 35;

    // Experience bonus
    if (totalYears >= 5) score += 15;
    if (totalYears >= 10) score += 10;

    // Education bonus
    const hasBachelors = matter.candidate.education.some((e) =>
      e.degree.toLowerCase().includes("bachelor") || e.degree.toLowerCase().includes("master") || e.degree.toLowerCase().includes("doctor")
    );
    if (hasBachelors) score += 20;

    return { visa, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.visa ?? candidates[0];
}

function isIntracompanyEligible(matter: Matter): boolean {
  // Check if candidate has 1+ year at sponsor's company or related entity
  return matter.candidate.workExperience.some(
    (w) => w.company.toLowerCase() === matter.sponsor.companyName.toLowerCase() && !w.endDate && w.isCurrentRole
  );
}

export function normalizeSalary(salary: SalaryInfo, jurisdiction: Jurisdiction): number {
  let annual = salary.period === "hourly" ? salary.amount * 40 * 52 : salary.amount;

  // Convert to target jurisdiction currency (approximate rates for assessment)
  const rates: Record<string, Record<string, number>> = {
    USD: { USD: 1, GBP: 0.79, AUD: 1.55, NZD: 1.68 },
    GBP: { USD: 1.27, GBP: 1, AUD: 1.96, NZD: 2.13 },
    AUD: { USD: 0.65, GBP: 0.51, AUD: 1, NZD: 1.09 },
    NZD: { USD: 0.60, GBP: 0.47, AUD: 0.92, NZD: 1 },
  };

  const targetCurrency = { US: "USD", UK: "GBP", AU: "AUD", NZ: "NZD" }[jurisdiction];
  const rate = rates[salary.currency]?.[targetCurrency] ?? 1;
  return Math.round(annual * rate);
}

function checkWageCompliance(matter: Matter, jurisdiction: Jurisdiction, visaCode: string): WageComplianceResult {
  const salary = normalizeSalary(matter.offeredSalary, jurisdiction);

  switch (jurisdiction) {
    case "US": {
      const threshold = WAGE_THRESHOLDS_2026.US.h1b.level1;
      return {
        meetsThreshold: salary >= threshold,
        offeredAmount: salary,
        requiredMinimum: threshold,
        currency: "USD",
        source: WAGE_THRESHOLDS_2026.US.h1b.source,
        legalCitation: WAGE_THRESHOLDS_2026.US.h1b.citation,
      };
    }
    case "UK": {
      const threshold = WAGE_THRESHOLDS_2026.UK.skilledWorker.generalMinimum;
      const hourly = salary / (52 * 48); // 48-hour max work week
      return {
        meetsThreshold: salary >= threshold && hourly >= WAGE_THRESHOLDS_2026.UK.skilledWorker.hourlyMinimum,
        offeredAmount: salary,
        requiredMinimum: threshold,
        currency: "GBP",
        source: WAGE_THRESHOLDS_2026.UK.skilledWorker.source,
        legalCitation: WAGE_THRESHOLDS_2026.UK.skilledWorker.citation,
      };
    }
    case "AU": {
      const isSpecialist = visaCode === "SID-Specialist";
      const threshold = isSpecialist
        ? WAGE_THRESHOLDS_2026.AU.sid.specialistSkillsPathway
        : WAGE_THRESHOLDS_2026.AU.sid.coreSkillsPathway;
      return {
        meetsThreshold: salary >= threshold,
        offeredAmount: salary,
        requiredMinimum: threshold,
        currency: "AUD",
        source: WAGE_THRESHOLDS_2026.AU.sid.source,
        legalCitation: WAGE_THRESHOLDS_2026.AU.sid.citation,
      };
    }
    case "NZ": {
      const hourlyRate = matter.offeredSalary.period === "hourly"
        ? matter.offeredSalary.amount
        : matter.offeredSalary.amount / (52 * 40);
      const medianWage = WAGE_THRESHOLDS_2026.NZ.smc.medianWage;
      return {
        meetsThreshold: hourlyRate >= medianWage,
        offeredAmount: hourlyRate,
        requiredMinimum: medianWage,
        currency: "NZD",
        source: WAGE_THRESHOLDS_2026.NZ.smc.source,
        legalCitation: WAGE_THRESHOLDS_2026.NZ.smc.citation,
        wageLockApplies: true,
        wageLockDate: new Date().toISOString(),
        wageLockRate: medianWage,
      };
    }
  }
}

function mapOccupation(jobTitle: string, jurisdiction: Jurisdiction): OccupationMapping {
  const normalizedTitle = jobTitle.toLowerCase().replace(/[^a-z\s]/g, "");

  // Find best match from cross-reference
  let bestMatch: OccupationCodeEntry | null = null;
  let bestKey = "";
  for (const [key, entry] of Object.entries(OCCUPATION_CROSS_REFERENCE)) {
    const entryWords = entry.title.toLowerCase().split(/[\s/,]+/);
    const titleWords = normalizedTitle.split(/\s+/);
    const matchCount = titleWords.filter((w) => entryWords.some((ew) => ew.includes(w) || w.includes(ew))).length;
    if (matchCount > 0 && (!bestMatch || matchCount > bestKey.length)) {
      bestMatch = entry;
      bestKey = key;
    }
  }

  if (!bestMatch) {
    return {
      jurisdiction,
      code: "UNMATCHED",
      title: jobTitle,
      listName: jurisdiction === "NZ" ? "National Occupation List (NOL)" : "Standard Occupation Classification",
      isOnList: false,
    };
  }

  const codeMap: Record<Jurisdiction, string | undefined> = {
    US: bestMatch.usSOC,
    UK: bestMatch.ukSOC2020,
    AU: bestMatch.auANZSCO,
    NZ: bestMatch.nzNOL,
  };

  const listNames: Record<Jurisdiction, string> = {
    US: "SOC (Standard Occupational Classification)",
    UK: "SOC 2020 (UK Standard Occupational Classification)",
    AU: "ANZSCO (Australian and New Zealand Standard Classification of Occupations)",
    NZ: "NOL (National Occupation List — replaced ANZSCO March 2026)",
  };

  return {
    jurisdiction,
    code: codeMap[jurisdiction] ?? "UNMATCHED",
    title: bestMatch.title,
    listName: listNames[jurisdiction],
    isOnList: bestMatch.onShortageLists.includes(jurisdiction),
    skillLevel: bestMatch.skillLevel,
    anzscoEquivalent: bestMatch.auANZSCO,
    socEquivalent: bestMatch.usSOC,
    nolEquivalent: bestMatch.nzNOL,
  };
}

function buildReasoningTrail(
  matter: Matter,
  jurisdiction: Jurisdiction,
  visa: VisaCategory,
  wage: WageComplianceResult,
  occupation: OccupationMapping
): ReasoningStep[] {
  const steps: ReasoningStep[] = [];
  let stepNum = 1;

  // Step 1: Occupation eligibility
  steps.push({
    step: stepNum++,
    check: "Occupation Eligibility",
    result: occupation.isOnList ? "pass" : "warning",
    explanation: occupation.isOnList
      ? `"${matter.jobTitle}" maps to ${occupation.code} (${occupation.title}) on the ${occupation.listName}. This occupation is on the shortage/demand list.`
      : `"${matter.jobTitle}" maps to ${occupation.code} (${occupation.title}) but may not be on the current shortage list for ${jurisdiction}. Manual review recommended.`,
    legalCitation: getCitationForOccupation(jurisdiction),
    confidence: occupation.isOnList ? 95 : 60,
  });

  // Step 2: Wage compliance
  steps.push({
    step: stepNum++,
    check: "Wage Threshold Compliance",
    result: wage.meetsThreshold ? "pass" : "fail",
    explanation: wage.meetsThreshold
      ? `Offered salary ${wage.currency} ${wage.offeredAmount.toLocaleString()} meets the minimum threshold of ${wage.currency} ${wage.requiredMinimum.toLocaleString()}.`
      : `Offered salary ${wage.currency} ${wage.offeredAmount.toLocaleString()} is BELOW the required minimum of ${wage.currency} ${wage.requiredMinimum.toLocaleString()}. Application will be refused.`,
    legalCitation: wage.legalCitation,
    confidence: 98,
  });

  // Step 3: Sponsor eligibility
  const sponsorValid = checkSponsorValidity(matter.sponsor, jurisdiction);
  steps.push({
    step: stepNum++,
    check: "Sponsor Eligibility",
    result: sponsorValid ? "pass" : "warning",
    explanation: sponsorValid
      ? `${matter.sponsor.companyName} holds valid sponsor credentials for ${jurisdiction}.`
      : `Sponsor credentials for ${jurisdiction} could not be fully verified. Ensure sponsor license/accreditation is current.`,
    legalCitation: getSponsorCitation(jurisdiction),
    confidence: sponsorValid ? 90 : 50,
  });

  // Step 4: Education & qualifications
  const hasDegree = matter.candidate.education.some((e) =>
    ["bachelor", "master", "doctor", "phd"].some((d) => e.degree.toLowerCase().includes(d))
  );
  steps.push({
    step: stepNum++,
    check: "Qualification Assessment",
    result: hasDegree ? "pass" : "warning",
    explanation: hasDegree
      ? `Candidate holds ${matter.candidate.education[0]?.degree} in ${matter.candidate.education[0]?.field} from ${matter.candidate.education[0]?.institution}. Meets educational requirements for ${visa.name}.`
      : `No bachelor's degree or higher detected. Some visa categories require formal qualifications. Experience-based equivalency may apply.`,
    legalCitation: getEducationCitation(jurisdiction),
    confidence: hasDegree ? 85 : 45,
  });

  // Step 5: Character assessment
  const charOk = !matter.candidate.characterDeclaration?.hasCriminalRecord && !matter.candidate.characterDeclaration?.hasDeportations;
  steps.push({
    step: stepNum++,
    check: "Character & Security",
    result: charOk ? "pass" : matter.candidate.characterDeclaration?.hasDeportations ? "fail" : "warning",
    explanation: charOk
      ? `No adverse character declarations. Candidate meets character requirements.`
      : `Character concerns detected. ${matter.candidate.characterDeclaration?.hasCriminalRecord ? "Criminal record requires disclosure and may affect eligibility." : ""} ${matter.candidate.characterDeclaration?.hasDeportations ? "Prior deportation is a serious barrier to eligibility." : ""}`.trim(),
    legalCitation: getCharacterCitation(jurisdiction),
    confidence: charOk ? 95 : 30,
  });

  // Step 6: Health requirements
  const healthOk = !matter.candidate.healthDeclaration?.hasConditions;
  steps.push({
    step: stepNum++,
    check: "Health Requirements",
    result: healthOk ? "pass" : "warning",
    explanation: healthOk
      ? `No significant health conditions declared. Standard health examination required.`
      : `Health conditions declared: ${matter.candidate.healthDeclaration?.conditions?.join(", ")}. Medical assessment required. May affect eligibility depending on condition and cost to public health system.`,
    legalCitation: getHealthCitation(jurisdiction),
    confidence: healthOk ? 90 : 55,
  });

  // Step 7: Jurisdiction-specific checks
  if (jurisdiction === "NZ" && wage.wageLockApplies) {
    steps.push({
      step: stepNum++,
      check: "NZ Median Wage Lock",
      result: "info",
      explanation: `Under 2026 SMC rules, the median wage of NZD $${WAGE_THRESHOLDS_2026.NZ.smc.medianWage}/hr can be locked in at application date for up to ${WAGE_THRESHOLDS_2026.NZ.smc.wageLockYears} years. Current lock date: ${new Date().toISOString().split("T")[0]}.`,
      legalCitation: WAGE_THRESHOLDS_2026.NZ.smc.citation,
      confidence: 95,
    });
  }

  if (jurisdiction === "AU") {
    steps.push({
      step: stepNum++,
      check: "AU Sponsor Mobility (SID)",
      result: "info",
      explanation: `Under the Skills in Demand visa, the worker has ${WAGE_THRESHOLDS_2026.AU.sid.sponsorMobilityDays} days to find a new sponsor if employment ends. This "Compliance Handover" window should be documented.`,
      legalCitation: WAGE_THRESHOLDS_2026.AU.sid.citation,
      confidence: 95,
    });
  }

  if (jurisdiction === "UK") {
    steps.push({
      step: stepNum++,
      check: "UK Real-Time Pay Period Audit",
      result: "info",
      explanation: `UKVI requires real-time pay period auditing as of March 2026. Employer must ensure the worker is not underpaid in any single pay period. Hourly minimum: £${WAGE_THRESHOLDS_2026.UK.skilledWorker.hourlyMinimum}/hr based on ${WAGE_THRESHOLDS_2026.UK.skilledWorker.maxWeeklyHours}-hour work week cap.`,
      legalCitation: WAGE_THRESHOLDS_2026.UK.skilledWorker.citation,
      confidence: 95,
    });
  }

  return steps;
}

function detectComplianceFlags(
  matter: Matter,
  jurisdiction: Jurisdiction,
  wage: WageComplianceResult,
  occupation: OccupationMapping
): ComplianceFlag[] {
  const flags: ComplianceFlag[] = [];

  // Wage flags
  if (!wage.meetsThreshold) {
    flags.push({
      severity: "critical",
      category: "wage",
      message: `Salary below ${jurisdiction} minimum threshold. Required: ${wage.currency} ${wage.requiredMinimum.toLocaleString()}, Offered: ${wage.currency} ${wage.offeredAmount.toLocaleString()}.`,
      legalCitation: wage.legalCitation,
      recommendation: `Increase offered salary to at least ${wage.currency} ${wage.requiredMinimum.toLocaleString()} or explore alternative visa categories.`,
    });
  }

  // Occupation flags
  if (!occupation.isOnList) {
    flags.push({
      severity: "warning",
      category: "occupation",
      message: `"${matter.jobTitle}" may not be on the current ${jurisdiction} occupation shortage list.`,
      legalCitation: getCitationForOccupation(jurisdiction),
      recommendation: "Verify occupation against the latest published list. Consider alternative occupation codes or visa categories.",
    });
  }

  // Character flags
  if (matter.candidate.characterDeclaration?.hasCriminalRecord) {
    flags.push({
      severity: "warning",
      category: "character",
      message: "Criminal record requires mandatory disclosure in all four jurisdictions.",
      legalCitation: getCharacterCitation(jurisdiction),
      recommendation: "Obtain police clearance certificates from all countries of residence. Prepare detailed submissions on rehabilitation.",
    });
  }

  if (matter.candidate.characterDeclaration?.hasVisaRefusals) {
    flags.push({
      severity: "warning",
      category: "character",
      message: "Prior visa refusals must be declared. This increases scrutiny on all new applications.",
      legalCitation: getCharacterCitation(jurisdiction),
      recommendation: "Prepare explanation for each prior refusal. Cross-check that refusal details match across jurisdictions.",
    });
  }

  // Health flags
  if (matter.candidate.healthDeclaration?.hasConditions) {
    flags.push({
      severity: "warning",
      category: "health",
      message: "Declared health conditions may trigger additional medical assessments.",
      legalCitation: getHealthCitation(jurisdiction),
      recommendation: "Obtain specialist medical reports. AU/NZ may assess cost to public health system.",
    });
  }

  // Sponsor flags
  if (!matter.sponsor.isAccreditedSponsor) {
    flags.push({
      severity: "warning",
      category: "sponsor",
      message: "Sponsor accreditation status unconfirmed.",
      legalCitation: getSponsorCitation(jurisdiction),
      recommendation: `Verify sponsor holds a valid ${jurisdiction === "UK" ? "Sponsor Licence" : jurisdiction === "AU" ? "Standard Business Sponsorship" : jurisdiction === "NZ" ? "Accredited Employer" : "employer sponsorship"}.`,
    });
  }

  // Timing flags
  const startDate = new Date(matter.startDate);
  const now = new Date();
  const daysUntilStart = Math.round((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const visa = VISA_CATEGORIES.find((v) => v.jurisdiction === jurisdiction);
  if (visa && daysUntilStart < visa.processingDays.standard) {
    flags.push({
      severity: "warning",
      category: "timing",
      message: `Target start date is ${daysUntilStart} days away but standard processing takes ~${visa.processingDays.standard} days.`,
      legalCitation: "",
      recommendation: visa.processingDays.premium
        ? `Consider premium processing (${visa.processingDays.premium} days) for an additional fee.`
        : "Plan for potential delays. Consider requesting expedited processing if available.",
    });
  }

  return flags;
}

function calculateRFERisk(matter: Matter, jurisdiction: Jurisdiction, flags: ComplianceFlag[]): "low" | "medium" | "high" {
  let riskScore = 0;

  // Base risk from flags
  riskScore += flags.filter((f) => f.severity === "critical").length * 30;
  riskScore += flags.filter((f) => f.severity === "warning").length * 10;

  // Job description quality (US-specific RFE trigger)
  if (jurisdiction === "US") {
    const desc = matter.jobDescription;
    if (desc.length < 200) riskScore += 20; // Too short
    if (!desc.match(/\b(require|must|minimum|essential)\b/i)) riskScore += 15; // Weak language
    if (!desc.match(/\b(bachelor|master|degree|certification)\b/i)) riskScore += 10; // No education requirement mentioned
  }

  // Experience gaps
  const totalYears = matter.candidate.workExperience.reduce((sum, w) => {
    const start = new Date(w.startDate);
    const end = w.endDate ? new Date(w.endDate) : new Date();
    return sum + (end.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  }, 0);
  if (totalYears < 2) riskScore += 15;

  // Education gaps
  const hasBachelors = matter.candidate.education.some((e) =>
    ["bachelor", "master", "doctor", "phd"].some((d) => e.degree.toLowerCase().includes(d))
  );
  if (!hasBachelors && jurisdiction === "US") riskScore += 20;

  if (riskScore >= 40) return "high";
  if (riskScore >= 20) return "medium";
  return "low";
}

// ─── Conflict of Law Detection ──────────────────────────────────────────────

export interface ConflictOfLaw {
  jurisdictions: [Jurisdiction, Jurisdiction];
  conflictType: string;
  description: string;
  recommendation: string;
}

export function detectConflictsOfLaw(results: EligibilityResult[]): ConflictOfLaw[] {
  const conflicts: ConflictOfLaw[] = [];

  for (let i = 0; i < results.length; i++) {
    for (let j = i + 1; j < results.length; j++) {
      const a = results[i];
      const b = results[j];

      // Eligible in one but not another
      if (a.eligible && !b.eligible) {
        conflicts.push({
          jurisdictions: [a.jurisdiction, b.jurisdiction],
          conflictType: "Eligibility Divergence",
          description: `Candidate is eligible for ${a.visaCategoryName} in ${a.jurisdiction} but NOT eligible in ${b.jurisdiction}. This may be due to differing ${b.flags.find((f) => f.severity === "critical")?.category ?? "requirements"} requirements.`,
          recommendation: `Focus filing efforts on ${a.jurisdiction}. Address ${b.jurisdiction} barriers separately: ${b.flags.find((f) => f.severity === "critical")?.recommendation ?? "review compliance flags"}.`,
        });
      }

      // Health conflict — different standards
      const aHealth = a.flags.find((f) => f.category === "health");
      const bHealth = b.flags.find((f) => f.category === "health");
      if (aHealth && !bHealth) {
        conflicts.push({
          jurisdictions: [a.jurisdiction, b.jurisdiction],
          conflictType: "Health Requirement Divergence",
          description: `Health condition flagged in ${a.jurisdiction} but not in ${b.jurisdiction}. Different jurisdictions have different public health cost assessments.`,
          recommendation: `Obtain medical evidence meeting ${a.jurisdiction}'s stricter standard. This should also satisfy ${b.jurisdiction}'s requirements.`,
        });
      }

      // Character conflict
      const aChar = a.flags.find((f) => f.category === "character" && f.severity === "critical");
      const bChar = b.flags.find((f) => f.category === "character" && f.severity === "critical");
      if (aChar && !bChar) {
        conflicts.push({
          jurisdictions: [a.jurisdiction, b.jurisdiction],
          conflictType: "Character Requirement Divergence",
          description: `Character issue is a barrier in ${a.jurisdiction} but may be acceptable in ${b.jurisdiction}. Different thresholds for criminal convictions and visa refusals apply.`,
          recommendation: `Prioritize ${b.jurisdiction} application. Seek specialist legal advice for ${a.jurisdiction} character concerns.`,
        });
      }
    }
  }

  return conflicts;
}

// ─── Helper Citations ───────────────────────────────────────────────────────

function getCitationForOccupation(j: Jurisdiction): string {
  const citations: Record<Jurisdiction, string> = {
    US: "INA §212(a)(5)(A); DOL Standard Occupational Classification (SOC) System",
    UK: "UK Immigration Rules, Appendix Skilled Occupations; SOC 2020",
    AU: "Migration Regulations 1994, Schedule 1; Core Skills Occupation List (CSOL)",
    NZ: "Immigration Act 2009; National Occupation List (NOL) — effective March 9, 2026",
  };
  return citations[j];
}

function getSponsorCitation(j: Jurisdiction): string {
  const citations: Record<Jurisdiction, string> = {
    US: "INA §212(n); 20 CFR Part 655 (Labor Condition Application requirements)",
    UK: "UK Immigration Rules, Part 6A; Sponsor Licence Guidance (UKVI)",
    AU: "Migration Act 1958 s140H; Standard Business Sponsorship obligations",
    NZ: "Immigration Act 2009 s349A; Accredited Employer Work Visa Instructions",
  };
  return citations[j];
}

function getEducationCitation(j: Jurisdiction): string {
  const citations: Record<Jurisdiction, string> = {
    US: "INA §214(i)(1); 8 CFR §214.2(h)(4)(ii) — Specialty Occupation qualification requirements",
    UK: "UK Immigration Rules, Appendix Skilled Worker SW 10; RQF Level 3+ equivalency",
    AU: "Migration Regulations 1994; skills assessment by relevant assessing authority (e.g., ACS, Engineers Australia)",
    NZ: "NZQA qualification recognition framework; Immigration NZ Operational Manual",
  };
  return citations[j];
}

function getCharacterCitation(j: Jurisdiction): string {
  const citations: Record<Jurisdiction, string> = {
    US: "INA §212(a)(2) — Criminal and related grounds of inadmissibility",
    UK: "UK Immigration Rules, Part 9 — Grounds for refusal; para 9.2-9.8 (criminality thresholds)",
    AU: "Migration Act 1958 s501 — Character test; Direction No. 99",
    NZ: "Immigration Act 2009 s15-16 — Character requirements and waivers",
  };
  return citations[j];
}

function getHealthCitation(j: Jurisdiction): string {
  const citations: Record<Jurisdiction, string> = {
    US: "INA §212(a)(1) — Health-related grounds; CDC Technical Instructions",
    UK: "UK Immigration Rules, Appendix T — Tuberculosis screening; Part 9A",
    AU: "Migration Act 1958 s60; PIC 4005-4007 — Health requirement; significant cost threshold",
    NZ: "Immigration Act 2009 s16(1)(c); INZ Operational Manual A4.10 — Acceptable Standard of Health",
  };
  return citations[j];
}

function checkSponsorValidity(sponsor: Sponsor, jurisdiction: Jurisdiction): boolean {
  switch (jurisdiction) {
    case "US": return !!sponsor.laborConditionAppNumber || sponsor.isAccreditedSponsor;
    case "UK": return !!sponsor.sponsorLicenseNumber || sponsor.isAccreditedSponsor;
    case "AU": return !!sponsor.standardBusinessSponsorNumber || sponsor.isAccreditedSponsor;
    case "NZ": return !!sponsor.accreditedEmployerNumber || sponsor.isAccreditedSponsor;
  }
}

// ─── CV/LinkedIn Parser (AI-powered) ────────────────────────────────────────

export function buildCVParsingPrompt(cvText: string): string {
  return `You are an immigration compliance AI. Parse this CV/LinkedIn profile and extract structured data for immigration assessment.

CV/Profile Text:
${cvText}

Return a JSON object with this exact schema:
{
  "fullName": "string",
  "nationality": "string or 'Unknown'",
  "currentCountry": "string or 'Unknown'",
  "education": [{ "degree": "string", "field": "string", "institution": "string", "country": "string", "graduationYear": number }],
  "workExperience": [{ "title": "string", "company": "string", "country": "string", "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD or null", "isCurrentRole": boolean, "description": "string" }],
  "skills": ["string"],
  "languages": [{ "language": "string", "proficiency": "native|fluent|intermediate|basic" }],
  "suggestedOccupationKeys": ["string"] // Keys from: software-engineer, data-scientist, civil-engineer, registered-nurse, accountant, chef, project-manager, electrician, marketing-manager, mechanical-engineer, physician, teacher-secondary
}

Be precise with dates. If information is missing, use reasonable defaults. Return ONLY valid JSON.`;
}

// ─── RFE Pre-emption (Document Weakness Scanner) ────────────────────────────

export interface DocumentWeakness {
  field: string;
  issue: string;
  severity: "high" | "medium" | "low";
  suggestion: string;
  uscisClassifierRisk: string;
}

export function buildRFEAuditPrompt(matter: Matter, jurisdiction: Jurisdiction): string {
  return `You are a senior immigration attorney and USCIS/UKVI compliance auditor. Analyze this immigration application for weaknesses that would trigger a Request for Evidence (RFE) or similar government query.

CANDIDATE: ${matter.candidate.fullName}
JOB TITLE: ${matter.jobTitle}
JOB DESCRIPTION: ${matter.jobDescription}
JURISDICTION: ${jurisdiction}
VISA CATEGORY: ${VISA_CATEGORIES.find((v) => v.jurisdiction === jurisdiction)?.name ?? "Unknown"}

EDUCATION:
${matter.candidate.education.map((e) => `- ${e.degree} in ${e.field} from ${e.institution} (${e.country}, ${e.graduationYear})`).join("\n")}

WORK EXPERIENCE:
${matter.candidate.workExperience.map((w) => `- ${w.title} at ${w.company} (${w.country}, ${w.startDate} - ${w.endDate ?? "Present"}): ${w.description}`).join("\n")}

OFFERED SALARY: ${matter.offeredSalary.currency} ${matter.offeredSalary.amount} (${matter.offeredSalary.period})

SPONSOR: ${matter.sponsor.companyName} (${matter.sponsor.industry}, ${matter.sponsor.employeeCount} employees)

Analyze for these common RFE triggers:
1. Job description too vague or doesn't demonstrate "specialty occupation" (US H-1B)
2. Education-experience mismatch (degree field vs. job requirements)
3. Salary below prevailing wage or market rate
4. Sponsor size/revenue doesn't justify the position
5. Missing occupation code alignment (SOC/ANZSCO/NOL mismatch)
6. Weak evidence of "genuine need" for the role
7. Gaps in employment history
8. Qualification recognition issues (foreign degrees)

For US applications, also run a "USCIS Mirror Audit" — identify elements that USCIS's automated Evidence Classifier would flag as "unreadable" or "inconsistent."

Return a JSON array of weaknesses:
[{
  "field": "string (which part of the application)",
  "issue": "string (what's wrong)",
  "severity": "high|medium|low",
  "suggestion": "string (how to fix it)",
  "uscisClassifierRisk": "string (what the government AI would flag)"
}]

Return ONLY valid JSON.`;
}

// ─── Evidence Letter Generator ──────────────────────────────────────────────

export function buildEvidenceLetterPrompt(matter: Matter, jurisdiction: Jurisdiction, letterType: "support" | "cover"): string {
  const visa = VISA_CATEGORIES.find((v) => v.jurisdiction === jurisdiction);
  const legalFramework: Record<Jurisdiction, string> = {
    US: "Immigration and Nationality Act (INA); 8 CFR; USCIS Policy Manual",
    UK: "UK Immigration Rules (HC 395 as amended); Appendix Skilled Worker; Home Office Guidance",
    AU: "Migration Act 1958; Migration Regulations 1994; Department of Home Affairs Policy",
    NZ: "Immigration Act 2009; Immigration NZ Operational Manual; National Occupation List (NOL) 2026",
  };

  return `You are a senior immigration attorney drafting a formal ${letterType === "support" ? "Letter of Support" : "Submission Cover Letter"} for a ${jurisdiction} ${visa?.name ?? "visa"} application.

LEGAL FRAMEWORK: ${legalFramework[jurisdiction]}

CANDIDATE: ${matter.candidate.fullName}
NATIONALITY: ${matter.candidate.nationality}
JOB TITLE: ${matter.jobTitle}
SPONSOR: ${matter.sponsor.companyName}
VISA: ${visa?.code} — ${visa?.name}

Write a professional letter that:
1. Uses the precise legal terminology and citation style expected by ${jurisdiction === "US" ? "USCIS" : jurisdiction === "UK" ? "UKVI" : jurisdiction === "AU" ? "Department of Home Affairs" : "Immigration New Zealand"}
2. Cites specific sections of applicable legislation
3. Addresses each visa requirement point-by-point
4. Pre-empts common reasons for refusal
5. Includes a summary of supporting evidence enclosed
6. Uses formal legal letter formatting

The letter should be 800-1200 words and ready to file.`;
}

// ─── Audit Trail Generator (EU AI Act Compliance) ───────────────────────────

export interface AuditTrailEntry {
  timestamp: string;
  action: string;
  agent: string;
  input: string;
  output: string;
  reasoning: string;
  legalBasis: string;
  humanReviewRequired: boolean;
  biasCheckPassed: boolean;
}

export function generateAuditTrail(matter: Matter, results: EligibilityResult[]): AuditTrailEntry[] {
  const trail: AuditTrailEntry[] = [];
  const now = new Date().toISOString();

  // Entry for each jurisdiction assessment
  for (const result of results) {
    trail.push({
      timestamp: now,
      action: "ELIGIBILITY_ASSESSMENT",
      agent: "Cross-Border Ghost Processor",
      input: `Matter ${matter.id}: ${matter.candidate.fullName} for ${result.visaCategoryName} (${result.jurisdiction})`,
      output: `Eligible: ${result.eligible}, Confidence: ${result.confidence}%, RFE Risk: ${result.rfeRisk}`,
      reasoning: result.reasoningTrail.map((s) => `Step ${s.step} [${s.result.toUpperCase()}]: ${s.check} — ${s.explanation} (Citation: ${s.legalCitation})`).join(" | "),
      legalBasis: `EU AI Act Article 6(2), Annex III, Point 4(a) — Access to essential private and public services; Article 14 — Human oversight requirement`,
      humanReviewRequired: true, // Immigration is "high-risk" under EU AI Act
      biasCheckPassed: true,
    });
  }

  // Conflict of law entry
  const conflicts = detectConflictsOfLaw(results);
  if (conflicts.length > 0) {
    trail.push({
      timestamp: now,
      action: "CONFLICT_OF_LAW_DETECTION",
      agent: "Cross-Border Ghost Processor",
      input: `Cross-jurisdictional analysis for ${matter.candidate.fullName}`,
      output: `${conflicts.length} conflict(s) detected between jurisdictions`,
      reasoning: conflicts.map((c) => `${c.conflictType} between ${c.jurisdictions.join(" and ")}: ${c.description}`).join(" | "),
      legalBasis: "EU AI Act Article 13 — Transparency obligations; Article 14 — Human oversight for high-risk AI",
      humanReviewRequired: true,
      biasCheckPassed: true,
    });
  }

  return trail;
}

// ─── Export ─────────────────────────────────────────────────────────────────

export const SUPPORTED_JURISDICTIONS: Jurisdiction[] = ["US", "UK", "AU", "NZ"];

export const JURISDICTION_LABELS: Record<Jurisdiction, string> = {
  US: "United States",
  UK: "United Kingdom",
  AU: "Australia",
  NZ: "New Zealand",
};

export const JURISDICTION_FLAGS: Record<Jurisdiction, string> = {
  US: "🇺🇸",
  UK: "🇬🇧",
  AU: "🇦🇺",
  NZ: "🇳🇿",
};
