"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  Shield,
  FileText,
  Upload,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Brain,
  Zap,
  Eye,
  Scale,
  Building2,
  Plus,
  ArrowRight,
  FileCheck,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  RefreshCw,
  Info,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

type Tab = "assess" | "niw" | "o1" | "sponsor" | "regulatory" | "evidence";
type Jurisdiction = "US" | "UK" | "AU" | "NZ";

interface AssessmentResult {
  jurisdiction: Jurisdiction;
  visaCategory: string;
  visaCategoryName: string;
  eligible: boolean;
  confidence: number;
  rfeRisk: string;
  reasoningTrail: { step: number; check: string; result: string; explanation: string; legalCitation: string; confidence: number }[];
  flags: { severity: string; category: string; message: string; legalCitation: string; recommendation: string }[];
  wageCompliance: { meetsThreshold: boolean; offeredAmount: number; requiredMinimum: number; currency: string };
  estimatedProcessingDays: number;
  governmentFee: number;
  currency: string;
}

const JURISDICTION_FLAGS: Record<string, string> = {
  US: "\u{1F1FA}\u{1F1F8}",
  UK: "\u{1F1EC}\u{1F1E7}",
  AU: "\u{1F1E6}\u{1F1FA}",
  NZ: "\u{1F1F3}\u{1F1FF}",
};

