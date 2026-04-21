'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Plus,
  Trash2,
  GripVertical,
  Eye,
  Code,
  Share2,
  BarChart3,
  Wand2,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Settings,
  Mail,
  Webhook,
  Zap,
  Type,
  Hash,
  Calendar,
  Upload,
  Star,
  ToggleLeft,
  List,
  AlignLeft,
  Image,
  Phone,
  MapPin,
  CreditCard,
  Clock,
  ArrowUp,
  ArrowDown,
  Layout,
  Sparkles,
  Download,
} from 'lucide-react';

const FIELD_TYPES = [
  { type: 'text', label: 'Short Text', icon: Type },
  { type: 'textarea', label: 'Long Text', icon: AlignLeft },
  { type: 'email', label: 'Email', icon: Mail },
  { type: 'phone', label: 'Phone', icon: Phone },
  { type: 'number', label: 'Number', icon: Hash },
  { type: 'date', label: 'Date', icon: Calendar },
  { type: 'time', label: 'Time', icon: Clock },
  { type: 'select', label: 'Dropdown', icon: ChevronDown },
  { type: 'radio', label: 'Radio Buttons', icon: List },
  { type: 'checkbox', label: 'Checkboxes', icon: ToggleLeft },
  { type: 'file', label: 'File Upload', icon: Upload },
  { type: 'rating', label: 'Star Rating', icon: Star },
  { type: 'url', label: 'Website URL', icon: Layout },
  { type: 'address', label: 'Address', icon: MapPin },
  { type: 'payment', label: 'Payment', icon: CreditCard },
  { type: 'image', label: 'Image Choice', icon: Image },
];

const TEMPLATES = [
  { id: 'contact', name: 'Contact Form', category: 'General', fields: 4, desc: 'Name, email, subject, message' },
  { id: 'feedback', name: 'Customer Feedback', category: 'Business', fields: 6, desc: 'Rating, satisfaction, comments' },
  { id: 'survey', name: 'Market Survey', category: 'Research', fields: 10, desc: 'Demographics, preferences, opinions' },
  { id: 'rsvp', name: 'Event RSVP', category: 'Events', fields: 5, desc: 'Name, guests, dietary, notes' },
  { id: 'job', name: 'Job Application', category: 'HR', fields: 8, desc: 'Personal info, experience, resume' },
  { id: 'order', name: 'Order Form', category: 'E-commerce', fields: 7, desc: 'Product, quantity, shipping, payment' },
  { id: 'registration', name: 'Event Registration', category: 'Events', fields: 6, desc: 'Attendee info, sessions, payment' },
  { id: 'quiz', name: 'Quiz / Assessment', category: 'Education', fields: 10, desc: 'Multiple choice questions with scoring' },
  { id: 'appointment', name: 'Appointment Booking', category: 'Services', fields: 5, desc: 'Date, time, service, contact info' },
  { id: 'bug', name: 'Bug Report', category: 'Tech', fields: 6, desc: 'Summary, steps, severity, screenshots' },
  { id: 'newsletter', name: 'Newsletter Signup', category: 'Marketing', fields: 3, desc: 'Email, name, preferences' },
  { id: 'lead', name: 'Lead Generation', category: 'Marketing', fields: 5, desc: 'Company, role, budget, timeline' },
  { id: 'satisfaction', name: 'CSAT Survey', category: 'Research', fields: 5, desc: 'Satisfaction rating with follow-ups' },
  { id: 'nps', name: 'NPS Survey', category: 'Research', fields: 3, desc: 'Net Promoter Score with reasons' },
  { id: 'review', name: 'Product Review', category: 'E-commerce', fields: 5, desc: 'Rating, title, review, photos' },
  { id: 'donation', name: 'Donation Form', category: 'Nonprofit', fields: 5, desc: 'Amount, donor info, recurring' },
  { id: 'intake', name: 'Client Intake', category: 'Services', fields: 8, desc: 'Business info, goals, budget' },
  { id: 'petition', name: 'Petition / Pledge', category: 'General', fields: 4, desc: 'Name, email, signature, comment' },
  { id: 'warranty', name: 'Warranty Claim', category: 'E-commerce', fields: 6, desc: 'Product, purchase date, issue, proof' },
  { id: 'referral', name: 'Referral Form', category: 'Marketing', fields: 4, desc: 'Referrer, referee, relationship' },
];

interface FormField {
  id: string;
  type: string;
  label: string;
  placeholder: string;
  required: boolean;
  options?: string[];
}

