'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Workflow,
  Play,
  Pause,
  ChevronRight,
  ArrowLeft,
  Plus,
  Zap,
  Mail,
  Globe,
  Clock,
  Database,
  Webhook,
  GitBranch,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  Search,
  ArrowDown,
  FileText,
  Users,
  ShoppingCart,
  Bell,
  Filter,
  Sparkles,
  MoreVertical,
  Trash2,
  Copy,
  Eye,
  ToggleLeft,
} from 'lucide-react';

type TabType = 'workflows' | 'canvas' | 'templates' | 'logs';
type NodeType = 'trigger' | 'action' | 'condition';
type WorkflowStatus = 'active' | 'paused' | 'draft' | 'error';

interface WorkflowNode {
  id: string;
  type: NodeType;
  label: string;
  icon: React.ReactNode;
  config: Record<string, string>;
  color: string;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  trigger: string;
  actions: string[];
  executions: number;
  lastRun?: string;
  successRate: number;
}

interface LogEntry {
  id: string;
  workflowName: string;
  status: 'success' | 'failure' | 'running';
  trigger: string;
  duration: string;
  timestamp: string;
  stepsCompleted: number;
  totalSteps: number;
}

const TRIGGER_TYPES = [
  { id: 'form', label: 'Form Submitted', icon: <FileText className="w-4 h-4" />, description: 'When a contact form is submitted on your site' },
  { id: 'deploy', label: 'Site Deployed', icon: <Globe className="w-4 h-4" />, description: 'When a site is deployed to zoobicon.sh' },
  { id: 'schedule', label: 'Schedule (Cron)', icon: <Clock className="w-4 h-4" />, description: 'Run on a recurring schedule' },
  { id: 'webhook', label: 'Webhook Received', icon: <Webhook className="w-4 h-4" />, description: 'When an external webhook is received' },
  { id: 'signup', label: 'New User Signup', icon: <Users className="w-4 h-4" />, description: 'When a new user creates an account' },
  { id: 'purchase', label: 'Purchase Made', icon: <ShoppingCart className="w-4 h-4" />, description: 'When a Stripe payment succeeds' },
];

const ACTION_TYPES = [
  { id: 'email', label: 'Send Email', icon: <Mail className="w-4 h-4" />, description: 'Send an email via Mailgun' },
  { id: 'crm', label: 'Create CRM Contact', icon: <Database className="w-4 h-4" />, description: 'Add or update a CRM contact' },
  { id: 'webhook_send', label: 'Send Webhook', icon: <Webhook className="w-4 h-4" />, description: 'POST data to an external URL' },
  { id: 'notification', label: 'Send Notification', icon: <Bell className="w-4 h-4" />, description: 'Send an in-app notification' },
  { id: 'generate', label: 'Generate Website', icon: <Sparkles className="w-4 h-4" />, description: 'Trigger AI site generation' },
  { id: 'delay', label: 'Wait / Delay', icon: <Clock className="w-4 h-4" />, description: 'Wait for a specified duration' },
];

const DEMO_WORKFLOWS: Workflow[] = [
  { id: 'w1', name: 'New Lead Nurture', description: 'When a form is submitted, create CRM contact, send welcome email, notify team.', status: 'active', trigger: 'Form Submitted', actions: ['Create CRM Contact', 'Send Welcome Email', 'Notify Team'], executions: 1247, lastRun: '2 min ago', successRate: 99.2 },
  { id: 'w2', name: 'Deploy Notification', description: 'Send email and Hash notification when a site is deployed.', status: 'active', trigger: 'Site Deployed', actions: ['Send Email', 'Send Webhook (Hash)'], executions: 892, lastRun: '14 min ago', successRate: 100 },
  { id: 'w3', name: 'Weekly SEO Report', description: 'Every Monday at 9 AM, run SEO analysis and email results.', status: 'active', trigger: 'Schedule (Monday 9 AM)', actions: ['Run SEO Analysis', 'Generate Report', 'Send Email'], executions: 42, lastRun: '3 days ago', successRate: 95.2 },
  { id: 'w4', name: 'Onboarding Sequence', description: 'Welcome new users with a 3-email drip sequence over 7 days.', status: 'paused', trigger: 'New User Signup', actions: ['Send Welcome Email', 'Wait 2 Days', 'Send Tips Email', 'Wait 5 Days', 'Send Upgrade Email'], executions: 3201, lastRun: '1 hour ago', successRate: 97.8 },
  { id: 'w5', name: 'Purchase Follow-Up', description: 'Thank customer, provision service, notify accounting.', status: 'active', trigger: 'Purchase Made', actions: ['Send Receipt', 'Provision Service', 'Create Invoice', 'Notify Accounting'], executions: 156, lastRun: '5 hours ago', successRate: 100 },
  { id: 'w6', name: 'Error Alert Pipeline', description: 'When API errors spike, alert DevOps team via email and PagerDuty.', status: 'draft', trigger: 'Webhook Received', actions: ['Check Error Rate', 'Send PagerDuty Alert', 'Send Email'], executions: 0, successRate: 0 },
];

