'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ClipboardList, ChevronRight, ArrowLeft, Sparkles, Plus,
  Search, GripVertical, Trash2, Copy, Eye, Settings, Star,
  BarChart3, MessageSquare, Hash, CheckSquare, List,
  AlignLeft, ChevronDown, ChevronUp, X, Edit3, Zap,
  PieChart, TrendingUp, Users, Calendar, Download, Share2,
  LayoutGrid, FileText, ThumbsUp, Smile, Frown, Meh
} from 'lucide-react';

type TabType = 'builder' | 'responses' | 'templates' | 'generate';
type QuestionType = 'multiple-choice' | 'rating' | 'nps' | 'open-text' | 'matrix';

interface Question {
  id: string;
  type: QuestionType;
  text: string;
  required: boolean;
  options?: string[];
  rows?: string[];
  columns?: string[];
  scale?: number;
}

interface Survey {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  responses: number;
  createdAt: string;
  status: 'active' | 'draft' | 'closed';
}

interface ResponseData {
  questionId: string;
  answer: string | number;
}

const QUESTION_TYPES: { type: QuestionType; label: string; icon: React.ReactNode; description: string }[] = [
  { type: 'multiple-choice', label: 'Multiple Choice', icon: <CheckSquare className="w-4 h-4" />, description: 'Select one or more options' },
  { type: 'rating', label: 'Star Rating', icon: <Star className="w-4 h-4" />, description: '1-5 star rating scale' },
  { type: 'nps', label: 'NPS Score', icon: <TrendingUp className="w-4 h-4" />, description: '0-10 Net Promoter Score' },
  { type: 'open-text', label: 'Open Text', icon: <AlignLeft className="w-4 h-4" />, description: 'Free-form text response' },
  { type: 'matrix', label: 'Matrix / Grid', icon: <LayoutGrid className="w-4 h-4" />, description: 'Rate multiple items on a scale' },
];

const DEMO_QUESTIONS: Question[] = [
  { id: 'q1', type: 'nps', text: 'How likely are you to recommend Zoobicon to a friend or colleague?', required: true, scale: 10 },
  { id: 'q2', type: 'rating', text: 'How would you rate the quality of generated websites?', required: true, scale: 5 },
  { id: 'q3', type: 'multiple-choice', text: 'Which features do you use most? (Select all that apply)', required: true, options: ['Website Builder', 'Visual Editor', 'Multi-Page Generation', 'E-Commerce', 'API', 'Templates'] },
  { id: 'q4', type: 'multiple-choice', text: 'How often do you use Zoobicon?', required: true, options: ['Daily', 'Several times a week', 'Weekly', 'Monthly', 'Rarely'] },
  { id: 'q5', type: 'matrix', text: 'Rate the following aspects of the platform:', required: false, rows: ['Speed', 'Quality', 'Ease of use', 'Design options', 'Support'], columns: ['Poor', 'Fair', 'Good', 'Excellent'] },
  { id: 'q6', type: 'open-text', text: 'What is one feature you wish Zoobicon had?', required: false },
  { id: 'q7', type: 'rating', text: 'How satisfied are you with the deployment process?', required: true, scale: 5 },
];

const TEMPLATES = [
  { name: 'Customer Satisfaction (CSAT)', description: 'Measure overall customer satisfaction with your product or service.', questions: 8, category: 'Feedback', color: 'text-green-400' },
  { name: 'Net Promoter Score (NPS)', description: 'Gauge customer loyalty and willingness to recommend.', questions: 5, category: 'Loyalty', color: 'text-blue-400' },
  { name: 'Product Feedback', description: 'Collect detailed feedback on specific product features.', questions: 10, category: 'Product', color: 'text-violet-400' },
  { name: 'Website Usability', description: 'Evaluate the user experience of your website.', questions: 12, category: 'UX', color: 'text-cyan-400' },
  { name: 'Employee Engagement', description: 'Measure employee satisfaction and workplace culture.', questions: 15, category: 'HR', color: 'text-amber-400' },
  { name: 'Event Feedback', description: 'Post-event survey for attendee satisfaction.', questions: 7, category: 'Events', color: 'text-pink-400' },
  { name: 'Market Research', description: 'Understand market needs and customer demographics.', questions: 14, category: 'Research', color: 'text-orange-400' },
  { name: 'Onboarding Experience', description: 'Evaluate the new user onboarding process.', questions: 6, category: 'Product', color: 'text-emerald-400' },
];

