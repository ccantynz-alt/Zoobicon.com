'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Download,
  Sparkles,
  Eye,
  Edit3,
  CheckCircle2,
  Briefcase,
  GraduationCap,
  User,
  Mail,
  Phone,
  MapPin,
  Star,
  ChevronRight,
  Wand2,
  Target,
  Award,
  Zap,
  Layout,
  Palette,
  Type,
  Layers,
  Crown,
} from 'lucide-react';

const TEMPLATES = [
  { id: 'modern', name: 'Modern', icon: Layout, desc: 'Clean lines, bold accents', color: 'from-violet-500 to-fuchsia-500' },
  { id: 'classic', name: 'Classic', icon: Type, desc: 'Timeless professional style', color: 'from-blue-500 to-cyan-500' },
  { id: 'creative', name: 'Creative', icon: Palette, desc: 'Stand out from the crowd', color: 'from-pink-500 to-orange-500' },
  { id: 'minimal', name: 'Minimal', icon: Layers, desc: 'Less is more', color: 'from-emerald-500 to-teal-500' },
  { id: 'executive', name: 'Executive', icon: Crown, desc: 'C-suite ready', color: 'from-amber-500 to-yellow-500' },
];

const SECTIONS = [
  { id: 'contact', name: 'Contact Info', icon: Mail },
  { id: 'summary', name: 'Professional Summary', icon: User },
  { id: 'experience', name: 'Work Experience', icon: Briefcase },
  { id: 'education', name: 'Education', icon: GraduationCap },
  { id: 'skills', name: 'Skills', icon: Star },
];

const DEMO_RESUME = {
  name: 'Sarah Chen',
  title: 'Senior Product Manager',
  email: 'sarah.chen@email.com',
  phone: '+1 (555) 234-5678',
  location: 'San Francisco, CA',
  summary: 'Results-driven product manager with 8+ years of experience leading cross-functional teams to deliver innovative SaaS products. Increased user engagement by 340% at TechCorp through data-driven feature development.',
  experience: [
    { company: 'TechCorp', role: 'Senior Product Manager', period: '2021 - Present', highlights: ['Led product strategy for flagship SaaS platform (2M+ users)', 'Increased MRR by $2.4M through pricing optimization', 'Managed cross-functional team of 15 engineers and designers'] },
    { company: 'InnovateLabs', role: 'Product Manager', period: '2018 - 2021', highlights: ['Launched 3 new products generating $5M ARR', 'Reduced churn by 28% through customer feedback loops', 'Built and mentored a team of 4 associate PMs'] },
  ],
  education: [
    { school: 'Stanford University', degree: 'MBA, Technology Management', year: '2018' },
    { school: 'UC Berkeley', degree: 'BS, Computer Science', year: '2015' },
  ],
  skills: ['Product Strategy', 'Agile/Scrum', 'SQL & Analytics', 'User Research', 'A/B Testing', 'Roadmap Planning', 'Stakeholder Management', 'Layers', 'Jira', 'Python'],
};