const JURISDICTION_NAMES: Record<string, string> = {
  US: "United States",
  UK: "United Kingdom",
  AU: "Australia",
  NZ: "New Zealand",
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function ImmigrationDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("assess");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AssessmentResult[] | null>(null);
  const [conflicts, setConflicts] = useState<{ jurisdictions: string[]; conflictType: string; description: string; recommendation: string }[]>([]);
  const [expandedResult, setExpandedResult] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Form state
  const [candidateName, setCandidateName] = useState("");
  const [nationality, setNationality] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [salary, setSalary] = useState("");
  const [currency, setCurrency] = useState<"USD" | "GBP" | "AUD" | "NZD">("USD");
  const [education, setEducation] = useState("");
  const [educationField, setEducationField] = useState("");
  const [selectedJurisdictions, setSelectedJurisdictions] = useState<Jurisdiction[]>(["US", "UK", "AU", "NZ"]);
  const [sponsorName, setSponsorName] = useState("");
  const [sponsorIndustry, setSponsorIndustry] = useState("");
  const [sponsorSize, setSponsorSize] = useState("");
  const [cvText, setCvText] = useState("");

  // NIW state
  const [niwEndeavor, setNiwEndeavor] = useState("");
  const [niwPublications, setNiwPublications] = useState("");
  const [niwCitations, setNiwCitations] = useState("");
  const [niwResult, setNiwResult] = useState<Record<string, unknown> | null>(null);

  // Evidence state
  const [evidenceJurisdiction, setEvidenceJurisdiction] = useState<Jurisdiction>("US");
  const [evidenceLetterType, setEvidenceLetterType] = useState<"support" | "cover">("cover");
  const [evidenceLetter, setEvidenceLetter] = useState("");

  // Regulatory state
  const [regUpdates, setRegUpdates] = useState<{ jurisdiction: string; source: string; date: string; summary: string; impactLevel: string; actionRequired: string }[]>([]);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // ─── Smart Intake ──────────────────────────────────────────────────────────

  const handleSmartIntake = useCallback(async () => {
    if (!cvText.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/immigration/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvText }),
      });
      const data = await res.json();
      if (data.success && data.candidate) {
        const c = data.candidate;
        if (c.fullName) setCandidateName(c.fullName);
        if (c.nationality) setNationality(c.nationality);
        if (c.education?.[0]) {
          setEducation(c.education[0].degree ?? "");
          setEducationField(c.education[0].field ?? "");
        }
        if (c.workExperience?.[0]?.title) setJobTitle(c.workExperience[0].title);
        showToast("CV parsed successfully! Fields populated.", "success");
      }
    } catch {
      showToast("Failed to parse CV", "error");
    } finally {
      setLoading(false);
    }
  }, [cvText, showToast]);

  // ─── Run Assessment ────────────────────────────────────────────────────────

  const handleAssess = useCallback(async () => {
    if (!candidateName || !jobTitle || !salary) {
      showToast("Please fill in candidate name, job title, and salary", "error");
      return;
    }

    setLoading(true);
    setResults(null);
    setConflicts([]);

    try {
      const matter = {
        id: `matter-${Date.now()}`,
        candidate: {
          id: `cand-${Date.now()}`,
          fullName: candidateName,
          dateOfBirth: "1990-01-01",
          nationality,
          email: "",
          currentCountry: nationality,
          education: education
            ? [{ degree: education, field: educationField, institution: "University", country: nationality, graduationYear: 2015, isAccredited: true }]
            : [],
          workExperience: jobTitle
            ? [{ title: jobTitle, company: sponsorName || "Current Employer", country: nationality, startDate: "2018-01-01", isCurrentRole: true, description: jobDescription }]
            : [],
          skills: [],
          languages: [],
          salary: { amount: parseFloat(salary), currency, period: "annual" as const, includesAllowances: false },
        },
        sponsor: {
          id: `sponsor-${Date.now()}`,
          companyName: sponsorName || "Sponsor Company",
          country: selectedJurisdictions[0] === "US" ? "United States" : selectedJurisdictions[0],
          registrationNumber: "",
          industry: sponsorIndustry || "Technology",
          employeeCount: parseInt(sponsorSize) || 50,
          isAccreditedSponsor: true,
        },
        targetJurisdictions: selectedJurisdictions,
        jobTitle,
        jobDescription,
        offeredSalary: { amount: parseFloat(salary), currency, period: "annual" as const, includesAllowances: false },
        startDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        priority: "standard" as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "assessing" as const,
      };

      const res = await fetch("/api/immigration/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matter }),
      });

      const data = await res.json();
      if (data.success) {
        setResults(data.results);
        setConflicts(data.conflicts ?? []);
        showToast(`Assessment complete: ${data.summary.eligibleCount}/${data.summary.jurisdictionsAssessed} jurisdictions eligible`, "success");
      } else {
        showToast(data.error ?? "Assessment failed", "error");
      }
    } catch {
      showToast("Assessment request failed", "error");
    } finally {
      setLoading(false);
    }
  }, [candidateName, jobTitle, salary, nationality, education, educationField, jobDescription, sponsorName, sponsorIndustry, sponsorSize, selectedJurisdictions, currency, showToast]);

  // ─── NIW Analysis ──────────────────────────────────────────────────────────

  const handleNIWAnalysis = useCallback(async () => {
    if (!niwEndeavor.trim()) {
      showToast("Please describe the proposed endeavor", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/immigration/us-visa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "analyze-niw",
          proposedEndeavor: niwEndeavor,
          candidateBackground: {
            publications: parseInt(niwPublications) || 0,
            citations: parseInt(niwCitations) || 0,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNiwResult(data.analysis);
        showToast("NIW Dhanasar analysis complete", "success");
      }
    } catch {
      showToast("NIW analysis failed", "error");
    } finally {
      setLoading(false);
    }
  }, [niwEndeavor, niwPublications, niwCitations, showToast]);

  // ─── Evidence Generator ────────────────────────────────────────────────────

  const handleGenerateEvidence = useCallback(async () => {
    if (!candidateName || !jobTitle) {
      showToast("Fill in candidate & job details first (Assess tab)", "error");
      return;
    }
    setLoading(true);
    try {
      const matter = {
        id: `matter-${Date.now()}`,
        candidate: {
          id: `cand-${Date.now()}`,
          fullName: candidateName,
          dateOfBirth: "1990-01-01",
          nationality,
          email: "",
          currentCountry: nationality,
          education: education
            ? [{ degree: education, field: educationField, institution: "University", country: nationality, graduationYear: 2015, isAccredited: true }]
            : [],
          workExperience: [{ title: jobTitle, company: sponsorName || "Employer", country: nationality, startDate: "2018-01-01", isCurrentRole: true, description: jobDescription }],
          skills: [],
          languages: [],
          salary: { amount: parseFloat(salary) || 0, currency, period: "annual" as const, includesAllowances: false },
        },
        sponsor: {
          id: `sponsor-${Date.now()}`,
          companyName: sponsorName || "Sponsor Company",
          country: "US",
          registrationNumber: "",
          industry: sponsorIndustry || "Technology",
          employeeCount: parseInt(sponsorSize) || 50,
          isAccreditedSponsor: true,
        },
        targetJurisdictions: [evidenceJurisdiction],
        jobTitle,
        jobDescription,
        offeredSalary: { amount: parseFloat(salary) || 0, currency, period: "annual" as const, includesAllowances: false },
        startDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        priority: "standard" as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "filing" as const,
      };

      const res = await fetch("/api/immigration/evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matter, jurisdiction: evidenceJurisdiction, letterType: evidenceLetterType }),
      });
      const data = await res.json();
      if (data.success) {
        setEvidenceLetter(data.letter.content);
        showToast(`${evidenceLetterType === "cover" ? "Cover" : "Support"} letter generated (${data.letter.wordCount} words)`, "success");
      }
    } catch {
      showToast("Evidence generation failed", "error");
    } finally {
      setLoading(false);
    }
  }, [candidateName, nationality, jobTitle, jobDescription, salary, currency, education, educationField, sponsorName, sponsorIndustry, sponsorSize, evidenceJurisdiction, evidenceLetterType, showToast]);

  // ─── Regulatory Updates ────────────────────────────────────────────────────

  const handleFetchRegulatory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/immigration/regulatory");
      const data = await res.json();
      if (data.success) {
        setRegUpdates(data.updates);
        showToast(`${data.total} regulatory updates loaded (${data.critical} critical)`, "success");
      }
    } catch {
      showToast("Failed to fetch regulatory updates", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const toggleJurisdiction = (j: Jurisdiction) => {
    setSelectedJurisdictions((prev: Jurisdiction[]) =>
      prev.includes(j) ? prev.filter((x: Jurisdiction) => x !== j) : [...prev, j]
    );
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  const tabs: { key: Tab; label: string; icon: typeof Globe }[] = [
    { key: "assess", label: "Assess", icon: Globe },
    { key: "niw", label: "EB-2 NIW", icon: Brain },
    { key: "o1", label: "O-1", icon: Zap },
    { key: "sponsor", label: "Sponsor", icon: Building2 },
    { key: "regulatory", label: "Live Law", icon: Scale },
    { key: "evidence", label: "Evidence", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/immigration" className="flex items-center gap-2">
            <Globe className="w-6 h-6 text-blue-400" />
            <span className="text-lg font-bold">Immigration <span className="text-blue-400">Engine</span></span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              All Systems Online
            </div>
            <Link href="/" className="text-sm text-gray-400 hover:text-white transition">Back to Zoobicon</Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Tab Navigation */}
        <div className="flex gap-1 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                activeTab === tab.key
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ═══ ASSESS TAB ═══ */}
        {activeTab === "assess" && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left: Form */}
            <div className="space-y-6">
              <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-400" />
                  Cross-Border Assessment
                </h2>

                {/* Smart Intake */}
                <div className="mb-6 p-4 rounded-lg bg-blue-500/5 border border-blue-500/10">
                  <label className="block text-sm font-medium text-blue-400 mb-2">
                    <Upload className="w-4 h-4 inline mr-1" />
                    Smart Intake — Paste CV or LinkedIn Profile
                  </label>
                  <textarea
                    value={cvText}
                    onChange={(e) => setCvText(e.target.value)}
                    placeholder="Paste CV or LinkedIn profile text here. AI will auto-populate fields..."
                    className="w-full h-24 bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none resize-none"
                  />
                  <button
                    onClick={handleSmartIntake}
                    disabled={loading || !cvText.trim()}
                    className="mt-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-sm font-medium transition"
                  >
                    Parse CV
                  </button>
                </div>

                {/* Jurisdictions */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Target Jurisdictions</label>
                  <div className="flex gap-2 flex-wrap">
                    {(["US", "UK", "AU", "NZ"] as Jurisdiction[]).map((j) => (
                      <button
                        key={j}
                        onClick={() => toggleJurisdiction(j)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition ${
                          selectedJurisdictions.includes(j)
                            ? "bg-blue-600 text-white"
                            : "bg-white/5 text-gray-400 hover:text-white"
                        }`}
                      >
                        {JURISDICTION_FLAGS[j]} {JURISDICTION_NAMES[j]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Candidate fields */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Candidate Name *</label>
                    <input value={candidateName} onChange={(e) => setCandidateName(e.target.value)} className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" placeholder="Full name" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Nationality</label>
                    <input value={nationality} onChange={(e) => setNationality(e.target.value)} className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" placeholder="Country" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Job Title *</label>
                    <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" placeholder="e.g. Software Engineer" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Education Level</label>
                    <select value={education} onChange={(e) => setEducation(e.target.value)} className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none">
                      <option value="">Select...</option>
                      <option value="High School">High School</option>
                      <option value="Associate">Associate Degree</option>
                      <option value="Bachelor">Bachelor&apos;s Degree</option>
                      <option value="Master">Master&apos;s Degree</option>
                      <option value="Doctorate">Doctorate / PhD</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Field of Study</label>
                    <input value={educationField} onChange={(e) => setEducationField(e.target.value)} className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" placeholder="e.g. Computer Science" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Salary * &amp; Currency</label>
                    <div className="flex gap-2">
                      <input value={salary} onChange={(e) => setSalary(e.target.value)} type="number" className="flex-1 bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" placeholder="Annual" />
                      <select value={currency} onChange={(e) => setCurrency(e.target.value as typeof currency)} className="bg-[#0a0a0f] border border-white/10 rounded-lg px-2 py-2 text-sm text-white focus:border-blue-500 focus:outline-none">
                        <option value="USD">USD</option>
                        <option value="GBP">GBP</option>
                        <option value="AUD">AUD</option>
                        <option value="NZD">NZD</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-400 mb-1">Job Description</label>
                  <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} className="w-full h-20 bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none resize-none" placeholder="Describe the role duties, requirements, and why it needs this specific candidate..." />
                </div>

                {/* Sponsor */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Sponsor Company</label>
                    <input value={sponsorName} onChange={(e) => setSponsorName(e.target.value)} className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" placeholder="Company name" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Industry</label>
                    <input value={sponsorIndustry} onChange={(e) => setSponsorIndustry(e.target.value)} className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" placeholder="e.g. Technology" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Employees</label>
                    <input value={sponsorSize} onChange={(e) => setSponsorSize(e.target.value)} type="number" className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" placeholder="Count" />
                  </div>
                </div>

                <button
                  onClick={handleAssess}
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 rounded-xl text-lg font-semibold transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><RefreshCw className="w-5 h-5 animate-spin" /> Assessing...</>
                  ) : (
                    <><Globe className="w-5 h-5" /> Run Cross-Border Assessment</>
                  )}
                </button>
              </div>
            </div>

            {/* Right: Results */}
            <div className="space-y-4">
              {!results && !loading && (
                <div className="p-12 rounded-xl border border-white/5 bg-white/[0.02] text-center">
                  <Globe className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-400 mb-2">No Assessment Yet</h3>
                  <p className="text-sm text-gray-600">Fill in candidate details and run a cross-border assessment to see results across all target jurisdictions.</p>
                </div>
              )}

              {loading && !results && (
                <div className="p-12 rounded-xl border border-blue-500/20 bg-blue-500/5 text-center">
                  <RefreshCw className="w-12 h-12 text-blue-400 mx-auto mb-4 animate-spin" />
                  <h3 className="text-lg font-medium text-blue-400 mb-2">Running Cross-Border Ghost...</h3>
                  <p className="text-sm text-gray-400">Assessing {selectedJurisdictions.length} jurisdictions concurrently</p>
                </div>
              )}

              {results && (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-lg border border-white/10 bg-white/[0.02]">
                      <div className="text-2xl font-bold text-white">{results.filter((r) => r.eligible).length}/{results.length}</div>
                      <div className="text-xs text-gray-400">Jurisdictions Eligible</div>
                    </div>
                    <div className="p-4 rounded-lg border border-white/10 bg-white/[0.02]">
                      <div className="text-2xl font-bold text-white">{conflicts.length}</div>
                      <div className="text-xs text-gray-400">Conflicts of Law</div>
                    </div>
                  </div>

                  {/* Conflict warnings */}
                  {conflicts.length > 0 && (
                    <div className="p-4 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
                      <h3 className="text-sm font-semibold text-yellow-400 flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4" />
                        Conflicts of Law Detected
                      </h3>
                      {conflicts.map((c, i) => (
                        <div key={i} className="text-sm text-gray-300 mb-2">
                          <span className="font-medium">{c.conflictType}:</span> {c.description}
                          <div className="text-xs text-gray-500 mt-1">{c.recommendation}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Per-jurisdiction results */}
                  {results.map((result, idx) => (
                    <div key={idx} className={`rounded-xl border ${result.eligible ? "border-emerald-500/20" : "border-red-500/20"} bg-white/[0.02] overflow-hidden`}>
                      <button
                        onClick={() => setExpandedResult(expandedResult === idx ? null : idx)}
                        className="w-full p-4 flex items-center justify-between hover:bg-white/[0.02] transition"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{JURISDICTION_FLAGS[result.jurisdiction]}</span>
                          <div className="text-left">
                            <div className="font-semibold">{JURISDICTION_NAMES[result.jurisdiction]}</div>
                            <div className="text-sm text-gray-400">{result.visaCategoryName} ({result.visaCategory})</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className={`flex items-center gap-1 text-sm font-medium ${result.eligible ? "text-emerald-400" : "text-red-400"}`}>
                              {result.eligible ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                              {result.eligible ? "Eligible" : "Not Eligible"}
                            </div>
                            <div className="text-xs text-gray-500">{result.confidence}% confidence</div>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            result.rfeRisk === "low" ? "bg-emerald-500/10 text-emerald-400"
                            : result.rfeRisk === "medium" ? "bg-yellow-500/10 text-yellow-400"
                            : "bg-red-500/10 text-red-400"
                          }`}>
                            {result.rfeRisk.toUpperCase()} RFE Risk
                          </span>
                          {expandedResult === idx ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                        </div>
                      </button>

                      <AnimatePresence>
                        {expandedResult === idx && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 border-t border-white/5 pt-4">
                              {/* Quick stats */}
                              <div className="grid grid-cols-3 gap-3 mb-4">
                                <div className="p-3 rounded-lg bg-white/[0.03]">
                                  <div className="text-xs text-gray-500">Processing</div>
                                  <div className="text-sm font-medium">~{result.estimatedProcessingDays} days</div>
                                </div>
                                <div className="p-3 rounded-lg bg-white/[0.03]">
                                  <div className="text-xs text-gray-500">Gov Fee</div>
                                  <div className="text-sm font-medium">{result.currency} {result.governmentFee.toLocaleString()}</div>
                                </div>
                                <div className="p-3 rounded-lg bg-white/[0.03]">
                                  <div className="text-xs text-gray-500">Wage</div>
                                  <div className={`text-sm font-medium ${result.wageCompliance.meetsThreshold ? "text-emerald-400" : "text-red-400"}`}>
                                    {result.wageCompliance.meetsThreshold ? "Compliant" : "Below Threshold"}
                                  </div>
                                </div>
                              </div>

                              {/* Reasoning Trail */}
                              <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-1">
                                <Eye className="w-4 h-4 text-blue-400" />
                                Reasoning Trail
                              </h4>
                              <div className="space-y-2 mb-4">
                                {result.reasoningTrail.map((step) => (
                                  <div key={step.step} className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                                        step.result === "pass" ? "bg-emerald-500/20 text-emerald-400"
                                        : step.result === "fail" ? "bg-red-500/20 text-red-400"
                                        : step.result === "warning" ? "bg-yellow-500/20 text-yellow-400"
                                        : "bg-blue-500/20 text-blue-400"
                                      }`}>
                                        {step.result.toUpperCase()}
                                      </span>
                                      <span className="text-sm font-medium text-white">{step.check}</span>
                                      <span className="text-xs text-gray-600 ml-auto">{step.confidence}%</span>
                                    </div>
                                    <p className="text-xs text-gray-400">{step.explanation}</p>
                                    {step.legalCitation && (
                                      <p className="text-xs text-blue-400/60 mt-1 font-mono">{step.legalCitation}</p>
                                    )}
                                  </div>
                                ))}
                              </div>

                              {/* Compliance Flags */}
                              {result.flags.length > 0 && (
                                <>
                                  <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-1">
                                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                                    Compliance Flags ({result.flags.length})
                                  </h4>
                                  <div className="space-y-2">
                                    {result.flags.map((flag, fi) => (
                                      <div key={fi} className={`p-3 rounded-lg border ${
                                        flag.severity === "critical" ? "border-red-500/20 bg-red-500/5"
                                        : flag.severity === "warning" ? "border-yellow-500/20 bg-yellow-500/5"
                                        : "border-blue-500/20 bg-blue-500/5"
                                      }`}>
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className={`text-xs font-bold ${
                                            flag.severity === "critical" ? "text-red-400" : flag.severity === "warning" ? "text-yellow-400" : "text-blue-400"
                                          }`}>
                                            {flag.severity.toUpperCase()}
                                          </span>
                                          <span className="text-xs text-gray-500">{flag.category}</span>
                                        </div>
                                        <p className="text-sm text-gray-300">{flag.message}</p>
                                        <p className="text-xs text-gray-500 mt-1">{flag.recommendation}</p>
                                      </div>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}

        {/* ═══ NIW TAB ═══ */}
        {activeTab === "niw" && (
          <div className="max-w-3xl mx-auto">
            <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
              <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-400" />
                EB-2 NIW Dhanasar Analysis
              </h2>
              <p className="text-sm text-gray-400 mb-6">Analyze your National Interest Waiver petition against the 2026 three-prong framework with NIST AI RMF alignment checking.</p>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Proposed Endeavor *</label>
                  <textarea value={niwEndeavor} onChange={(e) => setNiwEndeavor(e.target.value)} className="w-full h-32 bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none resize-none" placeholder="Describe the proposed endeavor in detail. Include: specific field, quantifiable impact, national significance, why PERM would be harmful..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Publications</label>
                    <input value={niwPublications} onChange={(e) => setNiwPublications(e.target.value)} type="number" className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Citations</label>
                    <input value={niwCitations} onChange={(e) => setNiwCitations(e.target.value)} type="number" className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none" placeholder="0" />
                  </div>
                </div>
              </div>

              <button onClick={handleNIWAnalysis} disabled={loading} className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-50 rounded-xl font-semibold transition-all flex items-center justify-center gap-2">
                {loading ? <><RefreshCw className="w-5 h-5 animate-spin" /> Analyzing...</> : <><Brain className="w-5 h-5" /> Run Dhanasar Analysis</>}
              </button>

              {niwResult && (
                <div className="mt-6 space-y-4">
                  {/* Overall Score */}
                  <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Overall NIW Score</span>
                      <span className="text-2xl font-bold">{(niwResult as { overallScore?: number }).overallScore ?? 0}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/10">
                      <div className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all" style={{ width: `${(niwResult as { overallScore?: number }).overallScore ?? 0}%` }} />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                      <span>RFE Risk: {(niwResult as { rfeRisk?: string }).rfeRisk?.toUpperCase()}</span>
                      <span>Premium: {(niwResult as { premiumProcessingAdvice?: string }).premiumProcessingAdvice?.toUpperCase()}</span>
                    </div>
                  </div>

                  {/* Prongs */}
                  {["prong1", "prong2", "prong3"].map((key) => {
                    const prong = (niwResult as Record<string, { prongName?: string; score?: number; passed?: boolean; reasoning?: string; autoFailTriggers?: string[]; fixes?: string[] }>)[key];
                    if (!prong) return null;
                    return (
                      <div key={key} className={`p-4 rounded-lg border ${prong.passed ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5"}`}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold">{prong.prongName}</h4>
                          <span className={`text-sm font-bold ${prong.passed ? "text-emerald-400" : "text-red-400"}`}>{prong.score}%</span>
                        </div>
                        <p className="text-xs text-gray-400 mb-2">{prong.reasoning}</p>
                        {prong.autoFailTriggers && prong.autoFailTriggers.length > 0 && (
                          <div className="mt-2">
                            <span className="text-xs font-semibold text-red-400">Auto-Fail Triggers:</span>
                            {prong.autoFailTriggers.map((t: string, i: number) => (
                              <p key={i} className="text-xs text-red-300 ml-2">- {t}</p>
                            ))}
                          </div>
                        )}
                        {prong.fixes && prong.fixes.length > 0 && (
                          <div className="mt-2">
                            <span className="text-xs font-semibold text-blue-400">Fixes:</span>
                            {prong.fixes.map((f: string, i: number) => (
                              <p key={i} className="text-xs text-blue-300 ml-2">- {f}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ O-1 TAB ═══ */}
        {activeTab === "o1" && (
          <div className="max-w-3xl mx-auto">
            <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
              <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                O-1A Extraordinary Ability Analysis
              </h2>
              <p className="text-sm text-gray-400 mb-6">Analyze evidence against the 10 O-1 criteria with adjudicator fatigue detection and alternative framing suggestions.</p>
              <div className="p-8 text-center text-gray-500">
                <Zap className="w-10 h-10 mx-auto mb-3 text-gray-600" />
                <p className="text-sm">O-1 analysis requires detailed evidence uploads for each criterion.</p>
                <p className="text-xs text-gray-600 mt-2">Use the API endpoint POST /api/immigration/us-visa with action &quot;analyze-o1&quot; for programmatic access.</p>
                <Link href="/immigration" className="inline-block mt-4 text-sm text-blue-400 hover:text-blue-300">Learn more about O-1 analysis</Link>
              </div>
            </div>
          </div>
        )}

        {/* ═══ SPONSOR TAB ═══ */}
        {activeTab === "sponsor" && (
          <div className="max-w-3xl mx-auto">
            <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
              <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-cyan-400" />
                Sponsor Compliance Monitor
              </h2>
              <p className="text-sm text-gray-400 mb-6">
                UK per-pay-period salary auditing, AU STP-to-nomination matching, eVisa share code vault, and predictive compliance warnings.
              </p>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5">
                  <h3 className="text-sm font-semibold text-cyan-400 mb-2 flex items-center gap-1">
                    {JURISDICTION_FLAGS.UK} UK Payroll Sentinel
                  </h3>
                  <p className="text-xs text-gray-400 mb-3">Per-pay-period salary compliance. No averaging allowed from April 7, 2026.</p>
                  <ul className="text-xs text-gray-500 space-y-1">
                    <li>Min annual: &pound;41,700</li>
                    <li>Min hourly: &pound;17.13/hr</li>
                    <li>Max weekly hours: 48</li>
                    <li>Breach notification: 10 business days</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
                  <h3 className="text-sm font-semibold text-yellow-400 mb-2 flex items-center gap-1">
                    {JURISDICTION_FLAGS.AU} AU STP Bridge
                  </h3>
                  <p className="text-xs text-gray-400 mb-3">Single Touch Payroll to nomination matching. Zero tolerance for discrepancies.</p>
                  <ul className="text-xs text-gray-500 space-y-1">
                    <li>Core Skills TSMIT: AUD $70,000 (Jul 2026: $79,499)</li>
                    <li>Specialist: AUD $135,000 (Jul 2026: $146,717)</li>
                    <li>Sponsor mobility: 180 days</li>
                    <li>Notification deadline: 28 days</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-white/10 bg-white/[0.02]">
                <p className="text-sm text-gray-400 text-center">
                  Upload payroll CSVs via the API endpoint <code className="text-xs bg-white/5 px-1.5 py-0.5 rounded">POST /api/immigration/sponsor</code> for automated auditing.
                  Supports actions: <code className="text-xs bg-white/5 px-1.5 py-0.5 rounded">audit-payroll</code>, <code className="text-xs bg-white/5 px-1.5 py-0.5 rounded">sponsor-health</code>, <code className="text-xs bg-white/5 px-1.5 py-0.5 rounded">evisa-check</code>, <code className="text-xs bg-white/5 px-1.5 py-0.5 rounded">batch-rtw</code>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ═══ REGULATORY TAB ═══ */}
        {activeTab === "regulatory" && (
          <div className="max-w-4xl mx-auto">
            <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Scale className="w-5 h-5 text-emerald-400" />
                    Live Regulatory Updates
                  </h2>
                  <p className="text-sm text-gray-400">2026 immigration law changes across all 4 jurisdictions</p>
                </div>
                <button onClick={handleFetchRegulatory} disabled={loading} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg text-sm font-medium transition flex items-center gap-2">
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Sync Now
                </button>
              </div>

              {regUpdates.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Scale className="w-10 h-10 mx-auto mb-3 text-gray-600" />
                  <p className="text-sm">Click &quot;Sync Now&quot; to fetch the latest regulatory updates.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {regUpdates.map((update, i) => (
                    <div key={i} className={`p-4 rounded-lg border ${
                      update.impactLevel === "critical" ? "border-red-500/20 bg-red-500/5"
                      : update.impactLevel === "significant" ? "border-yellow-500/20 bg-yellow-500/5"
                      : "border-white/10 bg-white/[0.02]"
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{JURISDICTION_FLAGS[update.jurisdiction]}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          update.impactLevel === "critical" ? "bg-red-500/20 text-red-400"
                          : update.impactLevel === "significant" ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-gray-500/20 text-gray-400"
                        }`}>
                          {update.impactLevel.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">{update.source}</span>
                        <span className="text-xs text-gray-600 ml-auto">{update.date}</span>
                      </div>
                      <p className="text-sm text-gray-300 mb-2">{update.summary}</p>
                      <div className="p-2 rounded bg-white/[0.03] text-xs text-gray-400">
                        <span className="font-semibold text-white">Action Required:</span> {update.actionRequired}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ EVIDENCE TAB ═══ */}
        {activeTab === "evidence" && (
          <div className="max-w-3xl mx-auto">
            <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
              <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-400" />
                Evidence Letter Generator
              </h2>
              <p className="text-sm text-gray-400 mb-6">AI-drafted jurisdiction-specific legal letters with precise 2026 citations.</p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Jurisdiction</label>
                  <select value={evidenceJurisdiction} onChange={(e) => setEvidenceJurisdiction(e.target.value as Jurisdiction)} className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none">
                    <option value="US">{JURISDICTION_FLAGS.US} United States</option>
                    <option value="UK">{JURISDICTION_FLAGS.UK} United Kingdom</option>
                    <option value="AU">{JURISDICTION_FLAGS.AU} Australia</option>
                    <option value="NZ">{JURISDICTION_FLAGS.NZ} New Zealand</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Letter Type</label>
                  <select value={evidenceLetterType} onChange={(e) => setEvidenceLetterType(e.target.value as "support" | "cover")} className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none">
                    <option value="cover">Submission Cover Letter</option>
                    <option value="support">Letter of Support</option>
                  </select>
                </div>
              </div>

              <button onClick={handleGenerateEvidence} disabled={loading} className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 rounded-xl font-semibold transition-all flex items-center justify-center gap-2">
                {loading ? <><RefreshCw className="w-5 h-5 animate-spin" /> Generating...</> : <><FileText className="w-5 h-5" /> Generate Letter</>}
              </button>

              {evidenceLetter && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-300">Generated Letter</h3>
                    <div className="flex gap-2">
                      <button onClick={() => { navigator.clipboard.writeText(evidenceLetter); showToast("Copied!", "success"); }} className="p-1.5 rounded hover:bg-white/5 text-gray-400 hover:text-white transition">
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <pre className="p-4 rounded-lg bg-[#0a0a0f] border border-white/10 text-sm text-gray-300 whitespace-pre-wrap font-sans max-h-96 overflow-y-auto">
                    {evidenceLetter}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm ${
              toast.type === "success" ? "bg-emerald-600" : "bg-red-600"
            }`}
          >
            {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