const DEMO_FORMS = [
  { id: '1', name: 'Contact Form', submissions: 247, conversionRate: 34.2, status: 'active', createdAt: '2026-03-01' },
  { id: '2', name: 'Event RSVP', submissions: 89, conversionRate: 67.1, status: 'active', createdAt: '2026-03-05' },
  { id: '3', name: 'Job Application', submissions: 156, conversionRate: 22.8, status: 'active', createdAt: '2026-03-10' },
  { id: '4', name: 'Feedback Survey', submissions: 412, conversionRate: 45.6, status: 'paused', createdAt: '2026-02-15' },
  { id: '5', name: 'Newsletter Signup', submissions: 1893, conversionRate: 78.3, status: 'active', createdAt: '2026-01-20' },
];

export default function FormsPage() {
  const [tab, setTab] = useState<'my-forms' | 'create' | 'templates' | 'analytics'>('my-forms');
  const [formName, setFormName] = useState('Untitled Form');
  const [fields, setFields] = useState<FormField[]>([
    { id: '1', type: 'text', label: 'Full Name', placeholder: 'Enter your name', required: true },
    { id: '2', type: 'email', label: 'Email Address', placeholder: 'you@example.com', required: true },
    { id: '3', type: 'textarea', label: 'Message', placeholder: 'How can we help?', required: false },
  ]);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [templateFilter, setTemplateFilter] = useState('All');

  const addField = (type: string) => {
    const fieldType = FIELD_TYPES.find(f => f.type === type);
    const newField: FormField = {
      id: Date.now().toString(),
      type,
      label: fieldType?.label || 'New Field',
      placeholder: `Enter ${fieldType?.label?.toLowerCase() || 'value'}...`,
      required: false,
      options: ['select', 'radio', 'checkbox'].includes(type) ? ['Option 1', 'Option 2', 'Option 3'] : undefined,
    };
    setFields([...fields, newField]);
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
    if (selectedField === id) setSelectedField(null);
  };

  const moveField = (id: string, direction: 'up' | 'down') => {
    const idx = fields.findIndex(f => f.id === id);
    if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === fields.length - 1)) return;
    const newFields = [...fields];
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    [newFields[idx], newFields[swapIdx]] = [newFields[swapIdx], newFields[idx]];
    setFields(newFields);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const generateWithAI = () => {
    if (!aiPrompt.trim()) return;
    setAiGenerating(true);
    setTimeout(() => {
      const generatedFields: FormField[] = [
        { id: Date.now().toString() + '1', type: 'text', label: 'Full Name', placeholder: 'Your full name', required: true },
        { id: Date.now().toString() + '2', type: 'email', label: 'Email', placeholder: 'your@email.com', required: true },
        { id: Date.now().toString() + '3', type: 'phone', label: 'Phone Number', placeholder: '+1 (555) 000-0000', required: false },
        { id: Date.now().toString() + '4', type: 'select', label: 'How did you hear about us?', placeholder: 'Select an option', required: false, options: ['Google Search', 'Social Media', 'Referral', 'Advertisement', 'Other'] },
        { id: Date.now().toString() + '5', type: 'textarea', label: 'Tell us about your project', placeholder: 'Describe what you need...', required: true },
        { id: Date.now().toString() + '6', type: 'rating', label: 'How urgent is your request?', placeholder: '', required: false },
      ];
      setFields(generatedFields);
      setFormName(aiPrompt.slice(0, 40));
      setAiGenerating(false);
      setTab('create');
    }, 1500);
  };

  const embedCode = `<script src="https://zoobicon.com/embed/forms/${formName.toLowerCase().replace(/\s+/g, '-')}.js"></script>\n<div id="zbk-form-${formName.toLowerCase().replace(/\s+/g, '-')}"></div>`;

  const categories = ['All', ...Array.from(new Set(TEMPLATES.map(t => t.category)))];
  const filteredTemplates = templateFilter === 'All' ? TEMPLATES : TEMPLATES.filter(t => t.category === templateFilter);

  const renderFieldPreview = (field: FormField) => {
    switch (field.type) {
      case 'textarea':
        return <textarea className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white/70 h-20 resize-none" placeholder={field.placeholder} readOnly />;
      case 'select':
        return (
          <select className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white/70">
            <option>{field.placeholder}</option>
            {field.options?.map((o, i) => <option key={i}>{o}</option>)}
          </select>
        );
      case 'radio':
        return (
          <div className="space-y-1">
            {field.options?.map((o, i) => (
              <label key={i} className="flex items-center gap-2 text-sm text-white/70">
                <input type="radio" name={field.id} className="accent-stone-500" /> {o}
              </label>
            ))}
          </div>
        );
      case 'checkbox':
        return (
          <div className="space-y-1">
            {field.options?.map((o, i) => (
              <label key={i} className="flex items-center gap-2 text-sm text-white/70">
                <input type="checkbox" className="accent-stone-500" /> {o}
              </label>
            ))}
          </div>
        );
      case 'rating':
        return (
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(n => <Star key={n} className={`w-6 h-6 ${n <= 3 ? 'text-stone-400 fill-stone-400' : 'text-white/20'}`} />)}
          </div>
        );
      case 'file':
        return (
          <div className="border-2 border-dashed border-white/20 rounded-lg p-4 text-center text-sm text-white/50">
            <Upload className="w-6 h-6 mx-auto mb-1" />
            Drop files here or click to upload
          </div>
        );
      default:
        return <input type={field.type === 'email' ? 'email' : field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'time' ? 'time' : 'text'} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white/70" placeholder={field.placeholder} readOnly />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0a0a12]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-stone-400 to-stone-400 bg-clip-text text-transparent">Zoobicon</Link>
            <span className="text-white/30">/</span>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-stone-400" />
              <span className="font-semibold">Forms</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/builder" className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors">Builder</Link>
            <Link href="/dashboard" className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors">Dashboard</Link>
            <Link href="/pricing" className="px-4 py-2 bg-stone-600 hover:bg-stone-500 rounded-lg text-sm font-medium transition-colors">Upgrade</Link>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 flex gap-6">
          {(['my-forms', 'create', 'templates', 'analytics'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-stone-500 text-stone-400' : 'border-transparent text-white/50 hover:text-white/80'}`}>
              {t === 'my-forms' ? 'My Forms' : t === 'create' ? 'Form Builder' : t === 'templates' ? 'Templates' : 'Analytics'}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* My Forms Tab */}
        {tab === 'my-forms' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">My Forms</h2>
              <button onClick={() => setTab('create')} className="flex items-center gap-2 px-4 py-2 bg-stone-600 hover:bg-stone-500 rounded-lg text-sm font-medium transition-colors">
                <Plus className="w-4 h-4" /> New Form
              </button>
            </div>
            <div className="grid gap-4">
              {DEMO_FORMS.map(form => (
                <div key={form.id} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-stone-500/30 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-stone-500/20 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-stone-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{form.name}</h3>
                      <p className="text-sm text-white/50">Created {form.createdAt}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <div className="text-lg font-bold">{form.submissions.toLocaleString()}</div>
                      <div className="text-xs text-white/50">Submissions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-stone-400">{form.conversionRate}%</div>
                      <div className="text-xs text-white/50">Conversion</div>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${form.status === 'active' ? 'bg-stone-500/20 text-stone-400' : 'bg-stone-500/20 text-stone-400'}`}>
                      {form.status}
                    </span>
                    <div className="flex gap-2">
                      <button onClick={() => alert("Form preview")} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><Eye className="w-4 h-4 text-white/50" /></button>
                      <button onClick={() => { navigator.clipboard.writeText('<iframe src="..."></iframe>'); alert("Embed code copied!"); }} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><Code className="w-4 h-4 text-white/50" /></button>
                      <button onClick={() => alert("Analytics dashboard coming soon")} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><BarChart3 className="w-4 h-4 text-white/50" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form Builder Tab */}
        {tab === 'create' && (
          <div>
            {/* AI Generator */}
            <div className="mb-6 bg-gradient-to-r from-stone-500/10 to-stone-500/10 border border-stone-500/20 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-stone-400" />
                <h3 className="font-semibold">AI Form Generator</h3>
              </div>
              <div className="flex gap-3">
                <input
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && generateWithAI()}
                  placeholder="Describe the form you need... (e.g., 'contact form for a dental practice with appointment booking')"
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-sm placeholder:text-white/30 focus:outline-none focus:border-stone-500"
                />
                <button onClick={generateWithAI} disabled={aiGenerating} className="px-5 py-2.5 bg-stone-600 hover:bg-stone-500 disabled:opacity-50 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                  <Wand2 className="w-4 h-4" /> {aiGenerating ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </div>

            <div className="flex gap-6">
              {/* Field Types Sidebar */}
              <div className="w-56 shrink-0">
                <h3 className="text-sm font-medium text-white/50 mb-3">Add Fields</h3>
                <div className="space-y-1">
                  {FIELD_TYPES.map(ft => {
                    const Icon = ft.icon;
                    return (
                      <button key={ft.type} onClick={() => addField(ft.type)} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors">
                        <Icon className="w-4 h-4 text-stone-400" /> {ft.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Form Canvas */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <input
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    className="text-xl font-bold bg-transparent border-b border-transparent hover:border-white/20 focus:border-stone-500 focus:outline-none px-1 py-0.5"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setPreviewMode(!previewMode)} className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 transition-colors ${previewMode ? 'bg-stone-600 text-white' : 'bg-white/10 text-white/60 hover:text-white'}`}>
                      <Eye className="w-3.5 h-3.5" /> Preview
                    </button>
                    <button onClick={() => setShowEmbed(true)} className="px-3 py-1.5 bg-white/10 rounded-lg text-sm text-white/60 hover:text-white flex items-center gap-1.5 transition-colors">
                      <Code className="w-3.5 h-3.5" /> Embed
                    </button>
                    <button onClick={() => {}} className="px-3 py-1.5 bg-white/10 rounded-lg text-sm text-white/60 hover:text-white flex items-center gap-1.5 transition-colors">
                      <Share2 className="w-3.5 h-3.5" /> Share
                    </button>
                  </div>
                </div>

                <div className={`bg-white/5 border border-white/10 rounded-xl p-6 ${previewMode ? 'max-w-lg mx-auto' : ''}`}>
                  {previewMode ? (
                    <div className="space-y-5">
                      <h2 className="text-xl font-bold">{formName}</h2>
                      {fields.map(field => (
                        <div key={field.id}>
                          <label className="block text-sm font-medium mb-1.5">
                            {field.label} {field.required && <span className="text-stone-400">*</span>}
                          </label>
                          {renderFieldPreview(field)}
                        </div>
                      ))}
                      <button onClick={(e: React.MouseEvent) => { e.preventDefault(); alert("Form submitted successfully!"); }} className="w-full py-2.5 bg-stone-600 hover:bg-stone-500 rounded-lg font-medium transition-colors">Submit</button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {fields.map((field) => (
                        <div
                          key={field.id}
                          onClick={() => setSelectedField(field.id)}
                          className={`group flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${selectedField === field.id ? 'border-stone-500 bg-stone-500/5' : 'border-white/10 hover:border-white/20'}`}
                        >
                          <GripVertical className="w-4 h-4 text-white/20 mt-1 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">{field.label}</span>
                              {field.required && <span className="text-[10px] px-1.5 py-0.5 bg-stone-500/20 text-stone-400 rounded">Required</span>}
                              <span className="text-[10px] px-1.5 py-0.5 bg-white/10 text-white/40 rounded">{field.type}</span>
                            </div>
                            {renderFieldPreview(field)}
                          </div>
                          <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={e => { e.stopPropagation(); moveField(field.id, 'up'); }} className="p-1 hover:bg-white/10 rounded"><ArrowUp className="w-3 h-3 text-white/40" /></button>
                            <button onClick={e => { e.stopPropagation(); moveField(field.id, 'down'); }} className="p-1 hover:bg-white/10 rounded"><ArrowDown className="w-3 h-3 text-white/40" /></button>
                            <button onClick={e => { e.stopPropagation(); removeField(field.id); }} className="p-1 hover:bg-stone-500/20 rounded"><Trash2 className="w-3 h-3 text-stone-400" /></button>
                          </div>
                        </div>
                      ))}
                      {fields.length === 0 && (
                        <div className="text-center py-12 text-white/30">
                          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>No fields yet. Add fields from the sidebar or use AI to generate.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Field Properties Panel */}
                {selectedField && !previewMode && (
                  <div className="mt-4 bg-white/5 border border-white/10 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold flex items-center gap-2"><Settings className="w-4 h-4 text-stone-400" /> Field Properties</h3>
                      <button onClick={() => setSelectedField(null)} className="text-white/40 hover:text-white">&times;</button>
                    </div>
                    {(() => {
                      const field = fields.find(f => f.id === selectedField);
                      if (!field) return null;
                      return (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-white/50 mb-1">Label</label>
                            <input value={field.label} onChange={e => updateField(field.id, { label: e.target.value })} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-500" />
                          </div>
                          <div>
                            <label className="block text-xs text-white/50 mb-1">Placeholder</label>
                            <input value={field.placeholder} onChange={e => updateField(field.id, { placeholder: e.target.value })} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-500" />
                          </div>
                          <div className="col-span-2 flex items-center gap-2">
                            <input type="checkbox" checked={field.required} onChange={e => updateField(field.id, { required: e.target.checked })} className="accent-stone-500" />
                            <label className="text-sm text-white/70">Required field</label>
                          </div>
                          {field.options && (
                            <div className="col-span-2">
                              <label className="block text-xs text-white/50 mb-1">Options (one per line)</label>
                              <textarea
                                value={field.options.join('\n')}
                                onChange={e => updateField(field.id, { options: e.target.value.split('\n') })}
                                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm h-20 focus:outline-none focus:border-stone-500"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Templates Tab */}
        {tab === 'templates' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Form Templates</h2>
            <div className="flex gap-2 mb-6 flex-wrap">
              {categories.map(cat => (
                <button key={cat} onClick={() => setTemplateFilter(cat)} className={`px-3 py-1.5 rounded-full text-sm transition-colors ${templateFilter === cat ? 'bg-stone-600 text-white' : 'bg-white/10 text-white/60 hover:text-white'}`}>
                  {cat}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map(template => (
                <div key={template.id} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-stone-500/30 transition-all hover:-translate-y-0.5 cursor-pointer group" onClick={() => { setTab('create'); setFormName(template.name); }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-stone-500/20 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-stone-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold group-hover:text-stone-400 transition-colors">{template.name}</h3>
                      <span className="text-xs text-white/40">{template.category}</span>
                    </div>
                  </div>
                  <p className="text-sm text-white/50 mb-3">{template.desc}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/30">{template.fields} fields</span>
                    <span className="text-xs text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity">Use Template →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {tab === 'analytics' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Form Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total Submissions', value: '2,797', change: '+18.3%', color: 'violet' },
                { label: 'Active Forms', value: '4', change: '+1', color: 'green' },
                { label: 'Avg Conversion', value: '49.4%', change: '+5.2%', color: 'blue' },
                { label: 'This Month', value: '892', change: '+32.1%', color: 'fuchsia' },
              ].map((stat, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5">
                  <div className="text-sm text-white/50 mb-1">{stat.label}</div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs text-stone-400 mt-1">{stat.change}</div>
                </div>
              ))}
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="font-semibold mb-4">Submissions Over Time</h3>
              <div className="h-48 flex items-end gap-2">
                {[45, 62, 38, 71, 56, 89, 67, 93, 78, 85, 102, 94, 88, 110, 95, 120, 108, 115, 98, 125, 118, 132, 128, 140, 135, 142, 138, 148, 145, 152].map((v, i) => (
                  <div key={i} className="flex-1 bg-gradient-to-t from-stone-600 to-stone-400 rounded-t opacity-80 hover:opacity-100 transition-opacity" style={{ height: `${(v / 152) * 100}%` }} />
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-white/30">
                <span>Mar 1</span><span>Mar 15</span><span>Mar 30</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Embed Modal */}
      {showEmbed && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowEmbed(false)}>
          <div className="bg-[#0f2148] border border-white/10 rounded-2xl p-6 max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Embed Your Form</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/50 mb-2">HTML Embed Code</label>
                <div className="relative">
                  <pre className="bg-black/30 border border-white/10 rounded-lg p-3 text-sm text-white/70 overflow-x-auto">{embedCode}</pre>
                  <button
                    onClick={() => { navigator.clipboard.writeText(embedCode); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                    className="absolute top-2 right-2 p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-stone-400" /> : <Copy className="w-4 h-4 text-white/50" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-white/50 mb-2">Direct Link</label>
                <div className="flex gap-2">
                  <input value={`https://zoobicon.sh/f/${formName.toLowerCase().replace(/\s+/g, '-')}`} readOnly className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm" />
                  <button onClick={() => {}} className="px-3 py-2 bg-stone-600 rounded-lg text-sm"><Copy className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => alert("Email integration configured")} className="flex-1 py-2 bg-white/10 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-white/20 transition-colors"><Mail className="w-4 h-4" /> Email</button>
                <button onClick={() => alert("Webhook URL configuration coming soon")} className="flex-1 py-2 bg-white/10 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-white/20 transition-colors"><Webhook className="w-4 h-4" /> Webhook</button>
                <button onClick={() => alert("Zapier integration coming soon")} className="flex-1 py-2 bg-white/10 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-white/20 transition-colors"><Zap className="w-4 h-4" /> Zapier</button>
              </div>
            </div>
            <button onClick={() => setShowEmbed(false)} className="mt-4 w-full py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-colors">Close</button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-white/10 mt-16 py-8 text-center text-sm text-white/30">
        <p>Zoobicon Forms — Replace Typeform, JotForm, Google Forms. Included in your plan.</p>
        <div className="flex justify-center gap-6 mt-3">
          <Link href="/pricing" className="hover:text-white/60 transition-colors">Pricing</Link>
          <Link href="/builder" className="hover:text-white/60 transition-colors">Builder</Link>
          <Link href="/integrations-hub" className="hover:text-white/60 transition-colors">Integrations</Link>
          <Link href="/api-docs" className="hover:text-white/60 transition-colors">API Docs</Link>
        </div>
      </footer>
    </div>
  );
}
