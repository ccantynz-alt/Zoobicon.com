'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ClipboardList, Plus, Sparkles, BarChart3, Send, Eye, Trash2, GripVertical, Star, Hash, Type, List, ToggleLeft, AlignLeft, ThumbsUp, ArrowUp, ArrowDown, PieChart, TrendingUp, Users, Clock } from 'lucide-react';

const QUESTION_TYPES = [
  { type: 'multiple_choice', label: 'Multiple Choice', icon: List },
  { type: 'checkbox', label: 'Checkboxes', icon: ToggleLeft },
  { type: 'rating', label: 'Rating (1-5)', icon: Star },
  { type: 'nps', label: 'NPS (0-10)', icon: ThumbsUp },
  { type: 'text', label: 'Short Text', icon: Type },
  { type: 'textarea', label: 'Long Text', icon: AlignLeft },
  { type: 'scale', label: 'Likert Scale', icon: Hash },
];

const TEMPLATES = [
  { id: 'csat', name: 'Customer Satisfaction', questions: 5, responses: 342 },
  { id: 'nps', name: 'NPS Survey', questions: 3, responses: 567 },
  { id: 'product', name: 'Product Feedback', questions: 8, responses: 156 },
  { id: 'employee', name: 'Employee Engagement', questions: 12, responses: 89 },
  { id: 'event', name: 'Event Feedback', questions: 6, responses: 234 },
  { id: 'market', name: 'Market Research', questions: 10, responses: 445 },
  { id: 'course', name: 'Course Evaluation', questions: 7, responses: 178 },
  { id: 'website', name: 'Website Feedback', questions: 5, responses: 312 },
  { id: 'brand', name: 'Brand Perception', questions: 8, responses: 201 },
  { id: 'churn', name: 'Churn Survey', questions: 4, responses: 67 },
  { id: 'onboard', name: 'Onboarding Survey', questions: 6, responses: 145 },
  { id: 'feature', name: 'Feature Prioritization', questions: 5, responses: 389 },
];

interface Question {
  id: string;
  type: string;
  text: string;
  options?: string[];
  required: boolean;
}

const DEMO_QUESTIONS: Question[] = [
  { id: '1', type: 'nps', text: 'How likely are you to recommend Zoobicon to a friend or colleague?', required: true },
  { id: '2', type: 'multiple_choice', text: 'What best describes how you use Zoobicon?', options: ['Personal website', 'Business/company site', 'Client projects (agency)', 'Side projects', 'Learning/experimenting'], required: true },
  { id: '3', type: 'rating', text: 'How would you rate the quality of generated websites?', required: true },
  { id: '4', type: 'checkbox', text: 'Which features do you use most?', options: ['AI Builder', 'Templates', 'Visual Editor', 'Multi-page Generation', 'Full-stack Generation', 'E-commerce', 'SEO Tools'], required: false },
  { id: '5', type: 'textarea', text: 'What one improvement would make Zoobicon significantly better for you?', required: false },
];

