// Craig's Master To-Do List — Auto-sent daily via email
// This file is the single source of truth for all outstanding work

export interface TodoItem {
  id: string;
  category: string;
  task: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'not-started' | 'in-progress' | 'blocked' | 'done';
  notes?: string;
}

export const CRAIG_EMAIL = 'Ccantynz@gmail.com';
export const SEND_HOUR_UTC = 13; // 9am ET / 6am PT — adjust as needed

export function getTodoList(): TodoItem[] {
  return TODO_LIST.filter(t => t.status !== 'done');
}

export function getTodoListByCategory(): Record<string, TodoItem[]> {
  const active = getTodoList();
  const grouped: Record<string, TodoItem[]> = {};
  for (const item of active) {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  }
  return grouped;
}

export function formatTodoEmail(): { subject: string; html: string; text: string } {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });
  const grouped = getTodoListByCategory();
  const totalActive = getTodoList().length;
  const critical = getTodoList().filter(t => t.priority === 'critical').length;
  const high = getTodoList().filter(t => t.priority === 'high').length;
  const inProgress = getTodoList().filter(t => t.status === 'in-progress').length;

  const subject = `Zoobicon Daily To-Do — ${totalActive} items (${critical} critical) — ${today}`;

  // Plain text version
  let text = `ZOOBICON DAILY TO-DO LIST\n${today}\n`;
  text += `${'='.repeat(50)}\n\n`;
  text += `Summary: ${totalActive} active items | ${critical} critical | ${high} high | ${inProgress} in progress\n\n`;

  for (const [category, items] of Object.entries(grouped)) {
    text += `\n--- ${category.toUpperCase()} ---\n`;
    for (const item of items) {
      const icon = item.priority === 'critical' ? '!!!' : item.priority === 'high' ? '!!' : item.priority === 'medium' ? '!' : '';
      const statusIcon = item.status === 'in-progress' ? '[>>]' : item.status === 'blocked' ? '[XX]' : '[ ]';
      text += `${statusIcon} ${icon} ${item.task}\n`;
      if (item.notes) text += `    Note: ${item.notes}\n`;
    }
  }

  text += `\n${'='.repeat(50)}\n`;
  text += `Sent automatically from Zoobicon. To update items, edit src/lib/daily-todo.ts\n`;

  // HTML version
  const priorityColors: Record<string, string> = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#6b7280',
  };

  const statusLabels: Record<string, string> = {
    'not-started': '⬜',
    'in-progress': '🔵',
    'blocked': '🔴',
    'done': '✅',
  };

  let categorySections = '';
  for (const [category, items] of Object.entries(grouped)) {
    let rows = '';
    for (const item of items) {
      rows += `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 10px 12px; font-size: 14px;">${statusLabels[item.status] || '⬜'}</td>
          <td style="padding: 10px 12px; font-size: 14px;">${item.task}${item.notes ? `<br><span style="color: #6b7280; font-size: 12px;">${item.notes}</span>` : ''}</td>
          <td style="padding: 10px 12px; text-align: center;">
            <span style="background: ${priorityColors[item.priority]}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase;">${item.priority}</span>
          </td>
        </tr>`;
    }

    categorySections += `
      <div style="margin-bottom: 28px;">
        <h2 style="color: #1e293b; font-size: 16px; font-weight: 700; margin: 0 0 12px 0; padding: 8px 12px; background: #f1f5f9; border-radius: 6px; border-left: 4px solid #3b82f6;">${category}</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; margin: 0; padding: 24px;">
  <div style="max-width: 640px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 28px 24px;">
      <h1 style="color: white; margin: 0 0 4px 0; font-size: 22px; font-weight: 700;">Zoobicon Daily To-Do</h1>
      <p style="color: #94a3b8; margin: 0; font-size: 14px;">${today}</p>
    </div>

    <!-- Stats Bar -->
    <div style="display: flex; background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
      <div style="flex: 1; padding: 16px; text-align: center; border-right: 1px solid #e2e8f0;">
        <div style="font-size: 24px; font-weight: 800; color: #1e293b;">${totalActive}</div>
        <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Total</div>
      </div>
      <div style="flex: 1; padding: 16px; text-align: center; border-right: 1px solid #e2e8f0;">
        <div style="font-size: 24px; font-weight: 800; color: #ef4444;">${critical}</div>
        <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Critical</div>
      </div>
      <div style="flex: 1; padding: 16px; text-align: center; border-right: 1px solid #e2e8f0;">
        <div style="font-size: 24px; font-weight: 800; color: #f97316;">${high}</div>
        <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">High</div>
      </div>
      <div style="flex: 1; padding: 16px; text-align: center;">
        <div style="font-size: 24px; font-weight: 800; color: #3b82f6;">${inProgress}</div>
        <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">In Progress</div>
      </div>
    </div>

    <!-- Categories -->
    <div style="padding: 24px;">
      ${categorySections}
    </div>

    <!-- Footer -->
    <div style="background: #f8fafc; padding: 16px 24px; border-top: 1px solid #e2e8f0;">
      <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">
        Sent automatically by Zoobicon &bull; To update, ask Claude to edit the to-do list
      </p>
    </div>
  </div>
</body>
</html>`;

  return { subject, html, text };
}