export default function ResumePage() {
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [activeSection, setActiveSection] = useState('contact');
  const [jobDescription, setJobDescription] = useState('');
  const [generating, setGenerating] = useState(false);
  const [atsScore, setAtsScore] = useState(87);
  const [showPreview, setShowPreview] = useState(true);
  const [resume, setResume] = useState(DEMO_RESUME);
  const [editingField, setEditingField] = useState<string | null>(null);

  const handleGenerate = () => {
    if (!jobDescription.trim()) return;
    setGenerating(true);
    setTimeout(() => {
      setAtsScore(Math.floor(Math.random() * 15) + 85);
      setGenerating(false);
    }, 2500);
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 85) return 'bg-emerald-500';
    if (score >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      <header className="border-b border-white/10 bg-[#0a0a12]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Zoobicon</Link>
            <span className="text-white/30">/</span>
            <span className="font-semibold text-white">AI Resume Builder</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowPreview(!showPreview)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-sm">
              <Eye className="w-4 h-4" /> {showPreview ? 'Hide' : 'Show'} Preview
            </button>
            <button onClick={() => {}} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90 transition text-sm font-medium">
              <Download className="w-4 h-4" /> Export PDF
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* AI Generator */}
        <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 flex items-center justify-center">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">AI Resume Generator</h2>
              <p className="text-sm text-white/50">Paste a job description and let AI craft a tailored resume</p>
            </div>
          </div>
          <div className="flex gap-4">
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here... AI will analyze keywords, required skills, and experience to generate a perfectly tailored resume."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 resize-none h-24 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="self-end px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90 transition font-medium text-sm disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
            >
              {generating ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Generate Resume</>
              )}
            </button>
          </div>
        </div>

        {/* ATS Score */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 text-sm text-white/50 mb-2">
              <Target className="w-4 h-4" /> ATS Score
            </div>
            <div className={`text-3xl font-bold ${getScoreColor(atsScore)}`}>{atsScore}%</div>
            <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
              <div className={`h-full ${getScoreBarColor(atsScore)} rounded-full transition-all duration-1000`} style={{ width: `${atsScore}%` }} />
            </div>
          </div>
          <div className="p-5 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 text-sm text-white/50 mb-2">
              <CheckCircle2 className="w-4 h-4" /> Keywords Matched
            </div>
            <div className="text-3xl font-bold text-white">24/28</div>
            <p className="text-xs text-white/40 mt-1">Industry-specific keywords</p>
          </div>
          <div className="p-5 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 text-sm text-white/50 mb-2">
              <Award className="w-4 h-4" /> Impact Score
            </div>
            <div className="text-3xl font-bold text-violet-400">A+</div>
            <p className="text-xs text-white/40 mt-1">Quantified achievements</p>
          </div>
          <div className="p-5 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 text-sm text-white/50 mb-2">
              <Zap className="w-4 h-4" /> Readability
            </div>
            <div className="text-3xl font-bold text-cyan-400">9.2</div>
            <p className="text-xs text-white/40 mt-1">Optimal for recruiters</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Editor */}
          <div className="space-y-6">
            {/* Template Selector */}
            <div>
              <h3 className="text-sm font-medium text-white/60 mb-3">Choose Template</h3>
              <div className="grid grid-cols-5 gap-3">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t.id)}
                    className={`p-3 rounded-xl border text-center transition ${
                      selectedTemplate === t.id
                        ? 'border-violet-500 bg-violet-500/10'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className={`w-8 h-8 mx-auto mb-2 rounded-lg bg-gradient-to-r ${t.color} flex items-center justify-center`}>
                      <t.icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xs font-medium">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Section Navigation */}
            <div>
              <h3 className="text-sm font-medium text-white/60 mb-3">Sections</h3>
              <div className="space-y-2">
                {SECTIONS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition ${
                      activeSection === s.id
                        ? 'border-violet-500 bg-violet-500/10 text-white'
                        : 'border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <s.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{s.name}</span>
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </button>
                ))}
              </div>
            </div>

            {/* Section Editor */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              {activeSection === 'contact' && (
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2"><Mail className="w-4 h-4 text-violet-400" /> Contact Information</h3>
                  {[
                    { label: 'Full Name', value: resume.name, key: 'name', icon: User },
                    { label: 'Job Title', value: resume.title, key: 'title', icon: Briefcase },
                    { label: 'Email', value: resume.email, key: 'email', icon: Mail },
                    { label: 'Phone', value: resume.phone, key: 'phone', icon: Phone },
                    { label: 'Location', value: resume.location, key: 'location', icon: MapPin },
                  ].map((field) => (
                    <div key={field.key}>
                      <label className="text-xs text-white/40 mb-1 block">{field.label}</label>
                      <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 border border-white/10 focus-within:border-violet-500/50">
                        <field.icon className="w-4 h-4 text-white/30" />
                        <input
                          type="text"
                          value={field.value}
                          onChange={(e) => setResume({ ...resume, [field.key]: e.target.value })}
                          className="flex-1 bg-transparent text-sm focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {activeSection === 'summary' && (
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2"><User className="w-4 h-4 text-violet-400" /> Professional Summary</h3>
                  <textarea
                    value={resume.summary}
                    onChange={(e) => setResume({ ...resume, summary: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm resize-none h-32 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  />
                  <button onClick={() => {}} className="flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300">
                    <Sparkles className="w-4 h-4" /> AI Enhance Summary
                  </button>
                </div>
              )}
              {activeSection === 'experience' && (
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2"><Briefcase className="w-4 h-4 text-violet-400" /> Work Experience</h3>
                  {resume.experience.map((exp, i) => (
                    <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium">{exp.role}</p>
                          <p className="text-sm text-white/50">{exp.company} | {exp.period}</p>
                        </div>
                        <button onClick={() => {}} className="p-1.5 hover:bg-white/10 rounded-lg"><Edit3 className="w-4 h-4 text-white/40" /></button>
                      </div>
                      <ul className="space-y-1">
                        {exp.highlights.map((h, j) => (
                          <li key={j} className="text-sm text-white/60 flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                            {h}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  <button onClick={() => {}} className="w-full py-3 rounded-xl border border-dashed border-white/20 text-sm text-white/40 hover:text-white/60 hover:border-white/30 transition">+ Add Experience</button>
                </div>
              )}
              {activeSection === 'education' && (
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2"><GraduationCap className="w-4 h-4 text-violet-400" /> Education</h3>
                  {resume.education.map((edu, i) => (
                    <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{edu.degree}</p>
                        <p className="text-sm text-white/50">{edu.school} | {edu.year}</p>
                      </div>
                      <button onClick={() => {}} className="p-1.5 hover:bg-white/10 rounded-lg"><Edit3 className="w-4 h-4 text-white/40" /></button>
                    </div>
                  ))}
                  <button onClick={() => {}} className="w-full py-3 rounded-xl border border-dashed border-white/20 text-sm text-white/40 hover:text-white/60 hover:border-white/30 transition">+ Add Education</button>
                </div>
              )}
              {activeSection === 'skills' && (
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2"><Star className="w-4 h-4 text-violet-400" /> Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {resume.skills.map((skill, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-sm text-violet-300">
                        {skill}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input type="text" placeholder="Add a skill..." className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50" />
                    <button onClick={() => {}} className="px-4 py-2 rounded-lg bg-violet-600 text-sm font-medium hover:bg-violet-500 transition">Add</button>
                  </div>
                  <button onClick={() => {}} className="flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300">
                    <Sparkles className="w-4 h-4" /> AI Suggest Skills
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: Preview */}
          {showPreview && (
            <div className="sticky top-24">
              <div className="p-1 rounded-2xl bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20">
                <div className="bg-white rounded-xl p-8 text-black min-h-[700px]">
                  {selectedTemplate === 'modern' && (
                    <div>
                      <div className="border-l-4 border-violet-600 pl-4 mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">{resume.name}</h1>
                        <p className="text-violet-600 font-medium">{resume.title}</p>
                        <div className="flex gap-4 text-xs text-gray-500 mt-1">
                          <span>{resume.email}</span>
                          <span>{resume.phone}</span>
                          <span>{resume.location}</span>
                        </div>
                      </div>
                      <div className="mb-5">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-violet-600 mb-2">Summary</h2>
                        <p className="text-sm text-gray-600 leading-relaxed">{resume.summary}</p>
                      </div>
                      <div className="mb-5">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-violet-600 mb-3">Experience</h2>
                        {resume.experience.map((exp, i) => (
                          <div key={i} className="mb-4">
                            <div className="flex justify-between items-baseline">
                              <p className="font-semibold text-sm text-gray-900">{exp.role}</p>
                              <p className="text-xs text-gray-400">{exp.period}</p>
                            </div>
                            <p className="text-xs text-violet-600 mb-1">{exp.company}</p>
                            <ul className="space-y-0.5">
                              {exp.highlights.map((h, j) => (
                                <li key={j} className="text-xs text-gray-600 pl-3 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-violet-400">{h}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                      <div className="mb-5">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-violet-600 mb-2">Education</h2>
                        {resume.education.map((edu, i) => (
                          <div key={i} className="mb-2">
                            <p className="font-semibold text-sm text-gray-900">{edu.degree}</p>
                            <p className="text-xs text-gray-500">{edu.school} | {edu.year}</p>
                          </div>
                        ))}
                      </div>
                      <div>
                        <h2 className="text-sm font-bold uppercase tracking-wider text-violet-600 mb-2">Skills</h2>
                        <div className="flex flex-wrap gap-1.5">
                          {resume.skills.map((s, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 text-xs">{s}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  {selectedTemplate !== 'modern' && (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                      <div className="text-center">
                        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="font-medium text-gray-500">{TEMPLATES.find(t => t.id === selectedTemplate)?.name} Template</p>
                        <p className="text-xs text-gray-400 mt-1">Preview updates in real-time as you edit</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}