export default function SurveysPage() {
  const [tab, setTab] = useState<'create' | 'templates' | 'responses' | 'analytics'>('create');
  const [questions, setQuestions] = useState<Question[]>(DEMO_QUESTIONS);
  const [surveyTitle, setSurveyTitle] = useState('Customer Feedback Survey');
  const [aiPrompt, setAiPrompt] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  const addQuestion = (type: string) => {
    const qt = QUESTION_TYPES.find(q => q.type === type);
    const newQ: Question = {
      id: Date.now().toString(), type, text: `New ${qt?.label || 'Question'}`, required: false,
      options: ['multiple_choice', 'checkbox'].includes(type) ? ['Option 1', 'Option 2', 'Option 3'] : undefined,
    };
    setQuestions([...questions, newQ]);
  };

  const removeQuestion = (id: string) => setQuestions(questions.filter(q => q.id !== id));

  const moveQuestion = (id: string, dir: 'up' | 'down') => {
    const idx = questions.findIndex(q => q.id === id);
    if ((dir === 'up' && idx === 0) || (dir === 'down' && idx === questions.length - 1)) return;
    const nq = [...questions];
    const si = dir === 'up' ? idx - 1 : idx + 1;
    [nq[idx], nq[si]] = [nq[si], nq[idx]];
    setQuestions(nq);
  };

  const renderQuestionPreview = (q: Question) => {
    switch (q.type) {
      case 'nps': return <div className="flex gap-1">{Array.from({length: 11}, (_, i) => <button key={i} className="w-8 h-8 rounded border border-white/20 text-xs hover:bg-violet-500/20 hover:border-violet-500 transition-colors">{i}</button>)}</div>;
      case 'rating': return <div className="flex gap-1">{[1,2,3,4,5].map(n => <Star key={n} className="w-7 h-7 text-white/20 hover:text-yellow-400 cursor-pointer transition-colors" />)}</div>;
      case 'multiple_choice': return <div className="space-y-1.5">{q.options?.map((o, i) => <label key={i} className="flex items-center gap-2 text-sm text-white/60"><input type="radio" name={q.id} className="accent-violet-500" />{o}</label>)}</div>;
      case 'checkbox': return <div className="space-y-1.5">{q.options?.map((o, i) => <label key={i} className="flex items-center gap-2 text-sm text-white/60"><input type="checkbox" className="accent-violet-500" />{o}</label>)}</div>;
      case 'text': return <input className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm" placeholder="Your answer..." readOnly />;
      case 'textarea': return <textarea className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm h-20 resize-none" placeholder="Your answer..." readOnly />;
      case 'scale': return <div className="flex justify-between"><span className="text-xs text-white/40">Strongly Disagree</span><div className="flex gap-2">{[1,2,3,4,5].map(n => <button key={n} className="w-8 h-8 rounded-full border border-white/20 text-xs hover:bg-violet-500/20">{n}</button>)}</div><span className="text-xs text-white/40">Strongly Agree</span></div>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      <header className="border-b border-white/10 bg-[#0a0a12]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Zoobicon</Link>
            <span className="text-white/30">/</span>
            <div className="flex items-center gap-2"><ClipboardList className="w-5 h-5 text-violet-400" /><span className="font-semibold">Surveys</span></div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setPreviewMode(!previewMode)} className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${previewMode ? 'bg-violet-600' : 'bg-white/10 hover:bg-white/20'}`}><Eye className="w-4 h-4" /> Preview</button>
            <button className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm font-medium flex items-center gap-2"><Send className="w-4 h-4" /> Publish</button>
          </div>
        </div>
      </header>

      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 flex gap-6">
          {(['create', 'templates', 'responses', 'analytics'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors capitalize ${tab === t ? 'border-violet-500 text-violet-400' : 'border-transparent text-white/50'}`}>{t}</button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {tab === 'create' && (
          <div className="flex gap-6">
            <div className="w-48 shrink-0">
              <h3 className="text-xs text-white/50 font-medium mb-2">ADD QUESTION</h3>
              <div className="space-y-1">
                {QUESTION_TYPES.map(qt => {
                  const Icon = qt.icon;
                  return <button key={qt.type} onClick={() => addQuestion(qt.type)} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/60 hover:bg-white/10 hover:text-white transition-colors"><Icon className="w-4 h-4 text-violet-400" /> {qt.label}</button>;
                })}
              </div>
            </div>

            <div className="flex-1 max-w-2xl">
              {/* AI Generator */}
              <div className="mb-4 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 rounded-xl p-4">
                <div className="flex gap-3">
                  <input value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="Describe what you want to learn and AI will create the perfect survey..." className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500" />
                  <button className="px-4 py-2 bg-violet-600 rounded-lg text-sm font-medium flex items-center gap-2"><Sparkles className="w-4 h-4" /> Generate</button>
                </div>
              </div>

              <input value={surveyTitle} onChange={e => setSurveyTitle(e.target.value)} className="text-2xl font-bold bg-transparent mb-6 w-full focus:outline-none" />

              <div className="space-y-3">
                {questions.map((q, idx) => (
                  <div key={q.id} className="bg-white/5 border border-white/10 rounded-xl p-5 group">
                    <div className="flex items-start gap-3">
                      <span className="text-sm text-white/30 mt-1">{idx + 1}.</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <input value={q.text} onChange={e => setQuestions(questions.map(qq => qq.id === q.id ? {...qq, text: e.target.value} : qq))} className="flex-1 bg-transparent font-medium focus:outline-none" />
                          {q.required && <span className="text-[10px] px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded">Required</span>}
                          <span className="text-[10px] px-1.5 py-0.5 bg-white/10 text-white/40 rounded">{q.type.replace('_', ' ')}</span>
                        </div>
                        {renderQuestionPreview(q)}
                      </div>
                      <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => moveQuestion(q.id, 'up')} className="p-1 hover:bg-white/10 rounded"><ArrowUp className="w-3 h-3" /></button>
                        <button onClick={() => moveQuestion(q.id, 'down')} className="p-1 hover:bg-white/10 rounded"><ArrowDown className="w-3 h-3" /></button>
                        <button onClick={() => removeQuestion(q.id)} className="p-1 hover:bg-red-500/20 rounded"><Trash2 className="w-3 h-3 text-red-400" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'templates' && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {TEMPLATES.map(t => (
              <div key={t.id} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-violet-500/30 transition-all hover:-translate-y-0.5 cursor-pointer" onClick={() => { setSurveyTitle(t.name); setTab('create'); }}>
                <ClipboardList className="w-8 h-8 text-violet-400 mb-3" />
                <h3 className="font-semibold text-sm mb-1">{t.name}</h3>
                <p className="text-xs text-white/40">{t.questions} questions • {t.responses} responses</p>
              </div>
            ))}
          </div>
        )}

        {tab === 'analytics' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total Responses', value: '821', icon: Users, change: '+15%' },
                { label: 'Completion Rate', value: '76%', icon: TrendingUp, change: '+3%' },
                { label: 'NPS Score', value: '72', icon: ThumbsUp, change: '+8' },
                { label: 'Avg Time', value: '2m 34s', icon: Clock, change: '-12s' },
              ].map((s, i) => {
                const Icon = s.icon;
                return <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5"><div className="flex justify-between mb-2"><span className="text-sm text-white/50">{s.label}</span><Icon className="w-4 h-4 text-white/30" /></div><div className="text-2xl font-bold">{s.value}</div><div className="text-xs text-green-400 mt-1">{s.change}</div></div>;
              })}
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="font-semibold mb-4">NPS Distribution</h3>
              <div className="flex gap-1 h-32 items-end">
                {[3, 2, 1, 2, 4, 8, 12, 15, 22, 18, 13].map((v, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className={`w-full rounded-t transition-all ${i <= 6 ? 'bg-red-500/60' : i <= 8 ? 'bg-yellow-500/60' : 'bg-green-500/60'}`} style={{ height: `${(v / 22) * 100}%` }} />
                    <span className="text-[10px] text-white/30">{i}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-3 text-xs text-white/40">
                <span className="text-red-400">Detractors (0-6)</span>
                <span className="text-yellow-400">Passives (7-8)</span>
                <span className="text-green-400">Promoters (9-10)</span>
              </div>
            </div>
          </div>
        )}

        {tab === 'responses' && (
          <div className="space-y-3">
            {[
              { respondent: 'Anonymous #423', completed: '2 min ago', nps: 9, answers: 5 },
              { respondent: 'sarah@techstart.io', completed: '15 min ago', nps: 10, answers: 5 },
              { respondent: 'Anonymous #422', completed: '1h ago', nps: 7, answers: 4 },
              { respondent: 'mike@growthlabs.co', completed: '2h ago', nps: 8, answers: 5 },
              { respondent: 'Anonymous #421', completed: '3h ago', nps: 6, answers: 3 },
            ].map((r, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between hover:border-violet-500/20 transition-colors cursor-pointer">
                <div><div className="text-sm font-medium">{r.respondent}</div><div className="text-xs text-white/40">{r.completed}</div></div>
                <div className="flex items-center gap-6">
                  <div className="text-center"><div className={`text-sm font-bold ${r.nps >= 9 ? 'text-green-400' : r.nps >= 7 ? 'text-yellow-400' : 'text-red-400'}`}>{r.nps}</div><div className="text-[10px] text-white/40">NPS</div></div>
                  <div className="text-center"><div className="text-sm">{r.answers}/5</div><div className="text-[10px] text-white/40">Answered</div></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <footer className="border-t border-white/10 mt-16 py-8 text-center text-sm text-white/30">
        <p>Zoobicon Surveys — Replace SurveyMonkey ($25/mo), Typeform Surveys. Included in your plan.</p>
      </footer>
    </div>
  );
}