const DEMO_LOGS: LogEntry[] = [
  { id: 'l1', workflowName: 'New Lead Nurture', status: 'success', trigger: 'Form: Contact Page', duration: '1.2s', timestamp: '2026-03-23 10:42:18', stepsCompleted: 3, totalSteps: 3 },
  { id: 'l2', workflowName: 'Deploy Notification', status: 'success', trigger: 'Deploy: bright-studio-42', duration: '0.8s', timestamp: '2026-03-23 10:28:03', stepsCompleted: 2, totalSteps: 2 },
  { id: 'l3', workflowName: 'New Lead Nurture', status: 'success', trigger: 'Form: Pricing Page', duration: '1.5s', timestamp: '2026-03-23 10:15:44', stepsCompleted: 3, totalSteps: 3 },
  { id: 'l4', workflowName: 'Onboarding Sequence', status: 'running', trigger: 'Signup: alex@startup.io', duration: '—', timestamp: '2026-03-23 09:55:12', stepsCompleted: 2, totalSteps: 5 },
  { id: 'l5', workflowName: 'Weekly SEO Report', status: 'failure', trigger: 'Cron: Monday 9 AM', duration: '45.2s', timestamp: '2026-03-20 09:00:00', stepsCompleted: 1, totalSteps: 3 },
  { id: 'l6', workflowName: 'Purchase Follow-Up', status: 'success', trigger: 'Stripe: $49 Pro Plan', duration: '2.1s', timestamp: '2026-03-22 16:33:21', stepsCompleted: 4, totalSteps: 4 },
  { id: 'l7', workflowName: 'New Lead Nurture', status: 'success', trigger: 'Form: Homepage CTA', duration: '1.1s', timestamp: '2026-03-23 08:12:05', stepsCompleted: 3, totalSteps: 3 },
  { id: 'l8', workflowName: 'Deploy Notification', status: 'success', trigger: 'Deploy: cloud-market-7', duration: '0.6s', timestamp: '2026-03-22 14:22:17', stepsCompleted: 2, totalSteps: 2 },
];

const TEMPLATES = [
  { name: 'Lead Capture to CRM', trigger: 'Form Submitted', actions: 3, description: 'Capture form submissions, create CRM contacts, and send welcome emails.' },
  { name: 'Deploy + Notify', trigger: 'Site Deployed', actions: 2, description: 'Notify your team via email and Hash when a site goes live.' },
  { name: 'Weekly Report', trigger: 'Schedule', actions: 3, description: 'Automated weekly analytics and SEO reports delivered to your inbox.' },
  { name: 'Onboarding Drip', trigger: 'New Signup', actions: 5, description: '7-day email sequence to onboard and convert new signups.' },
  { name: 'Payment Processing', trigger: 'Purchase', actions: 4, description: 'Receipt, provisioning, invoicing, and team notification on purchase.' },
  { name: 'Error Alerting', trigger: 'Webhook', actions: 3, description: 'Monitor for errors and alert your DevOps team instantly.' },
];