// ============================================================
// CRAIG'S MASTER TO-DO LIST
// ============================================================
// Status: not-started | in-progress | blocked | done
// Priority: critical | high | medium | low
//
// When a task is done, change status to 'done' — it won't
// appear in the email anymore but stays for history.
// ============================================================

const TODO_LIST: TodoItem[] = [

  // ─── AWS & INFRASTRUCTURE ────────────────────────────────
  {
    id: 'aws-1',
    category: 'AWS & Infrastructure',
    task: 'Set up AWS SES credentials and add to .env.local',
    priority: 'critical',
    status: 'not-started',
    notes: 'Need AWS_SES_ACCESS_KEY_ID, AWS_SES_SECRET_ACCESS_KEY, AWS_SES_REGION. Go to AWS Console > SES.',
  },
  {
    id: 'aws-2',
    category: 'AWS & Infrastructure',
    task: 'Verify zoobicon.com domain in AWS SES',
    priority: 'critical',
    status: 'not-started',
    notes: 'SES requires domain verification before you can send emails from @zoobicon.com addresses.',
  },
  {
    id: 'aws-3',
    category: 'AWS & Infrastructure',
    task: 'Request SES production access (move out of sandbox)',
    priority: 'high',
    status: 'not-started',
    notes: 'SES sandbox only lets you send to verified emails. Production access removes that limit.',
  },

  // ─── ZOOBICON MAIL (EMAIL MARKETING ENGINE) ──────────────
  {
    id: 'mail-1',
    category: 'Zoobicon Mail (Email Marketing)',
    task: 'Wire /email-marketing page to real /api/mail endpoints (replace mock data)',
    priority: 'high',
    status: 'not-started',
    notes: 'Backend is built and working. Frontend still shows demo/mock data.',
  },
  {
    id: 'mail-2',
    category: 'Zoobicon Mail (Email Marketing)',
    task: 'Test full email flow: create list → add subscriber → send campaign → track opens',
    priority: 'high',
    status: 'not-started',
    notes: 'Needs SES credentials set up first (aws-1).',
  },
  {
    id: 'mail-3',
    category: 'Zoobicon Mail (Email Marketing)',
    task: 'Build email template editor (drag-and-drop or block-based)',
    priority: 'medium',
    status: 'not-started',
    notes: 'Right now campaigns are plain text/HTML. Need a visual builder.',
  },

  // ─── AUTONOMOUS AGENT FRAMEWORK ──────────────────────────
  {
    id: 'agent-1',
    category: 'Agent Framework (Our OpenClaw)',
    task: 'Build agent dashboard UI at /admin/agents',
    priority: 'high',
    status: 'not-started',
    notes: 'Show all 4 agents, their status, last run, findings, and manual trigger buttons. API exists at /api/agents.',
  },
  {
    id: 'agent-2',
    category: 'Agent Framework (Our OpenClaw)',
    task: 'Set up Vercel Cron (or equivalent) to hit /api/agents/cron every 5 minutes',
    priority: 'high',
    status: 'not-started',
    notes: 'Agents are built but nothing triggers them yet. Need a cron job.',
  },
  {
    id: 'agent-3',
    category: 'Agent Framework (Our OpenClaw)',
    task: 'Build SEO Optimizer agent (auto-fix SEO issues the Site Monitor finds)',
    priority: 'medium',
    status: 'not-started',
    notes: 'Site Monitor detects problems, but nothing auto-fixes them yet.',
  },
  {
    id: 'agent-4',
    category: 'Agent Framework (Our OpenClaw)',
    task: 'Build Uptime Monitor agent (ping deployed sites, alert on downtime)',
    priority: 'medium',
    status: 'not-started',
  },
  {
    id: 'agent-5',
    category: 'Agent Framework (Our OpenClaw)',
    task: 'Design agent marketplace concept — how would users install community agents?',
    priority: 'low',
    status: 'not-started',
  },

  // ─── VIDEO CREATOR ───────────────────────────────────────
  {
    id: 'video-1',
    category: 'Video Creator',
    task: 'Get API keys for video rendering (Runway / Luma / Pika / Kling)',
    priority: 'high',
    status: 'not-started',
    notes: 'API routes are built and ready. Just need provider keys + credits.',
  },
  {
    id: 'video-2',
    category: 'Video Creator',
    task: 'Build final MP4 assembly (FFmpeg.wasm or server-side)',
    priority: 'medium',
    status: 'not-started',
    notes: 'Currently outputs a manifest JSON, not an actual video file.',
  },
  {
    id: 'video-3',
    category: 'Video Creator',
    task: 'Add music/audio library (royalty-free tracks)',
    priority: 'low',
    status: 'not-started',
    notes: 'Music cue directions are generated by AI, but no actual audio tracks yet.',
  },

  // ─── PRODUCTION HARDENING ────────────────────────────────
  {
    id: 'prod-1',
    category: 'Production Hardening',
    task: 'Connect real domain registrar API (Namecheap or Cloudflare Registrar)',
    priority: 'high',
    status: 'not-started',
    notes: 'Domain search currently returns simulated availability.',
  },
  {
    id: 'prod-2',
    category: 'Production Hardening',
    task: 'Build marketplace add-on delivery system',
    priority: 'medium',
    status: 'not-started',
    notes: 'Marketplace payments work via Stripe, but purchased add-ons aren\'t installed into sites.',
  },
  {
    id: 'prod-3',
    category: 'Production Hardening',
    task: 'Set up monitoring (Sentry for errors, Datadog or Vercel analytics)',
    priority: 'medium',
    status: 'not-started',
  },
  {
    id: 'prod-4',
    category: 'Production Hardening',
    task: 'Set up staging/preview environment (deploy preview → approve → production)',
    priority: 'low',
    status: 'not-started',
  },

  // ─── WEBSITE REDESIGN (HOMEPAGE) ─────────────────────────
  {
    id: 'redesign-1',
    category: 'Website Redesign',
    task: 'Replace hero with embedded live builder demo (visitor types prompt, sees site generated)',
    priority: 'high',
    status: 'not-started',
    notes: 'This is the #1 conversion feature. Zero-friction "aha moment" before signup.',
  },
  {
    id: 'redesign-2',
    category: 'Website Redesign',
    task: 'Add real live counter ("47,293 sites built") pulling from deployment database',
    priority: 'medium',
    status: 'not-started',
  },
  {
    id: 'redesign-3',
    category: 'Website Redesign',
    task: 'Build before/after slider component (prompt → website with draggable divider)',
    priority: 'medium',
    status: 'not-started',
  },
  {
    id: 'redesign-4',
    category: 'Website Redesign',
    task: 'Domain-specific landing pages: zoobicon.ai (3D/AI), zoobicon.io (developer), zoobicon.sh (CLI)',
    priority: 'medium',
    status: 'not-started',
    notes: 'Pages exist but need unique personalities per domain.',
  },

  // ─── STICKINESS HOOKS (QUICK WINS) ──────────────────────
  {
    id: 'sticky-1',
    category: 'Stickiness Hooks',
    task: 'Wire QuotaBar component to real usage data (currently shows placeholder)',
    priority: 'high',
    status: 'not-started',
  },
  {
    id: 'sticky-2',
    category: 'Stickiness Hooks',
    task: 'Wire NotificationInbox to real data (currently localStorage only)',
    priority: 'medium',
    status: 'not-started',
  },
  {
    id: 'sticky-3',
    category: 'Stickiness Hooks',
    task: 'Wire AchievementToast to real events (deploy, build, share milestones)',
    priority: 'medium',
    status: 'not-started',
  },
  {
    id: 'sticky-4',
    category: 'Stickiness Hooks',
    task: 'Wire ShareModal to real social API endpoints',
    priority: 'medium',
    status: 'not-started',
  },
  {
    id: 'sticky-5',
    category: 'Stickiness Hooks',
    task: 'Build referral program (?ref=username tracking, credit rewards)',
    priority: 'medium',
    status: 'not-started',
  },

  // ─── BUSINESS OS SERVICES ────────────────────────────────
  {
    id: 'bos-1',
    category: 'Business OS Services',
    task: 'Wire /email-marketing page to real Zoobicon Mail backend',
    priority: 'high',
    status: 'not-started',
    notes: 'Same as mail-1 — email marketing is the first Business OS service to go live.',
  },
  {
    id: 'bos-2',
    category: 'Business OS Services',
    task: 'Build AI Booking/Scheduling system (Calendly replacement)',
    priority: 'medium',
    status: 'not-started',
  },
  {
    id: 'bos-3',
    category: 'Business OS Services',
    task: 'Build AI Invoicing system (FreshBooks replacement)',
    priority: 'medium',
    status: 'not-started',
  },
  {
    id: 'bos-4',
    category: 'Business OS Services',
    task: 'Build Digital Product Store (Gumroad replacement)',
    priority: 'medium',
    status: 'not-started',
  },
  {
    id: 'bos-5',
    category: 'Business OS Services',
    task: 'Build AI Blog Engine with auto-SEO',
    priority: 'medium',
    status: 'not-started',
  },

  // ─── SPEED / COMPETITIVE ─────────────────────────────────
  {
    id: 'speed-1',
    category: 'Speed & Competitive',
    task: 'Get time-to-first-preview under 5 seconds (instant scaffold + progressive stream)',
    priority: 'high',
    status: 'in-progress',
    notes: 'Instant scaffold system built. Need to refine template matching and streaming injection.',
  },
  {
    id: 'speed-2',
    category: 'Speed & Competitive',
    task: 'Upgrade real-time collaboration from polling to WebSocket',
    priority: 'medium',
    status: 'not-started',
    notes: 'Current system polls every 2-3s. Needs persistent server (Railway/Fly.io) for WebSocket.',
  },

  // ─── ENV VARS / ACCOUNTS NEEDED ──────────────────────────
  {
    id: 'env-1',
    category: 'Accounts & API Keys Needed',
    task: 'AWS account → SES credentials (for Zoobicon Mail)',
    priority: 'critical',
    status: 'not-started',
  },
  {
    id: 'env-2',
    category: 'Accounts & API Keys Needed',
    task: 'Video rendering API key (Runway or Luma Labs or Pika)',
    priority: 'high',
    status: 'not-started',
  },
  {
    id: 'env-3',
    category: 'Accounts & API Keys Needed',
    task: 'ElevenLabs API key (for video voiceover — browser TTS works as fallback)',
    priority: 'medium',
    status: 'not-started',
  },
  {
    id: 'env-4',
    category: 'Accounts & API Keys Needed',
    task: 'Sentry DSN (for error monitoring)',
    priority: 'medium',
    status: 'not-started',
  },
];
