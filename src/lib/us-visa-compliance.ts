/**
 * US Visa Compliance — EB-2 NIW & O-1 Specialist Module
 *
 * Implements the "Anti-RFE Shield" for US immigration:
 * - EB-2 NIW: Dhanasar 2026 three-prong framework with specificity enforcement
 * - O-1: Extraordinary Ability threshold with "Adjudicator Fatigue" detection
 * - USCIS Evidence Classifier mirroring
 * - Premium Processing risk advisor
 * - Boilerplate RFE detection and rebuttal generation
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface NIWDhanasarAnalysis {
  prong1: ProngAnalysis; // National Importance
  prong2: ProngAnalysis; // Well-Positioned
  prong3: ProngAnalysis; // On Balance
  overallScore: number; // 0-100
  rfeRisk: "low" | "medium" | "high";
  premiumProcessingAdvice: "recommended" | "risky" | "avoid";
  specificityGaps: SpecificityGap[];
  recommendedEvidence: string[];
}

export interface ProngAnalysis {
  prongNumber: 1 | 2 | 3;
  prongName: string;
  score: number; // 0-100
  passed: boolean;
  reasoning: string;
  citations: string[];
  autoFailTriggers: string[];
  fixes: string[];
}

export interface SpecificityGap {
  field: string;
  issue: string;
  autoFailRisk: boolean;
  fix: string;
}

export interface O1CriterionAnalysis {
  criterion: string;
  criterionCode: string;
  met: boolean;
  evidenceStrength: "strong" | "moderate" | "weak" | "missing";
  reasoning: string;
  citation: string;
  fatigueRisk: boolean;
  alternativeFraming?: string;
}

export interface O1Analysis {
  criteriaAnalysis: O1CriterionAnalysis[];
  criteriaMet: number;
  criteriaRequired: number;
  eligible: boolean;
  overallMeritsAssessment: string;
  rfeRisk: "low" | "medium" | "high";
  premiumProcessingAdvice: "recommended" | "risky" | "avoid";
  adjudicatorFatigueTriggers: string[];
  recommendedActions: string[];
}

export interface EvidenceClassification {
  documentType: string;
  evidenceCategory: string;
  elasTag: string; // USCIS ELIS tag
  readabilityScore: number; // 0-100
  flaggedIssues: string[];
  recommendation: string;
}

export interface BoilerplateRFE {
  rfeCode: string;
  templateLanguage: string;
  frequency: "very_common" | "common" | "occasional";
  rebuttalStrategy: string;
  policyAuthority: string;
}

// ─── EB-2 NIW Dhanasar Analysis ─────────────────────────────────────────────

const NIST_AI_RMF_CATEGORIES = [
  "AI safety and security",
  "Responsible AI development",
  "AI risk management",
  "Trustworthy AI systems",
  "AI governance frameworks",
  "Machine learning fairness",
  "AI transparency and explainability",
  "Data privacy in AI systems",
  "AI bias mitigation",
  "Autonomous systems safety",
];

const CRITICAL_EMERGING_TECHNOLOGIES = [
  "Artificial Intelligence",
  "Quantum Computing",
  "Biotechnology",
  "Advanced Manufacturing",
  "Semiconductors",
  "Clean Energy Technology",
  "Autonomous Systems",
  "Cybersecurity",
  "Space Technology",
  "Advanced Networking (5G/6G)",
  "Directed Energy",
  "Hypersonics",
  "Financial Technology",
  "Human-Machine Interfaces",
];

export function analyzeEB2NIW(
  proposedEndeavor: string,
  candidateBackground: {
    publications?: number;
    citations?: number;
    patents?: number;
    grants?: { amount: number; source: string }[];
    investments?: { amount: number; source: string }[];
    lois?: number; // Letters of Intent
    governmentContracts?: number;
    industryPartners?: string[];
    kpis?: { metric: string; value: string }[];
    nistAlignment?: string;
  }
): NIWDhanasarAnalysis {
  const specificityGaps: SpecificityGap[] = [];
  const recommendedEvidence: string[] = [];

  // ── Prong 1: National Importance ──
  const prong1AutoFails: string[] = [];
  const prong1Fixes: string[] = [];
  let prong1Score = 50; // baseline

  // Check for vague "I am an expert" language
  const vaguePatterns = [
    /i am (?:an? )?expert/i,
    /significant contributions/i,
    /important work/i,
    /cutting[- ]edge research/i,
    /world[- ]class/i,
    /leading researcher/i,
  ];

  for (const pattern of vaguePatterns) {
    if (pattern.test(proposedEndeavor)) {
      prong1AutoFails.push(`Generalized merit language detected: "${proposedEndeavor.match(pattern)?.[0]}". 2026 adjudicators auto-flag this.`);
      prong1Score -= 15;
      prong1Fixes.push("Replace vague claims with specific, quantifiable impact statements (e.g., 'reduced processing time by 40% for 50,000 daily transactions').");
    }
  }

  // Check NIST AI RMF alignment
  const hasNISTAlignment = NIST_AI_RMF_CATEGORIES.some((cat) =>
    proposedEndeavor.toLowerCase().includes(cat.toLowerCase())
  ) || !!candidateBackground.nistAlignment;

  if (!hasNISTAlignment && proposedEndeavor.toLowerCase().includes("ai")) {
    prong1AutoFails.push("AI-related endeavor lacks NIST AI Risk Management Framework alignment — top RFE trigger in 2026.");
    prong1Score -= 20;
    prong1Fixes.push("Explicitly reference the NIST AI RMF (January 2023, updated 2025) and explain how the endeavor advances its goals.");
    specificityGaps.push({
      field: "Proposed Endeavor",
      issue: "No NIST AI RMF reference for AI-related petition",
      autoFailRisk: true,
      fix: "Add paragraph connecting work to specific NIST AI RMF categories (e.g., 'AI safety and security', 'Trustworthy AI systems').",
    });
  }

  // Check Critical Emerging Technologies alignment
  const hasCETAlignment = CRITICAL_EMERGING_TECHNOLOGIES.some((tech) =>
    proposedEndeavor.toLowerCase().includes(tech.toLowerCase())
  );
  if (hasCETAlignment) {
    prong1Score += 20;
  } else {
    specificityGaps.push({
      field: "Proposed Endeavor",
      issue: "Not linked to any Critical Emerging Technology list",
      autoFailRisk: false,
      fix: "If applicable, reference the DOC Critical and Emerging Technologies list to strengthen national importance argument.",
    });
  }

  // KPIs boost
  if (candidateBackground.kpis && candidateBackground.kpis.length >= 3) {
    prong1Score += 15;
  } else {
    specificityGaps.push({
      field: "Impact Metrics",
      issue: "Fewer than 3 quantifiable KPIs. Adjudicators expect measurable impact.",
      autoFailRisk: true,
      fix: "Add at least 3 specific KPIs (e.g., '500K users served', '$2M revenue generated', '30% efficiency improvement').",
    });
    recommendedEvidence.push("Add quantifiable impact metrics (KPIs) — at least 3 specific, measurable outcomes.");
  }

  const prong1: ProngAnalysis = {
    prongNumber: 1,
    prongName: "Substantial Merit and National Importance",
    score: Math.max(0, Math.min(100, prong1Score)),
    passed: prong1Score >= 50,
    reasoning: `Prong 1 assesses whether the proposed endeavor has substantial merit and national importance. ${hasCETAlignment ? "Endeavor aligns with Critical Emerging Technologies list." : "No CET alignment detected."} ${hasNISTAlignment ? "NIST AI RMF alignment confirmed." : ""} ${prong1AutoFails.length > 0 ? `WARNING: ${prong1AutoFails.length} auto-fail trigger(s) detected.` : "No auto-fail triggers."}`,
    citations: [
      "Matter of Dhanasar, 26 I&N Dec. 884 (AAO 2016) — Prong 1",
      "USCIS Policy Manual, Vol. 6, Part F, Ch. 5 — National Interest Waiver",
      "INA §203(b)(2)(B)(i)",
    ],
    autoFailTriggers: prong1AutoFails,
    fixes: prong1Fixes,
  };

  // ── Prong 2: Well-Positioned ──
  const prong2AutoFails: string[] = [];
  const prong2Fixes: string[] = [];
  let prong2Score = 50;

  // Check prospective evidence
  const hasProspectiveEvidence = (candidateBackground.investments?.length ?? 0) > 0
    || (candidateBackground.lois ?? 0) > 0
    || (candidateBackground.governmentContracts ?? 0) > 0
    || (candidateBackground.grants?.length ?? 0) > 0;

  if (!hasProspectiveEvidence) {
    prong2AutoFails.push("Missing 'prospective' evidence — no LOIs, grants, investments, or contracts showing the endeavor is viable going forward.");
    prong2Score -= 25;
    prong2Fixes.push("Obtain at least one Letter of Intent, grant award, or investment commitment demonstrating forward-looking viability.");
    recommendedEvidence.push("Letters of Intent from potential clients, partners, or government agencies.");
    recommendedEvidence.push("Grant awards or pending applications (NSF, NIH, DARPA, etc.).");
  } else {
    prong2Score += 20;
  }

  // Publication/citation impact
  if ((candidateBackground.publications ?? 0) > 5) prong2Score += 10;
  if ((candidateBackground.citations ?? 0) > 100) prong2Score += 15;
  if ((candidateBackground.patents ?? 0) > 0) prong2Score += 10;

  // Industry partners
  if ((candidateBackground.industryPartners?.length ?? 0) >= 2) {
    prong2Score += 10;
  }

  const prong2: ProngAnalysis = {
    prongNumber: 2,
    prongName: "Well-Positioned to Advance the Endeavor",
    score: Math.max(0, Math.min(100, prong2Score)),
    passed: prong2Score >= 50,
    reasoning: `Prong 2 assesses whether the petitioner is well-positioned to advance the proposed endeavor. ${hasProspectiveEvidence ? "Prospective evidence present (LOIs/grants/investments)." : "CRITICAL: No prospective evidence found."} Publications: ${candidateBackground.publications ?? 0}, Citations: ${candidateBackground.citations ?? 0}, Patents: ${candidateBackground.patents ?? 0}.`,
    citations: [
      "Matter of Dhanasar, 26 I&N Dec. 884 (AAO 2016) — Prong 2",
      "USCIS Policy Manual, Vol. 6, Part F, Ch. 5",
    ],
    autoFailTriggers: prong2AutoFails,
    fixes: prong2Fixes,
  };

  // ── Prong 3: On Balance ──
  const prong3AutoFails: string[] = [];
  const prong3Fixes: string[] = [];
  let prong3Score = 50;

  // PERM-impossibility argument
  const timeUrgentFields = [
    "ai safety", "artificial intelligence", "cybersecurity", "pandemic",
    "climate", "national security", "defense", "quantum",
  ];
  const isTimeUrgent = timeUrgentFields.some((field) =>
    proposedEndeavor.toLowerCase().includes(field)
  );

  if (isTimeUrgent) {
    prong3Score += 20;
  } else {
    prong3Fixes.push("Strengthen the 'PERM-Impossibility Argument' — explain why the labor certification process would be harmful to US interests due to the time-sensitive nature of the work.");
    specificityGaps.push({
      field: "On Balance Argument",
      issue: "No clear time-urgency argument for waiving labor certification",
      autoFailRisk: false,
      fix: "Articulate why the PERM process (which takes 12-18 months) would harm the national interest by delaying this specific work.",
    });
  }

  // Generic benefit language check
  const genericBenefitPatterns = [
    /benefit (?:the )?(?:united states|u\.?s\.?|america)/i,
    /good for (?:the )?(?:country|nation|economy)/i,
    /contribute to (?:the )?(?:economy|society)/i,
  ];

  for (const pattern of genericBenefitPatterns) {
    if (pattern.test(proposedEndeavor)) {
      prong3AutoFails.push(`Generic 'benefit to USA' prose detected: "${proposedEndeavor.match(pattern)?.[0]}". Must be replaced with specific, measurable impact.`);
      prong3Score -= 15;
    }
  }

  const prong3: ProngAnalysis = {
    prongNumber: 3,
    prongName: "On Balance, Beneficial to Waive Job Offer and Labor Certification",
    score: Math.max(0, Math.min(100, prong3Score)),
    passed: prong3Score >= 50,
    reasoning: `Prong 3 weighs whether waiving the job offer and labor certification requirements is, on balance, beneficial to the United States. ${isTimeUrgent ? "Time-urgency factor identified — strong PERM-impossibility argument available." : "No clear time-urgency detected."} ${prong3AutoFails.length > 0 ? `${prong3AutoFails.length} auto-fail trigger(s) found.` : ""}`,
    citations: [
      "Matter of Dhanasar, 26 I&N Dec. 884 (AAO 2016) — Prong 3",
      "NYSDOT, 22 I&N Dec. 215 (Act. Assoc. Comm. 1998) — superseded but still cited for PERM impossibility",
      "INA §203(b)(2)(B)(ii) — National Interest Waiver provision",
    ],
    autoFailTriggers: prong3AutoFails,
    fixes: prong3Fixes,
  };

  // ── Overall Assessment ──
  const overallScore = Math.round((prong1.score + prong2.score + prong3.score) / 3);
  const allPassed = prong1.passed && prong2.passed && prong3.passed;

  let premiumProcessingAdvice: "recommended" | "risky" | "avoid";
  if (overallScore >= 80 && allPassed) {
    premiumProcessingAdvice = "recommended";
  } else if (overallScore >= 60) {
    premiumProcessingAdvice = "risky";
  } else {
    premiumProcessingAdvice = "avoid";
  }

  return {
    prong1,
    prong2,
    prong3,
    overallScore,
    rfeRisk: overallScore >= 75 ? "low" : overallScore >= 50 ? "medium" : "high",
    premiumProcessingAdvice,
    specificityGaps,
    recommendedEvidence,
  };
}

// ─── O-1 Extraordinary Ability Analysis ─────────────────────────────────────

export const O1_CRITERIA = [
  { code: "awards", criterion: "Receipt of nationally or internationally recognized prizes or awards for excellence", citation: "8 C.F.R. §214.2(o)(3)(iii)(A)" },
  { code: "membership", criterion: "Membership in associations requiring outstanding achievements of their members", citation: "8 C.F.R. §214.2(o)(3)(iii)(B)" },
  { code: "press", criterion: "Published material in professional or major trade publications or major media about the beneficiary", citation: "8 C.F.R. §214.2(o)(3)(iii)(C)" },
  { code: "judging", criterion: "Participation as a judge of the work of others in the field", citation: "8 C.F.R. §214.2(o)(3)(iii)(D)" },
  { code: "contributions", criterion: "Original scientific, scholarly, or business-related contributions of major significance", citation: "8 C.F.R. §214.2(o)(3)(iii)(E)" },
  { code: "scholarly", criterion: "Authorship of scholarly articles in professional journals or major media", citation: "8 C.F.R. §214.2(o)(3)(iii)(F)" },
  { code: "exhibitions", criterion: "Display of work at artistic exhibitions or showcases", citation: "8 C.F.R. §214.2(o)(3)(iii)(G)" },
  { code: "critical_role", criterion: "Performance of a leading or critical role for organizations with distinguished reputations", citation: "8 C.F.R. §214.2(o)(3)(iii)(H)" },
  { code: "high_salary", criterion: "Commanding a high salary or other remuneration for services", citation: "8 C.F.R. §214.2(o)(3)(iii)(I)" },
  { code: "commercial_success", criterion: "Commercial successes in the performing arts", citation: "8 C.F.R. §214.2(o)(3)(iii)(J)" },
];

export function analyzeO1(
  candidateEvidence: Record<string, { description: string; documents: string[] }>,
  jobDuties: string,
  salary: number,
  isPerformingArts: boolean = false
): O1Analysis {
  const criteriaAnalysis: O1CriterionAnalysis[] = [];
  const adjudicatorFatigueTriggers: string[] = [];
  const recommendedActions: string[] = [];

  for (const criterion of O1_CRITERIA) {
    const evidence = candidateEvidence[criterion.code];
    let met = false;
    let strength: "strong" | "moderate" | "weak" | "missing" = "missing";
    let reasoning = "";
    let fatigueRisk = false;
    let alternativeFraming: string | undefined;

    if (!evidence) {
      reasoning = `No evidence submitted for this criterion.`;
    } else {
      // Score based on evidence quality
      const desc = evidence.description.toLowerCase();
      const docCount = evidence.documents.length;

      if (docCount >= 3 && desc.length > 100) {
        strength = "strong";
        met = true;
        reasoning = `${docCount} supporting documents provided with detailed description. Evidence appears sufficient.`;
      } else if (docCount >= 1 && desc.length > 50) {
        strength = "moderate";
        met = true;
        reasoning = `${docCount} supporting document(s) with moderate detail. Consider strengthening with additional evidence.`;
      } else if (docCount >= 1 || desc.length > 30) {
        strength = "weak";
        met = false;
        reasoning = `Evidence present but insufficient. Only ${docCount} document(s) with limited description.`;
      }

      // Adjudicator fatigue detection
      if (criterion.code === "contributions" && desc.length < 200) {
        fatigueRisk = true;
        adjudicatorFatigueTriggers.push(`"Contributions" criterion description is too brief (${desc.length} chars). Adjudicators reviewing 50+ petitions/day flag short descriptions.`);
      }
    }

    // Alternative framing for non-traditional candidates
    if (!met && criterion.code === "awards") {
      alternativeFraming = "For AI founders or tech professionals lacking traditional awards: frame accelerator acceptance (YC, Techstars), industry certifications, or 'Best Paper' awards as equivalent recognition.";
    }
    if (!met && criterion.code === "membership") {
      alternativeFraming = "Consider: IEEE Senior Member, ACM Distinguished Member, invitation-only industry groups, editorial board memberships, or advisory roles with selective criteria.";
    }
    if (!met && criterion.code === "press") {
      alternativeFraming = "Reframe: interviews on industry podcasts with significant listenership, quotes in TechCrunch/Forbes/Bloomberg, or featured case studies by major vendors.";
    }

    criteriaAnalysis.push({
      criterion: criterion.criterion,
      criterionCode: criterion.code,
      met,
      evidenceStrength: strength,
      reasoning,
      citation: criterion.citation,
      fatigueRisk,
      alternativeFraming,
    });
  }

  const criteriaMet = criteriaAnalysis.filter((c) => c.met).length;
  const criteriaRequired = 3; // O-1A requires meeting at least 3 of 10

  // Consistency check: job duties vs "extraordinary ability"
  const routinePatterns = [
    /day[- ]to[- ]day/i,
    /routine/i,
    /operational/i,
    /administrative/i,
    /general management/i,
    /standard/i,
  ];

  for (const pattern of routinePatterns) {
    if (pattern.test(jobDuties)) {
      adjudicatorFatigueTriggers.push(
        `Job duties contain "${jobDuties.match(pattern)?.[0]}" language — inconsistent with "extraordinary ability" narrative. Adjudicators flag this as "routine operational delivery."`
      );
    }
  }

  // High salary check
  const o1SalaryThreshold = 150_000; // Unofficial but commonly expected
  if (salary < o1SalaryThreshold) {
    recommendedActions.push(`Salary of $${salary.toLocaleString()} is below the typical O-1 threshold (~$${o1SalaryThreshold.toLocaleString()}). Consider: document that salary reflects the field's norms, or negotiate higher compensation.`);
  }

  // Premium processing advice
  const rfeRisk = criteriaMet >= 5 ? "low" : criteriaMet >= 3 ? "medium" : "high";
  let premiumProcessingAdvice: "recommended" | "risky" | "avoid";
  if (criteriaMet >= 5 && adjudicatorFatigueTriggers.length === 0) {
    premiumProcessingAdvice = "recommended";
  } else if (criteriaMet >= 3 && adjudicatorFatigueTriggers.length <= 2) {
    premiumProcessingAdvice = "risky";
    recommendedActions.push("Premium Processing for borderline O-1 cases triggers poorly-reasoned RFEs in 2026. Consider Regular Processing with strong initial filing.");
  } else {
    premiumProcessingAdvice = "avoid";
    recommendedActions.push("STRONGLY AVOID Premium Processing. 2026 data shows Premium triggers boilerplate RFEs for cases below 90% confidence. File Regular with comprehensive evidence package.");
  }

  const overallMeritsAssessment = criteriaMet >= criteriaRequired
    ? `Candidate meets ${criteriaMet} of ${O1_CRITERIA.length} criteria (${criteriaRequired} required). Under the "Overall Merits" analysis framework, the totality of evidence ${criteriaMet >= 5 ? "strongly" : "adequately"} demonstrates extraordinary ability. ${adjudicatorFatigueTriggers.length > 0 ? `However, ${adjudicatorFatigueTriggers.length} fatigue trigger(s) should be addressed.` : ""}`
    : `Candidate meets only ${criteriaMet} of ${criteriaRequired} required criteria. Petition is NOT ready for filing. ${criteriaAnalysis.filter((c) => !c.met && c.alternativeFraming).length} criteria have alternative framing options available.`;

  return {
    criteriaAnalysis,
    criteriaMet,
    criteriaRequired,
    eligible: criteriaMet >= criteriaRequired,
    overallMeritsAssessment,
    rfeRisk,
    premiumProcessingAdvice,
    adjudicatorFatigueTriggers,
    recommendedActions,
  };
}

// ─── USCIS Evidence Classifier Mirror ───────────────────────────────────────

export function classifyEvidence(documents: { name: string; type: string; content: string }[]): EvidenceClassification[] {
  return documents.map((doc) => {
    const content = doc.content.toLowerCase();
    let evidenceCategory = "Unclassified";
    let elasTag = "UNC";
    const flaggedIssues: string[] = [];
    let readabilityScore = 70;
    let recommendation = "";

    // Classify by content type
    if (content.includes("peer-review") || content.includes("journal") || content.includes("published")) {
      evidenceCategory = "Scholarly Articles";
      elasTag = "SA-PUB";
      readabilityScore = 85;
    } else if (content.includes("recommendation") || content.includes("i am writing to support") || content.includes("it is my pleasure")) {
      evidenceCategory = "Recommendation Letters";
      elasTag = "RL-SUP";
      readabilityScore = 80;

      // Check for "form letter" patterns
      if (content.includes("to whom it may concern")) {
        flaggedIssues.push("Generic salutation 'To Whom It May Concern' — USCIS Evidence Classifier flags this as 'Template Letter'.");
        readabilityScore -= 20;
      }
    } else if (content.includes("patent") || content.includes("invention")) {
      evidenceCategory = "Patent Documentation";
      elasTag = "PAT-IP";
      readabilityScore = 90;
    } else if (content.includes("award") || content.includes("prize") || content.includes("honor")) {
      evidenceCategory = "Awards & Recognition";
      elasTag = "AW-REC";
      readabilityScore = 85;
    } else if (content.includes("contract") || content.includes("agreement") || content.includes("compensation")) {
      evidenceCategory = "Employment & Contract";
      elasTag = "EMP-CON";
      readabilityScore = 75;
    } else if (content.includes("media") || content.includes("interview") || content.includes("article about")) {
      evidenceCategory = "Press & Media Coverage";
      elasTag = "PR-MED";
      readabilityScore = 80;
    } else if (content.includes("degree") || content.includes("diploma") || content.includes("transcript")) {
      evidenceCategory = "Educational Credentials";
      elasTag = "EDU-CRD";
      readabilityScore = 85;
    }

    // Scan for common issues
    if (content.length < 100) {
      flaggedIssues.push("Document content appears too short — may be flagged as 'Insufficient Evidence' by automated classifier.");
      readabilityScore -= 15;
    }

    if (doc.type === "image" || doc.name.match(/\.(jpg|png|gif|bmp)$/i)) {
      flaggedIssues.push("Image-based document — USCIS OCR may fail to read. Convert to searchable PDF.");
      readabilityScore -= 25;
      recommendation = "Convert all image-based documents to searchable PDF format before filing.";
    }

    if (!recommendation) {
      recommendation = flaggedIssues.length === 0
        ? "Document appears well-formatted for USCIS processing."
        : `Address ${flaggedIssues.length} issue(s) before filing to reduce RFE risk.`;
    }

    return {
      documentType: doc.type,
      evidenceCategory,
      elasTag,
      readabilityScore: Math.max(0, Math.min(100, readabilityScore)),
      flaggedIssues,
      recommendation,
    };
  });
}

// ─── Common Boilerplate RFEs (2026 Database) ────────────────────────────────

export const BOILERPLATE_RFES_2026: BoilerplateRFE[] = [
  {
    rfeCode: "H1B-SO-001",
    templateLanguage: "The record does not establish that the proffered position qualifies as a specialty occupation under 8 C.F.R. § 214.2(h)(4)(ii).",
    frequency: "very_common",
    rebuttalStrategy: "Cite DOL O*NET database entry for the specific SOC code showing 'typically requires a bachelor's degree.' Include expert opinion letter from professor in the field. Reference AAO precedent decisions finding similar positions as specialty occupations.",
    policyAuthority: "USCIS Policy Manual, Vol. 2, Part H, Ch. 2 — Specialty Occupation",
  },
  {
    rfeCode: "H1B-BEN-002",
    templateLanguage: "The evidence submitted is insufficient to establish that the beneficiary holds the required degree or its equivalent.",
    frequency: "common",
    rebuttalStrategy: "Submit credentials evaluation from NACES-member agency. For experience-based equivalency, document the 3-for-1 rule (3 years progressive experience = 1 year education) with expert opinion.",
    policyAuthority: "8 C.F.R. § 214.2(h)(4)(iii)(C) — Equivalency provisions",
  },
  {
    rfeCode: "NIW-P1-001",
    templateLanguage: "The petitioner has not established that the proposed endeavor has both substantial merit and national importance.",
    frequency: "very_common",
    rebuttalStrategy: "Provide: (1) quantifiable impact metrics (KPIs), (2) alignment with federal priority areas (NSF, NIST, DOE), (3) letters from independent experts in the field confirming national importance. Avoid generalized statements about 'benefiting the economy.'",
    policyAuthority: "Matter of Dhanasar, 26 I&N Dec. 884 (AAO 2016) — Prong 1",
  },
  {
    rfeCode: "NIW-P2-001",
    templateLanguage: "The record does not sufficiently establish that the petitioner is well-positioned to advance the proposed endeavor.",
    frequency: "common",
    rebuttalStrategy: "Submit forward-looking evidence: Letters of Intent from partners/clients, grant applications (pending or awarded), investment documentation, business plan with market analysis. USCIS wants to see 'prospective' evidence, not just past achievements.",
    policyAuthority: "Matter of Dhanasar — Prong 2; USCIS Policy Alert PA-2016-15",
  },
  {
    rfeCode: "O1-EA-001",
    templateLanguage: "The evidence does not establish that the beneficiary has received sustained national or international acclaim and is one of the small percentage who has risen to the top of the field.",
    frequency: "very_common",
    rebuttalStrategy: "Address under 'Overall Merits' framework per Kazarian v. USCIS, 596 F.3d 1115 (9th Cir. 2010). Demonstrate totality of evidence shows extraordinary ability even if individual criteria are borderline. Submit comparative analysis showing beneficiary's standing relative to peers.",
    policyAuthority: "8 C.F.R. § 214.2(o)(3)(iii); Kazarian, 596 F.3d 1115; USCIS Policy Memo PM-602-0005.1",
  },
  {
    rfeCode: "O1-ITIN-001",
    templateLanguage: "The petitioner has not submitted a complete itinerary of the beneficiary's proposed events or activities.",
    frequency: "common",
    rebuttalStrategy: "For entrepreneurs/researchers: provide detailed work plan, milestones, contracts, and advisory agreements. The 'itinerary' requirement is flexible for non-entertainment O-1s — cite USCIS Policy Manual Vol. 2, Part M.",
    policyAuthority: "INA § 214(a)(2)(B); 8 C.F.R. § 214.2(o)(2)(ii)",
  },
];

export function findMatchingRFEs(rfeText: string): BoilerplateRFE[] {
  return BOILERPLATE_RFES_2026.filter((rfe) => {
    const rfeWords = rfe.templateLanguage.toLowerCase().split(/\s+/);
    const inputWords = rfeText.toLowerCase().split(/\s+/);
    const matchCount = rfeWords.filter((w) => inputWords.includes(w)).length;
    return matchCount / rfeWords.length > 0.3; // 30%+ word overlap
  });
}

// ─── Premium Processing Advisor ─────────────────────────────────────────────

export interface PremiumProcessingAdvice {
  recommended: boolean;
  confidenceScore: number;
  reasoning: string;
  risks: string[];
  alternatives: string[];
}

export function advisePremiumProcessing(
  visaType: "H-1B" | "O-1A" | "O-1B" | "L-1A" | "L-1B" | "EB-2-NIW",
  overallConfidence: number,
  rfeRisk: "low" | "medium" | "high",
  hasUrgentDeadline: boolean
): PremiumProcessingAdvice {
  const risks: string[] = [];
  const alternatives: string[] = [];
  let recommended = false;
  let reasoning = "";

  // 2026 data: Premium Processing + weak case = boilerplate RFE
  if (overallConfidence >= 90 && rfeRisk === "low") {
    recommended = true;
    reasoning = `Case confidence is ${overallConfidence}% with low RFE risk. Premium Processing is appropriate for expedited adjudication.`;
  } else if (overallConfidence >= 70 && rfeRisk === "medium") {
    if (hasUrgentDeadline) {
      recommended = true;
      reasoning = `Despite medium RFE risk, the urgent deadline justifies Premium Processing. Prepare RFE response materials in advance.`;
      risks.push("Medium RFE risk — expect possible RFE even with Premium Processing.");
      risks.push("2026 trend: Premium Processing RFEs are often boilerplate/AI-generated. Prepare rebuttals using USCIS's own policy manual citations.");
    } else {
      recommended = false;
      reasoning = `Case confidence is ${overallConfidence}% with medium RFE risk. Regular Processing recommended — allows more thorough initial review and reduces boilerplate RFE likelihood.`;
      alternatives.push("File Regular Processing with comprehensive evidence package.");
      alternatives.push("If timeline becomes urgent, upgrade to Premium later after strengthening weak areas.");
    }
  } else {
    recommended = false;
    reasoning = `Case confidence is ${overallConfidence}% with ${rfeRisk} RFE risk. STRONGLY AVOID Premium Processing. 2026 data shows Premium triggers poorly-reasoned RFEs for discretionary cases below 90% confidence.`;
    risks.push("High probability of receiving AI-generated boilerplate RFE.");
    risks.push("Premium Processing RFEs have shorter response deadlines.");
    risks.push("Adjudicators under Premium time pressure may miss nuanced evidence.");
    alternatives.push("File Regular Processing and use the extra time to strengthen the petition.");
    alternatives.push("Address all specificity gaps before filing.");
    alternatives.push("Consider consulting with a specialist attorney before submission.");
  }

  return {
    recommended,
    confidenceScore: overallConfidence,
    reasoning,
    risks,
    alternatives,
  };
}

// ─── AI Prompt for Deep RFE Analysis ────────────────────────────────────────

export function buildUSCISMirrorAuditPrompt(petition: {
  visaType: string;
  proposedEndeavor?: string;
  jobDescription: string;
  beneficiaryQualifications: string;
  evidenceSummary: string;
}): string {
  return `You are the USCIS Automated Evidence Classifier (2026 version). Your role is to analyze this ${petition.visaType} petition exactly as the DHS Evidence Classifier would process it.

PETITION DETAILS:
Visa Type: ${petition.visaType}
${petition.proposedEndeavor ? `Proposed Endeavor: ${petition.proposedEndeavor}` : ""}
Job Description: ${petition.jobDescription}
Beneficiary Qualifications: ${petition.beneficiaryQualifications}
Evidence Summary: ${petition.evidenceSummary}

ANALYZE FOR:
1. Evidence Classification: Tag each piece of evidence by ELIS category (SA-PUB, RL-SUP, PAT-IP, AW-REC, EMP-CON, PR-MED, EDU-CRD)
2. Consistency Check: Does the evidence narrative align with the job duties and claimed qualifications?
3. Specificity Score: Rate 1-10 how specific vs. generic the claims are
4. RFE Trigger Points: Identify exact phrases or gaps that would trigger an automated RFE
5. "Adjudicator First View": What would an officer see first when opening this file? Is the strongest evidence front-loaded?
6. O*NET Alignment: Does the job description match SOC code task descriptions?

Return JSON:
{
  "overallReadinessScore": number (0-100),
  "evidenceClassifications": [{ "evidence": "string", "elasTag": "string", "score": number }],
  "consistencyIssues": ["string"],
  "specificityScore": number (1-10),
  "rfeTriggers": [{ "trigger": "string", "severity": "high|medium|low", "fix": "string" }],
  "firstImpressionAssessment": "string",
  "recommendation": "string"
}

Return ONLY valid JSON.`;
}