export default function AutomationPage() {
  const [activeTab, setActiveTab] = useState<TabType>('workflows');
  const [canvasNodes, setCanvasNodes] = useState<WorkflowNode[]>([
    { id: 'n1', type: 'trigger', label: 'Form Submitted', icon: <FileText className="w-5 h-5" />, config: { form: 'Contact Page' }, color: 'border-green-500/50 bg-green-500/10' },
    { id: 'n2', type: 'action', label: 'Create CRM Contact', icon: <Database className="w-5 h-5" />, config: { fields: 'name, email, phone' }, color: 'border-blue-500/50 bg-blue-500/10' },
    { id: 'n3', type: 'action', label: 'Send Welcome Email', icon: <Mail className="w-5 h-5" />, config: { template: 'welcome-v2' }, color: 'border-violet-500/50 bg-violet-500/10' },
    { id: 'n4', type: 'action', label: 'Notify Team', icon: <Bell className="w-5 h-5" />, config: { channel: '#leads' }, color: 'border-amber-500/50 bg-amber-500/10' },
  ]);

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'workflows', label: 'Workflows', icon: <Workflow className="w-4 h-4" /> },
    { id: 'canvas', label: 'Canvas', icon: <GitBranch className="w-4 h-4" /> },
    { id: 'templates', label: 'Templates', icon: <FileText className="w-4 h-4" /> },
    { id: 'logs', label: 'Execution Log', icon: <Filter className="w-4 h-4" /> },
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
              <Workflow className="w-5 h-5 text-violet-400" />
              <span className="font-semibold">Automation</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/builder" className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors">Builder</Link>
            <Link href="/dashboard" className="px-4 py-2 text-sm bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors">Dashboard</Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Active Workflows', value: DEMO_WORKFLOWS.filter(w => w.status === 'active').length, color: 'text-green-400' },
            { label: 'Total Executions', value: '5.5K', color: 'text-blue-400' },
            { label: 'Success Rate', value: '98.7%', color: 'text-violet-400' },
            { label: 'Time Saved', value: '142 hrs', color: 'text-amber-400' },
          ].map((stat, i) => (
            <div key={i} className="bg-white/5 rounded-xl border border-white/10 p-5">
              <p className="text-sm text-white/50 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex gap-1 bg-white/5 rounded-xl p-1">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
                {tab.icon}{tab.label}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> New Workflow
          </button>
        </div>

        {activeTab === 'workflows' && (
          <div className="space-y-3">
            {DEMO_WORKFLOWS.map(workflow => {
              const statusColors = { active: 'text-green-400 bg-green-500/20', paused: 'text-amber-400 bg-amber-500/20', draft: 'text-white/60 bg-white/10', error: 'text-red-400 bg-red-500/20' };
              const statusIcons = { active: <Play className="w-3 h-3" />, paused: <Pause className="w-3 h-3" />, draft: <FileText className="w-3 h-3" />, error: <AlertCircle className="w-3 h-3" /> };
              return (
                <div key={workflow.id} className="bg-white/5 rounded-2xl border border-white/10 hover:border-white/20 p-6 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center">
                      <Workflow className="w-5 h-5 text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-medium">{workflow.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize flex items-center gap-1 ${statusColors[workflow.status]}`}>{statusIcons[workflow.status]}{workflow.status}</span>
                      </div>
                      <p className="text-xs text-white/40">{workflow.description}</p>
                    </div>
                    <div className="text-right hidden md:block">
                      <p className="text-sm font-medium">{workflow.executions.toLocaleString()} runs</p>
                      <p className="text-xs text-white/40">{workflow.lastRun || 'Never run'}</p>
                    </div>
                    <div className="hidden md:block text-right">
                      <p className={`text-sm font-medium ${workflow.successRate >= 99 ? 'text-green-400' : workflow.successRate >= 95 ? 'text-amber-400' : 'text-red-400'}`}>{workflow.successRate}%</p>
                      <p className="text-xs text-white/40">success</p>
                    </div>
                    <div className="flex gap-1">
                      <button className="p-2 hover:bg-white/10 rounded-lg transition-colors"><Eye className="w-4 h-4 text-white/40" /></button>
                      <button className="p-2 hover:bg-white/10 rounded-lg transition-colors"><MoreVertical className="w-4 h-4 text-white/40" /></button>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs">
                    <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded-lg flex items-center gap-1"><Zap className="w-3 h-3" />{workflow.trigger}</span>
                    <ArrowDown className="w-3 h-3 text-white/20 rotate-[-90deg]" />
                    {workflow.actions.map((action, i) => (
                      <React.Fragment key={i}>
                        <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded-lg">{action}</span>
                        {i < workflow.actions.length - 1 && <ArrowDown className="w-3 h-3 text-white/20 rotate-[-90deg]" />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'canvas' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Node Palette */}
            <div className="space-y-4">
              <div className="bg-white/5 rounded-2xl border border-white/10 p-4">
                <h3 className="text-xs font-medium text-white/60 mb-3 uppercase tracking-wider">Triggers</h3>
                <div className="space-y-2">
                  {TRIGGER_TYPES.map(trigger => (
                    <div key={trigger.id} className="flex items-center gap-3 p-3 bg-white/5 hover:bg-green-500/10 border border-white/5 hover:border-green-500/30 rounded-xl cursor-grab transition-all group">
                      <span className="text-green-400">{trigger.icon}</span>
                      <div>
                        <p className="text-xs font-medium">{trigger.label}</p>
                        <p className="text-[10px] text-white/30">{trigger.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white/5 rounded-2xl border border-white/10 p-4">
                <h3 className="text-xs font-medium text-white/60 mb-3 uppercase tracking-wider">Actions</h3>
                <div className="space-y-2">
                  {ACTION_TYPES.map(action => (
                    <div key={action.id} className="flex items-center gap-3 p-3 bg-white/5 hover:bg-blue-500/10 border border-white/5 hover:border-blue-500/30 rounded-xl cursor-grab transition-all group">
                      <span className="text-blue-400">{action.icon}</span>
                      <div>
                        <p className="text-xs font-medium">{action.label}</p>
                        <p className="text-[10px] text-white/30">{action.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Canvas */}
            <div className="lg:col-span-3 bg-white/5 rounded-2xl border border-white/10 p-8 min-h-[500px]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-medium">Workflow Canvas</h3>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 bg-green-600 hover:bg-green-500 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"><Play className="w-3 h-3" />Test Run</button>
                  <button className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 rounded-lg text-xs font-medium transition-colors">Save</button>
                </div>
              </div>
              <div className="flex flex-col items-center gap-4">
                {canvasNodes.map((node, i) => (
                  <React.Fragment key={node.id}>
                    <div className={`w-full max-w-md border-2 ${node.color} rounded-2xl p-5 transition-all hover:shadow-lg`}>
                      <div className="flex items-center gap-3">
                        <div className="text-white/80">{node.icon}</div>
                        <div className="flex-1">
                          <p className="text-xs text-white/40 uppercase tracking-wider">{node.type}</p>
                          <p className="font-medium text-sm">{node.label}</p>
                        </div>
                        <button className="p-1 hover:bg-white/10 rounded-lg"><Settings className="w-4 h-4 text-white/30" /></button>
                      </div>
                      {Object.entries(node.config).length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/5">
                          {Object.entries(node.config).map(([key, value]) => (
                            <p key={key} className="text-xs text-white/30"><span className="text-white/50">{key}:</span> {value}</p>
                          ))}
                        </div>
                      )}
                    </div>
                    {i < canvasNodes.length - 1 && (
                      <div className="flex flex-col items-center">
                        <div className="w-px h-6 bg-white/20" />
                        <ArrowDown className="w-4 h-4 text-white/30" />
                      </div>
                    )}
                  </React.Fragment>
                ))}
                <button className="w-full max-w-md border-2 border-dashed border-white/20 hover:border-violet-500/50 rounded-2xl p-5 text-center text-sm text-white/30 hover:text-violet-400 transition-all flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" /> Add Step
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TEMPLATES.map((template, i) => (
              <div key={i} className="bg-white/5 rounded-2xl border border-white/10 hover:border-violet-500/50 p-6 transition-all group cursor-pointer">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-white/40">{template.trigger}</span>
                  <span className="text-xs text-white/20 ml-auto">{template.actions} actions</span>
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

        {activeTab === 'logs' && (
          <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-medium text-sm">Execution Log</h3>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-white/60 transition-colors">All</button>
                <button className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-white/60 transition-colors">Failures</button>
              </div>
            </div>
            <div className="divide-y divide-white/5">
              {DEMO_LOGS.map(log => {
                const statusConfig = {
                  success: { icon: <CheckCircle className="w-4 h-4 text-green-400" />, color: 'text-green-400' },
                  failure: { icon: <XCircle className="w-4 h-4 text-red-400" />, color: 'text-red-400' },
                  running: { icon: <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />, color: 'text-blue-400' },
                };
                const cfg = statusConfig[log.status];
                return (
                  <div key={log.id} className="px-6 py-4 flex items-center gap-4 hover:bg-white/5 transition-colors">
                    {cfg.icon}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{log.workflowName}</p>
                      <p className="text-xs text-white/40">{log.trigger}</p>
                    </div>
                    <div className="hidden md:block text-right">
                      <p className="text-xs text-white/50">{log.stepsCompleted}/{log.totalSteps} steps</p>
                      <div className="w-20 h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
                        <div className={`h-full rounded-full ${log.status === 'success' ? 'bg-green-500' : log.status === 'failure' ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${(log.stepsCompleted / log.totalSteps) * 100}%` }} />
                      </div>
                    </div>
                    <span className="text-xs text-white/30 hidden md:block">{log.duration}</span>
                    <span className="text-xs text-white/30">{log.timestamp}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <footer className="border-t border-white/10 mt-20 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-white/40 text-sm">
            Replaces Zapier ($20/mo), Make ($9/mo), and n8n &mdash; <span className="text-violet-400">included free with Zoobicon Pro</span>
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