// Simulated response data for analytics
const RESPONSE_STATS = {
  total: 847,
  completionRate: 78.4,
  avgTime: '3m 42s',
  npsScore: 72,
  npsBreakdown: { promoters: 62, passives: 21, detractors: 17 },
  ratingAvg: 4.3,
  topFeature: 'Website Builder',
  frequencyBreakdown: [
    { label: 'Daily', count: 198, pct: 23.4 },
    { label: 'Several times/week', count: 287, pct: 33.9 },
    { label: 'Weekly', count: 204, pct: 24.1 },
    { label: 'Monthly', count: 112, pct: 13.2 },
    { label: 'Rarely', count: 46, pct: 5.4 },
  ],
  featureUsage: [
    { label: 'Website Builder', count: 724, pct: 85.5 },
    { label: 'Templates', count: 512, pct: 60.4 },
    { label: 'Visual Editor', count: 489, pct: 57.7 },
    { label: 'Multi-Page', count: 334, pct: 39.4 },
    { label: 'E-Commerce', count: 201, pct: 23.7 },
    { label: 'API', count: 156, pct: 18.4 },
  ],
};

function NPSGauge({ score }: { score: number }) {
  const color = score >= 50 ? 'text-green-400' : score >= 0 ? 'text-amber-400' : 'text-red-400';
  return (
    <div className="flex flex-col items-center">
      <div className={`text-5xl font-bold ${color}`}>{score}</div>
      <div className="text-sm text-white/50 mt-1">NPS Score</div>
      <div className="flex gap-4 mt-3 text-xs">
        <span className="text-green-400">{RESPONSE_STATS.npsBreakdown.promoters}% Promoters</span>
        <span className="text-amber-400">{RESPONSE_STATS.npsBreakdown.passives}% Passives</span>
        <span className="text-red-400">{RESPONSE_STATS.npsBreakdown.detractors}% Detractors</span>
      </div>
    </div>
  );
}

function StarRatingDisplay({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <Star key={i} className={`w-5 h-5 ${i < Math.round(value) ? 'text-amber-400 fill-amber-400' : 'text-white/20'}`} />
      ))}
      <span className="ml-2 text-lg font-bold">{value.toFixed(1)}</span>
    </div>
  );
}

export default function SurveysPage() {
  const [activeTab, setActiveTab] = useState<TabType>('builder');
  const [questions, setQuestions] = useState<Question[]>(DEMO_QUESTIONS);
  const [surveyTitle, setSurveyTitle] = useState('Zoobicon User Satisfaction Survey');
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const handleAddQuestion = (type: QuestionType) => {
    const newQ: Question = {
      id: `q${Date.now()}`,
      type,
      text: '',
      required: false,
      ...(type === 'multiple-choice' ? { options: ['Option 1', 'Option 2', 'Option 3'] } : {}),
      ...(type === 'rating' ? { scale: 5 } : {}),
      ...(type === 'nps' ? { scale: 10 } : {}),
      ...(type === 'matrix' ? { rows: ['Item 1', 'Item 2'], columns: ['Poor', 'Good', 'Excellent'] } : {}),
    };
    setQuestions(prev => [...prev, newQ]);
    setShowAddQuestion(false);
  };

  const handleDeleteQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const handleGenerate = () => { setGenerating(true); setTimeout(() => setGenerating(false), 2500); };

  const moveQuestion = (from: number, to: number) => {
    if (to < 0 || to >= questions.length) return;
    const updated = [...questions];
    const [item] = updated.splice(from, 1);
    updated.splice(to, 0, item);
    setQuestions(updated);
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'builder', label: 'Builder', icon: <ClipboardList className="w-4 h-4" /> },
    { id: 'responses', label: 'Responses', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'templates', label: 'Templates', icon: <FileText className="w-4 h-4" /> },
    { id: 'generate', label: 'AI Generate', icon: <Sparkles className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      <header className="border-b border-white/10 bg-[#0a0a12]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="font-bold text-lg bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Zoobicon</span>
            </Link>
            <ChevronRight className="w-4 h-4 text-white/30" />
            <div className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-violet-400" />
              <span className="font-semibold">Survey Builder</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-sm transition-colors"><Share2 className="w-4 h-4" />Share</button>
            <Link href="/dashboard" className="px-4 py-2 text-sm bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors">Dashboard</Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Responses', value: RESPONSE_STATS.total, icon: <Users className="w-5 h-5 text-violet-400" /> },
            { label: 'Completion', value: `${RESPONSE_STATS.completionRate}%`, icon: <CheckSquare className="w-5 h-5 text-green-400" /> },
            { label: 'Avg. Time', value: RESPONSE_STATS.avgTime, icon: <Calendar className="w-5 h-5 text-blue-400" /> },
            { label: 'NPS Score', value: RESPONSE_STATS.npsScore, icon: <TrendingUp className="w-5 h-5 text-amber-400" /> },
          ].map((stat, i) => (
            <div key={i} className="bg-white/5 rounded-xl border border-white/10 p-5 flex items-center gap-4">
              {stat.icon}
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-white/50">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-white/5 rounded-xl p-1 w-fit">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'builder' && (
          <div className="max-w-3xl mx-auto">
            {/* Survey Title */}
            <div className="bg-white/5 rounded-2xl border border-white/10 p-6 mb-4">
              <input type="text" value={surveyTitle} onChange={e => setSurveyTitle(e.target.value)} className="text-xl font-bold bg-transparent border-none outline-none w-full text-white" />
              <input type="text" placeholder="Add a description..." className="text-sm text-white/50 bg-transparent border-none outline-none w-full mt-1" />
            </div>

            {/* Questions */}
            <div className="space-y-3">
              {questions.map((question, i) => {
                const typeCfg = QUESTION_TYPES.find(t => t.type === question.type)!;
                return (
                  <div key={question.id} className="bg-white/5 rounded-2xl border border-white/10 p-6 group">
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col gap-1 mt-1">
                        <button onClick={() => moveQuestion(i, i - 1)} className="p-0.5 hover:bg-white/10 rounded text-white/20 hover:text-white/50 transition-colors"><ChevronUp className="w-3.5 h-3.5" /></button>
                        <GripVertical className="w-4 h-4 text-white/15" />
                        <button onClick={() => moveQuestion(i, i + 1)} className="p-0.5 hover:bg-white/10 rounded text-white/20 hover:text-white/50 transition-colors"><ChevronDown className="w-3.5 h-3.5" /></button>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs font-medium text-white/30">Q{i + 1}</span>
                          <span className="text-xs px-2 py-0.5 bg-violet-500/20 text-violet-300 rounded-full flex items-center gap-1">{typeCfg.icon}{typeCfg.label}</span>
                          {question.required && <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-300 rounded-full">Required</span>}
                        </div>
                        <input type="text" value={question.text} onChange={e => setQuestions(prev => prev.map(q => q.id === question.id ? { ...q, text: e.target.value } : q))} className="w-full text-sm font-medium bg-transparent border-none outline-none" placeholder="Enter your question..." />

                        {question.type === 'multiple-choice' && question.options && (
                          <div className="mt-3 space-y-2">
                            {question.options.map((opt, oi) => (
                              <div key={oi} className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded border border-white/20" />
                                <span className="text-sm text-white/50">{opt}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {question.type === 'rating' && (
                          <div className="mt-3 flex gap-1">
                            {Array.from({ length: question.scale || 5 }).map((_, si) => (
                              <Star key={si} className="w-6 h-6 text-white/20 hover:text-amber-400 cursor-pointer transition-colors" />
                            ))}
                          </div>
                        )}

                        {question.type === 'nps' && (
                          <div className="mt-3 flex gap-1">
                            {Array.from({ length: 11 }).map((_, si) => (
                              <button key={si} className="w-8 h-8 rounded-lg border border-white/10 text-xs text-white/40 hover:bg-violet-600/20 hover:border-violet-500/50 hover:text-violet-300 transition-all">{si}</button>
                            ))}
                          </div>
                        )}

                        {question.type === 'open-text' && (
                          <div className="mt-3">
                            <div className="h-16 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center text-xs text-white/20">Text input area</div>
                          </div>
                        )}

                        {question.type === 'matrix' && question.rows && question.columns && (
                          <div className="mt-3 overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr>
                                  <th className="text-left py-1 text-white/30"></th>
                                  {question.columns.map(col => (
                                    <th key={col} className="text-center py-1 text-white/30 px-3">{col}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {question.rows.map(row => (
                                  <tr key={row} className="border-t border-white/5">
                                    <td className="py-2 text-white/50">{row}</td>
                                    {question.columns!.map(col => (
                                      <td key={col} className="text-center py-2">
                                        <div className="w-4 h-4 rounded-full border border-white/20 mx-auto" />
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"><Copy className="w-3.5 h-3.5 text-white/30" /></button>
                        <button onClick={() => handleDeleteQuestion(question.id)} className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5 text-white/30 hover:text-red-400" /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add Question */}
            {showAddQuestion ? (
              <div className="mt-4 bg-white/5 rounded-2xl border border-violet-500/30 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Add Question Type</span>
                  <button onClick={() => setShowAddQuestion(false)}><X className="w-4 h-4 text-white/40" /></button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {QUESTION_TYPES.map(qt => (
                    <button key={qt.type} onClick={() => handleAddQuestion(qt.type)} className="flex flex-col items-center gap-2 p-3 bg-white/5 hover:bg-violet-600/20 border border-white/10 hover:border-violet-500/50 rounded-xl transition-all text-center">
                      <span className="text-violet-400">{qt.icon}</span>
                      <span className="text-xs font-medium">{qt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <button onClick={() => setShowAddQuestion(true)} className="mt-4 w-full py-4 border-2 border-dashed border-white/20 hover:border-violet-500/50 rounded-2xl text-center text-sm text-white/30 hover:text-violet-400 transition-all flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Add Question
              </button>
            )}
          </div>
        )}

        {activeTab === 'responses' && (
          <div className="space-y-6">
            {/* NPS Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/5 rounded-2xl border border-white/10 p-8 flex flex-col items-center justify-center">
                <NPSGauge score={RESPONSE_STATS.npsScore} />
              </div>
              <div className="bg-white/5 rounded-2xl border border-white/10 p-8 flex flex-col items-center justify-center">
                <p className="text-sm text-white/50 mb-3">Average Quality Rating</p>
                <StarRatingDisplay value={RESPONSE_STATS.ratingAvg} />
                <p className="text-xs text-white/40 mt-2">Based on {RESPONSE_STATS.total} responses</p>
              </div>
            </div>

            {/* Feature Usage */}
            <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
              <h3 className="text-sm font-medium text-white/60 mb-4 uppercase tracking-wider">Feature Usage Distribution</h3>
              <div className="space-y-3">
                {RESPONSE_STATS.featureUsage.map(feature => (
                  <div key={feature.label} className="flex items-center gap-4">
                    <span className="text-sm text-white/70 w-36">{feature.label}</span>
                    <div className="flex-1 h-6 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full transition-all flex items-center justify-end pr-2" style={{ width: `${feature.pct}%` }}>
                        <span className="text-[10px] font-bold">{feature.pct}%</span>
                      </div>
                    </div>
                    <span className="text-xs text-white/30 w-12 text-right">{feature.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Usage Frequency */}
            <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
              <h3 className="text-sm font-medium text-white/60 mb-4 uppercase tracking-wider">Usage Frequency</h3>
              <div className="flex items-end gap-3 h-48">
                {RESPONSE_STATS.frequencyBreakdown.map(item => (
                  <div key={item.label} className="flex-1 flex flex-col items-center">
                    <span className="text-xs font-bold text-white/70 mb-1">{item.pct}%</span>
                    <div className="w-full bg-white/5 rounded-t-lg overflow-hidden flex flex-col-reverse" style={{ height: `${(item.pct / 35) * 100}%` }}>
                      <div className="w-full h-full bg-gradient-to-t from-violet-600 to-violet-400 rounded-t-lg" />
                    </div>
                    <span className="text-[10px] text-white/40 mt-2 text-center leading-tight">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Export */}
            <div className="flex gap-3">
              <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-white/60 hover:text-white transition-all">
                <Download className="w-4 h-4" /> Export CSV
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-white/60 hover:text-white transition-all">
                <Download className="w-4 h-4" /> Export PDF Report
              </button>
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {TEMPLATES.map((template, i) => (
              <div key={i} className="bg-white/5 rounded-2xl border border-white/10 hover:border-violet-500/50 p-6 transition-all group cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full bg-white/10 ${template.color}`}>{template.category}</span>
                  <span className="text-xs text-white/30">{template.questions} questions</span>
                </div>
                <h3 className="font-semibold text-sm mb-2">{template.name}</h3>
                <p className="text-xs text-white/50 leading-relaxed mb-4">{template.description}</p>
                <button className="w-full py-2 bg-white/5 group-hover:bg-violet-600/20 rounded-lg text-xs font-medium text-white/60 group-hover:text-violet-300 transition-all flex items-center justify-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Use Template
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'generate' && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white/5 rounded-2xl border border-white/10 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">AI Survey Generator</h2>
                  <p className="text-sm text-white/50">Describe your goals and we will create a complete survey.</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-white/70 mb-1.5">Survey Title</label>
                  <input type="text" placeholder="e.g., Q1 Customer Satisfaction Survey" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/70 mb-1.5">Survey Type</label>
                    <select className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50">
                      <option>Customer Feedback</option>
                      <option>Product Research</option>
                      <option>Employee Engagement</option>
                      <option>Market Research</option>
                      <option>Event Feedback</option>
                      <option>NPS Survey</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-1.5">Question Count</label>
                    <select className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50">
                      <option>5-7 questions</option>
                      <option>8-12 questions</option>
                      <option>13-20 questions</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1.5">What do you want to learn?</label>
                  <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} rows={4} placeholder="Describe the goals of your survey. What insights are you looking for? Who is your audience?" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 resize-none" />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-2">Question Types to Include</label>
                  <div className="flex flex-wrap gap-2">
                    {QUESTION_TYPES.map(qt => (
                      <button key={qt.type} className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600/20 border border-violet-500/30 rounded-lg text-xs text-violet-300 hover:bg-violet-600/30 transition-colors">
                        {qt.icon} {qt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={handleGenerate} disabled={generating} className="w-full py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-600/25 disabled:opacity-50">
                  {generating ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating Survey...</> : <><Sparkles className="w-4 h-4" /> Generate Survey</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="border-t border-white/10 mt-20 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-white/40 text-sm">
            Replaces Typeform ($25/mo), SurveyMonkey ($25/mo), and Google Forms &mdash; <span className="text-violet-400">included free with Zoobicon Pro</span>
          </p>
          <div className="flex items-center justify-center gap-6 mt-4">
            <Link href="/pricing" className="text-sm text-white/50 hover:text-white transition-colors">Pricing</Link>
            <Link href="/builder" className="text-sm text-white/50 hover:text-white transition-colors">Builder</Link>
            <Link href="/dashboard" className="text-sm text-white/50 hover:text-white transition-colors">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
