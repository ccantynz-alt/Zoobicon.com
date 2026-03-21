"use client";

import { useState, useMemo } from "react";
import {
  LayoutGrid,
  Star,
  MessageSquareQuote,
  HelpCircle,
  BarChart3,
  Image,
  Users,
  CreditCard,
  Mail,
  Phone,
  Footprints,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Plus,
  Search,
} from "lucide-react";

export interface SectionTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  /** HTML string for the section. Uses component library classes. */
  html: string;
}

interface SectionLibraryProps {
  onAddSection: (html: string) => void;
}

const SECTION_CATEGORIES = [
  { id: "all", label: "All", icon: LayoutGrid },
  { id: "hero", label: "Hero", icon: Sparkles },
  { id: "features", label: "Features", icon: Star },
  { id: "testimonials", label: "Testimonials", icon: MessageSquareQuote },
  { id: "pricing", label: "Pricing", icon: CreditCard },
  { id: "faq", label: "FAQ", icon: HelpCircle },
  { id: "stats", label: "Stats", icon: BarChart3 },
  { id: "gallery", label: "Gallery", icon: Image },
  { id: "team", label: "Team", icon: Users },
  { id: "cta", label: "CTA", icon: Mail },
  { id: "contact", label: "Contact", icon: Phone },
  { id: "footer", label: "Footer", icon: Footprints },
];

const SECTION_TEMPLATES: SectionTemplate[] = [
  // ── Hero Sections ──
  {
    id: "hero-centered",
    name: "Centered Hero",
    category: "hero",
    description: "Bold headline with CTA buttons, centered layout",
    html: `<section class="section hero-aurora" style="padding:100px 0;text-align:center;">
  <div class="container">
    <h1 class="hero-gradient-text" style="font-size:clamp(2.5rem,5vw,4.5rem);font-weight:800;margin-bottom:24px;">Build Something Amazing</h1>
    <p style="font-size:1.25rem;color:#6b7280;max-width:640px;margin:0 auto 40px;">The fastest way to turn your ideas into reality. Start building beautiful websites in minutes, not months.</p>
    <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap;">
      <a href="#" class="btn btn-primary btn-lg">Get Started Free</a>
      <a href="#" class="btn btn-ghost btn-lg">Watch Demo</a>
    </div>
  </div>
</section>`,
  },
  {
    id: "hero-split",
    name: "Split Hero",
    category: "hero",
    description: "Text on left, image on right",
    html: `<section class="section" style="padding:80px 0;">
  <div class="container" style="display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center;">
    <div>
      <span class="badge badge-primary" style="margin-bottom:16px;">Now Available</span>
      <h1 style="font-size:clamp(2rem,4vw,3.5rem);font-weight:800;margin-bottom:20px;line-height:1.1;">Transform Your Workflow Today</h1>
      <p style="font-size:1.125rem;color:#6b7280;margin-bottom:32px;line-height:1.7;">Streamline your processes, boost productivity, and achieve more with our powerful platform.</p>
      <div style="display:flex;gap:12px;">
        <a href="#" class="btn btn-primary btn-lg">Start Free Trial</a>
        <a href="#" class="btn btn-secondary">Learn More</a>
      </div>
    </div>
    <div style="position:relative;">
      <img src="https://picsum.photos/seed/hero-product/640/480" alt="Product preview" style="width:100%;border-radius:16px;box-shadow:0 25px 50px rgba(0,0,0,0.15);" />
    </div>
  </div>
</section>`,
  },
  {
    id: "hero-image-bg",
    name: "Full-Image Hero",
    category: "hero",
    description: "Full-width background image with overlay text",
    html: `<section class="hero-image" style="background-image:url('https://picsum.photos/seed/hero-bg/1600/900');min-height:80vh;display:flex;align-items:center;">
  <div class="overlay-gradient" style="position:absolute;inset:0;"></div>
  <div class="container overlay-text" style="position:relative;z-index:2;text-align:center;">
    <h1 style="font-size:clamp(2.5rem,6vw,5rem);font-weight:800;margin-bottom:24px;">Your Story Starts Here</h1>
    <p style="font-size:1.25rem;margin-bottom:40px;max-width:600px;margin-left:auto;margin-right:auto;opacity:0.9;">Discover extraordinary experiences that inspire, connect, and transform.</p>
    <a href="#" class="btn btn-primary btn-lg">Explore Now</a>
  </div>
</section>`,
  },

  // ── Features ──
  {
    id: "features-grid-3",
    name: "3-Column Features",
    category: "features",
    description: "Three feature cards with icons",
    html: `<section class="section">
  <div class="container">
    <div style="text-align:center;margin-bottom:48px;">
      <h2 style="font-size:2rem;font-weight:700;margin-bottom:12px;">Everything You Need</h2>
      <p style="color:#6b7280;font-size:1.125rem;max-width:560px;margin:0 auto;">Powerful features to help you manage, grow, and succeed.</p>
    </div>
    <div class="grid-3">
      <div class="card">
        <div class="card-body" style="text-align:center;padding:32px;">
          <div style="width:56px;height:56px;border-radius:12px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);margin:0 auto 20px;display:flex;align-items:center;justify-content:center;">
            <svg width="24" height="24" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          </div>
          <h3 style="font-size:1.25rem;font-weight:600;margin-bottom:8px;">Lightning Fast</h3>
          <p style="color:#6b7280;line-height:1.6;">Optimized for speed at every level. Your users will feel the difference.</p>
        </div>
      </div>
      <div class="card">
        <div class="card-body" style="text-align:center;padding:32px;">
          <div style="width:56px;height:56px;border-radius:12px;background:linear-gradient(135deg,#10b981,#059669);margin:0 auto 20px;display:flex;align-items:center;justify-content:center;">
            <svg width="24" height="24" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <h3 style="font-size:1.25rem;font-weight:600;margin-bottom:8px;">Secure by Default</h3>
          <p style="color:#6b7280;line-height:1.6;">Enterprise-grade security with encryption, SSO, and compliance built in.</p>
        </div>
      </div>
      <div class="card">
        <div class="card-body" style="text-align:center;padding:32px;">
          <div style="width:56px;height:56px;border-radius:12px;background:linear-gradient(135deg,#f59e0b,#d97706);margin:0 auto 20px;display:flex;align-items:center;justify-content:center;">
            <svg width="24" height="24" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <h3 style="font-size:1.25rem;font-weight:600;margin-bottom:8px;">Team Collaboration</h3>
          <p style="color:#6b7280;line-height:1.6;">Work together in real-time with your team. Shared workspaces and instant sync.</p>
        </div>
      </div>
    </div>
  </div>
</section>`,
  },
  {
    id: "features-grid-4",
    name: "4-Column Features",
    category: "features",
    description: "Compact four-feature grid with icons",
    html: `<section class="section section-alt">
  <div class="container">
    <div style="text-align:center;margin-bottom:48px;">
      <h2 style="font-size:2rem;font-weight:700;margin-bottom:12px;">Why Choose Us</h2>
      <p style="color:#6b7280;max-width:500px;margin:0 auto;">Built with the best tools and practices to deliver exceptional results.</p>
    </div>
    <div class="grid-4">
      <div style="text-align:center;padding:24px;">
        <div style="font-size:2.5rem;margin-bottom:12px;">🚀</div>
        <h3 style="font-weight:600;margin-bottom:6px;">Fast Setup</h3>
        <p style="color:#6b7280;font-size:0.875rem;">Get started in under 5 minutes</p>
      </div>
      <div style="text-align:center;padding:24px;">
        <div style="font-size:2.5rem;margin-bottom:12px;">🔒</div>
        <h3 style="font-weight:600;margin-bottom:6px;">Secure</h3>
        <p style="color:#6b7280;font-size:0.875rem;">SOC 2 and GDPR compliant</p>
      </div>
      <div style="text-align:center;padding:24px;">
        <div style="font-size:2.5rem;margin-bottom:12px;">📊</div>
        <h3 style="font-weight:600;margin-bottom:6px;">Analytics</h3>
        <p style="color:#6b7280;font-size:0.875rem;">Real-time insights and reports</p>
      </div>
      <div style="text-align:center;padding:24px;">
        <div style="font-size:2.5rem;margin-bottom:12px;">💬</div>
        <h3 style="font-weight:600;margin-bottom:6px;">Support</h3>
        <p style="color:#6b7280;font-size:0.875rem;">24/7 live chat and email</p>
      </div>
    </div>
  </div>
</section>`,
  },
  {
    id: "features-alternating",
    name: "Alternating Features",
    category: "features",
    description: "Image-text sections alternating sides",
    html: `<section class="section">
  <div class="container" style="display:flex;flex-direction:column;gap:80px;">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;">
      <div>
        <span class="badge badge-success" style="margin-bottom:12px;">New Feature</span>
        <h2 style="font-size:1.75rem;font-weight:700;margin-bottom:16px;">Automated Workflows</h2>
        <p style="color:#6b7280;line-height:1.7;margin-bottom:20px;">Set up once and let the system handle the rest. Save hours every week with intelligent automation that learns your patterns.</p>
        <ul style="list-style:none;padding:0;display:flex;flex-direction:column;gap:8px;">
          <li style="display:flex;align-items:center;gap:8px;color:#374151;"><span style="color:#10b981;font-weight:700;">✓</span> Smart task routing</li>
          <li style="display:flex;align-items:center;gap:8px;color:#374151;"><span style="color:#10b981;font-weight:700;">✓</span> Custom triggers &amp; actions</li>
          <li style="display:flex;align-items:center;gap:8px;color:#374151;"><span style="color:#10b981;font-weight:700;">✓</span> Real-time notifications</li>
        </ul>
      </div>
      <img src="https://picsum.photos/seed/feature-1/600/400" alt="Automated workflows" style="width:100%;border-radius:12px;box-shadow:0 20px 40px rgba(0,0,0,0.1);" />
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;">
      <img src="https://picsum.photos/seed/feature-2/600/400" alt="Analytics dashboard" style="width:100%;border-radius:12px;box-shadow:0 20px 40px rgba(0,0,0,0.1);" />
      <div>
        <span class="badge badge-primary" style="margin-bottom:12px;">Analytics</span>
        <h2 style="font-size:1.75rem;font-weight:700;margin-bottom:16px;">Deep Insights at a Glance</h2>
        <p style="color:#6b7280;line-height:1.7;margin-bottom:20px;">Track every metric that matters. Beautiful dashboards that turn complex data into actionable insights.</p>
        <a href="#" class="btn btn-primary">View Demo Dashboard</a>
      </div>
    </div>
  </div>
</section>`,
  },

  // ── Testimonials ──
  {
    id: "testimonials-cards",
    name: "Testimonial Cards",
    category: "testimonials",
    description: "Three testimonial cards with quotes and photos",
    html: `<section class="section section-alt">
  <div class="container">
    <div style="text-align:center;margin-bottom:48px;">
      <h2 style="font-size:2rem;font-weight:700;margin-bottom:12px;">Loved by Thousands</h2>
      <p style="color:#6b7280;">See what our customers have to say about their experience.</p>
    </div>
    <div class="grid-3">
      <div class="testimonial-card">
        <p style="color:#374151;line-height:1.7;margin-bottom:20px;">"This tool completely transformed our workflow. We shipped 3x faster in the first month alone. The ROI has been incredible."</p>
        <div style="display:flex;align-items:center;gap:12px;">
          <img src="https://picsum.photos/seed/avatar-1/48/48" alt="Sarah Chen" style="width:48px;height:48px;border-radius:50%;" />
          <div>
            <div style="font-weight:600;">Sarah Chen</div>
            <div style="color:#6b7280;font-size:0.875rem;">CTO, TechStart</div>
          </div>
        </div>
      </div>
      <div class="testimonial-card">
        <p style="color:#374151;line-height:1.7;margin-bottom:20px;">"The best investment we've made this year. Support is phenomenal and the product keeps getting better every week."</p>
        <div style="display:flex;align-items:center;gap:12px;">
          <img src="https://picsum.photos/seed/avatar-2/48/48" alt="Marcus Johnson" style="width:48px;height:48px;border-radius:50%;" />
          <div>
            <div style="font-weight:600;">Marcus Johnson</div>
            <div style="color:#6b7280;font-size:0.875rem;">Founder, GrowthLab</div>
          </div>
        </div>
      </div>
      <div class="testimonial-card">
        <p style="color:#374151;line-height:1.7;margin-bottom:20px;">"Switched from our old stack and never looked back. Everything just works. Our team collaboration has improved dramatically."</p>
        <div style="display:flex;align-items:center;gap:12px;">
          <img src="https://picsum.photos/seed/avatar-3/48/48" alt="Emily Rodriguez" style="width:48px;height:48px;border-radius:50%;" />
          <div>
            <div style="font-weight:600;">Emily Rodriguez</div>
            <div style="color:#6b7280;font-size:0.875rem;">VP Eng, ScaleUp</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>`,
  },
  {
    id: "testimonials-large",
    name: "Large Testimonial",
    category: "testimonials",
    description: "Single large quote with photo",
    html: `<section class="section" style="background:linear-gradient(135deg,#1e3a5f,#0f172a);color:white;">
  <div class="container" style="text-align:center;max-width:800px;">
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(96,165,250,0.5)" stroke-width="1.5" style="margin:0 auto 24px;"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z"/></svg>
    <blockquote style="font-size:1.5rem;font-weight:300;line-height:1.7;margin-bottom:32px;opacity:0.95;">
      "Working with this platform has been a game-changer. We reduced our development time by 70% and the quality of output exceeds anything we've built before."
    </blockquote>
    <div style="display:flex;align-items:center;justify-content:center;gap:16px;">
      <img src="https://picsum.photos/seed/avatar-big/64/64" alt="James Wilson" style="width:64px;height:64px;border-radius:50%;border:3px solid rgba(96,165,250,0.3);" />
      <div style="text-align:left;">
        <div style="font-weight:600;font-size:1.125rem;">James Wilson</div>
        <div style="color:rgba(148,163,184,0.8);font-size:0.875rem;">CEO, Enterprise Corp</div>
      </div>
    </div>
  </div>
</section>`,
  },

  // ── Pricing ──
  {
    id: "pricing-3-tiers",
    name: "3-Tier Pricing",
    category: "pricing",
    description: "Three pricing cards with highlighted middle tier",
    html: `<section class="section" id="pricing">
  <div class="container">
    <div style="text-align:center;margin-bottom:48px;">
      <h2 style="font-size:2rem;font-weight:700;margin-bottom:12px;">Simple, Transparent Pricing</h2>
      <p style="color:#6b7280;max-width:500px;margin:0 auto;">No hidden fees. Choose the plan that fits your needs.</p>
    </div>
    <div class="grid-3" style="max-width:960px;margin:0 auto;">
      <div class="card" style="text-align:center;">
        <div class="card-body" style="padding:32px;">
          <h3 style="font-size:1.25rem;font-weight:600;margin-bottom:8px;">Starter</h3>
          <div style="font-size:3rem;font-weight:800;margin-bottom:4px;">$9<span style="font-size:1rem;font-weight:400;color:#6b7280;">/mo</span></div>
          <p style="color:#6b7280;font-size:0.875rem;margin-bottom:24px;">Perfect for individuals</p>
          <ul style="list-style:none;padding:0;text-align:left;display:flex;flex-direction:column;gap:12px;margin-bottom:32px;">
            <li style="display:flex;align-items:center;gap:8px;font-size:0.9375rem;"><span style="color:#10b981;">✓</span> 5 projects</li>
            <li style="display:flex;align-items:center;gap:8px;font-size:0.9375rem;"><span style="color:#10b981;">✓</span> 1 GB storage</li>
            <li style="display:flex;align-items:center;gap:8px;font-size:0.9375rem;"><span style="color:#10b981;">✓</span> Email support</li>
          </ul>
          <a href="#" class="btn btn-secondary" style="width:100%;">Get Started</a>
        </div>
      </div>
      <div class="card" style="text-align:center;border:2px solid #3b82f6;transform:scale(1.05);position:relative;">
        <div style="position:absolute;top:-14px;left:50%;transform:translateX(-50%);">
          <span class="badge badge-primary" style="font-size:0.75rem;">Most Popular</span>
        </div>
        <div class="card-body" style="padding:32px;">
          <h3 style="font-size:1.25rem;font-weight:600;margin-bottom:8px;">Pro</h3>
          <div style="font-size:3rem;font-weight:800;margin-bottom:4px;">$29<span style="font-size:1rem;font-weight:400;color:#6b7280;">/mo</span></div>
          <p style="color:#6b7280;font-size:0.875rem;margin-bottom:24px;">Best for growing teams</p>
          <ul style="list-style:none;padding:0;text-align:left;display:flex;flex-direction:column;gap:12px;margin-bottom:32px;">
            <li style="display:flex;align-items:center;gap:8px;font-size:0.9375rem;"><span style="color:#10b981;">✓</span> Unlimited projects</li>
            <li style="display:flex;align-items:center;gap:8px;font-size:0.9375rem;"><span style="color:#10b981;">✓</span> 50 GB storage</li>
            <li style="display:flex;align-items:center;gap:8px;font-size:0.9375rem;"><span style="color:#10b981;">✓</span> Priority support</li>
            <li style="display:flex;align-items:center;gap:8px;font-size:0.9375rem;"><span style="color:#10b981;">✓</span> Custom domain</li>
          </ul>
          <a href="#" class="btn btn-primary" style="width:100%;">Get Started</a>
        </div>
      </div>
      <div class="card" style="text-align:center;">
        <div class="card-body" style="padding:32px;">
          <h3 style="font-size:1.25rem;font-weight:600;margin-bottom:8px;">Enterprise</h3>
          <div style="font-size:3rem;font-weight:800;margin-bottom:4px;">$99<span style="font-size:1rem;font-weight:400;color:#6b7280;">/mo</span></div>
          <p style="color:#6b7280;font-size:0.875rem;margin-bottom:24px;">For large organizations</p>
          <ul style="list-style:none;padding:0;text-align:left;display:flex;flex-direction:column;gap:12px;margin-bottom:32px;">
            <li style="display:flex;align-items:center;gap:8px;font-size:0.9375rem;"><span style="color:#10b981;">✓</span> Everything in Pro</li>
            <li style="display:flex;align-items:center;gap:8px;font-size:0.9375rem;"><span style="color:#10b981;">✓</span> Unlimited storage</li>
            <li style="display:flex;align-items:center;gap:8px;font-size:0.9375rem;"><span style="color:#10b981;">✓</span> SSO &amp; SAML</li>
            <li style="display:flex;align-items:center;gap:8px;font-size:0.9375rem;"><span style="color:#10b981;">✓</span> Dedicated manager</li>
          </ul>
          <a href="#" class="btn btn-secondary" style="width:100%;">Contact Sales</a>
        </div>
      </div>
    </div>
  </div>
</section>`,
  },

  // ── FAQ ──
  {
    id: "faq-accordion",
    name: "FAQ Accordion",
    category: "faq",
    description: "Expandable FAQ with 5 questions",
    html: `<section class="section section-alt" id="faq">
  <div class="container" style="max-width:768px;">
    <div style="text-align:center;margin-bottom:48px;">
      <h2 style="font-size:2rem;font-weight:700;margin-bottom:12px;">Frequently Asked Questions</h2>
      <p style="color:#6b7280;">Everything you need to know. Can't find an answer? <a href="#contact" style="color:#3b82f6;">Contact us</a>.</p>
    </div>
    <div style="display:flex;flex-direction:column;gap:12px;">
      <div class="faq-item">
        <div class="faq-question">How do I get started?</div>
        <div class="faq-answer">Sign up for a free account, choose a template, and start customizing. No credit card required. You can upgrade anytime as your needs grow.</div>
      </div>
      <div class="faq-item">
        <div class="faq-question">Can I cancel my subscription?</div>
        <div class="faq-answer">Yes, you can cancel at any time from your account settings. There are no cancellation fees or long-term contracts. Your data remains accessible for 30 days after cancellation.</div>
      </div>
      <div class="faq-item">
        <div class="faq-question">Do you offer a free trial?</div>
        <div class="faq-answer">Absolutely! Every new account starts with a 14-day free trial of our Pro plan. No credit card required to start.</div>
      </div>
      <div class="faq-item">
        <div class="faq-question">What kind of support do you offer?</div>
        <div class="faq-answer">We offer 24/7 email support for all plans, live chat for Pro and above, and a dedicated account manager for Enterprise customers. Average response time is under 2 hours.</div>
      </div>
      <div class="faq-item">
        <div class="faq-question">Is my data secure?</div>
        <div class="faq-answer">Yes. We use AES-256 encryption at rest and TLS 1.3 in transit. We're SOC 2 Type II certified and GDPR compliant. Regular penetration testing is performed by third-party security firms.</div>
      </div>
    </div>
  </div>
</section>`,
  },

  // ── Stats ──
  {
    id: "stats-bar",
    name: "Stats Bar",
    category: "stats",
    description: "Horizontal stats with large numbers",
    html: `<section class="section" style="background:linear-gradient(135deg,#1e3a5f,#0f172a);color:white;">
  <div class="container">
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:32px;text-align:center;">
      <div class="stat-item">
        <div class="stat-number" style="font-size:2.5rem;font-weight:800;color:#60a5fa;">2,847</div>
        <div style="color:rgba(148,163,184,0.8);font-size:0.875rem;margin-top:4px;">Happy Customers</div>
      </div>
      <div class="stat-item">
        <div class="stat-number" style="font-size:2.5rem;font-weight:800;color:#34d399;">99.9%</div>
        <div style="color:rgba(148,163,184,0.8);font-size:0.875rem;margin-top:4px;">Uptime SLA</div>
      </div>
      <div class="stat-item">
        <div class="stat-number" style="font-size:2.5rem;font-weight:800;color:#fbbf24;">150+</div>
        <div style="color:rgba(148,163,184,0.8);font-size:0.875rem;margin-top:4px;">Integrations</div>
      </div>
      <div class="stat-item">
        <div class="stat-number" style="font-size:2.5rem;font-weight:800;color:#f472b6;">4.9/5</div>
        <div style="color:rgba(148,163,184,0.8);font-size:0.875rem;margin-top:4px;">Average Rating</div>
      </div>
    </div>
  </div>
</section>`,
  },

  // ── Gallery ──
  {
    id: "gallery-grid",
    name: "Image Gallery",
    category: "gallery",
    description: "Responsive image gallery with hover effects",
    html: `<section class="section">
  <div class="container">
    <div style="text-align:center;margin-bottom:48px;">
      <h2 style="font-size:2rem;font-weight:700;margin-bottom:12px;">Our Work</h2>
      <p style="color:#6b7280;">A selection of projects we're proud of.</p>
    </div>
    <div class="image-gallery">
      <div class="image-gallery-item"><img src="https://picsum.photos/seed/gallery-1/600/450" alt="Project 1" style="width:100%;height:100%;object-fit:cover;" /></div>
      <div class="image-gallery-item"><img src="https://picsum.photos/seed/gallery-2/600/450" alt="Project 2" style="width:100%;height:100%;object-fit:cover;" /></div>
      <div class="image-gallery-item"><img src="https://picsum.photos/seed/gallery-3/600/450" alt="Project 3" style="width:100%;height:100%;object-fit:cover;" /></div>
      <div class="image-gallery-item"><img src="https://picsum.photos/seed/gallery-4/600/450" alt="Project 4" style="width:100%;height:100%;object-fit:cover;" /></div>
      <div class="image-gallery-item"><img src="https://picsum.photos/seed/gallery-5/600/450" alt="Project 5" style="width:100%;height:100%;object-fit:cover;" /></div>
      <div class="image-gallery-item"><img src="https://picsum.photos/seed/gallery-6/600/450" alt="Project 6" style="width:100%;height:100%;object-fit:cover;" /></div>
    </div>
  </div>
</section>`,
  },

  // ── Team ──
  {
    id: "team-grid",
    name: "Team Grid",
    category: "team",
    description: "Team member cards with photos and roles",
    html: `<section class="section section-alt">
  <div class="container">
    <div style="text-align:center;margin-bottom:48px;">
      <h2 style="font-size:2rem;font-weight:700;margin-bottom:12px;">Meet Our Team</h2>
      <p style="color:#6b7280;">The talented people behind our success.</p>
    </div>
    <div class="grid-4">
      <div class="card" style="text-align:center;">
        <div class="card-body" style="padding:24px;">
          <img src="https://picsum.photos/seed/team-1/200/200" alt="Alex Rivera" style="width:96px;height:96px;border-radius:50%;margin:0 auto 16px;object-fit:cover;" />
          <h3 style="font-weight:600;margin-bottom:4px;">Alex Rivera</h3>
          <p style="color:#6b7280;font-size:0.875rem;margin-bottom:12px;">CEO &amp; Co-Founder</p>
          <div style="display:flex;gap:8px;justify-content:center;">
            <a href="#" style="color:#6b7280;text-decoration:none;">LinkedIn</a>
            <a href="#" style="color:#6b7280;text-decoration:none;">Twitter</a>
          </div>
        </div>
      </div>
      <div class="card" style="text-align:center;">
        <div class="card-body" style="padding:24px;">
          <img src="https://picsum.photos/seed/team-2/200/200" alt="Jordan Kim" style="width:96px;height:96px;border-radius:50%;margin:0 auto 16px;object-fit:cover;" />
          <h3 style="font-weight:600;margin-bottom:4px;">Jordan Kim</h3>
          <p style="color:#6b7280;font-size:0.875rem;margin-bottom:12px;">CTO</p>
          <div style="display:flex;gap:8px;justify-content:center;">
            <a href="#" style="color:#6b7280;text-decoration:none;">LinkedIn</a>
            <a href="#" style="color:#6b7280;text-decoration:none;">GitHub</a>
          </div>
        </div>
      </div>
      <div class="card" style="text-align:center;">
        <div class="card-body" style="padding:24px;">
          <img src="https://picsum.photos/seed/team-3/200/200" alt="Sam Taylor" style="width:96px;height:96px;border-radius:50%;margin:0 auto 16px;object-fit:cover;" />
          <h3 style="font-weight:600;margin-bottom:4px;">Sam Taylor</h3>
          <p style="color:#6b7280;font-size:0.875rem;margin-bottom:12px;">Head of Design</p>
          <div style="display:flex;gap:8px;justify-content:center;">
            <a href="#" style="color:#6b7280;text-decoration:none;">Dribbble</a>
            <a href="#" style="color:#6b7280;text-decoration:none;">Twitter</a>
          </div>
        </div>
      </div>
      <div class="card" style="text-align:center;">
        <div class="card-body" style="padding:24px;">
          <img src="https://picsum.photos/seed/team-4/200/200" alt="Casey Nguyen" style="width:96px;height:96px;border-radius:50%;margin:0 auto 16px;object-fit:cover;" />
          <h3 style="font-weight:600;margin-bottom:4px;">Casey Nguyen</h3>
          <p style="color:#6b7280;font-size:0.875rem;margin-bottom:12px;">Lead Engineer</p>
          <div style="display:flex;gap:8px;justify-content:center;">
            <a href="#" style="color:#6b7280;text-decoration:none;">GitHub</a>
            <a href="#" style="color:#6b7280;text-decoration:none;">LinkedIn</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>`,
  },

  // ── CTA ──
  {
    id: "cta-centered",
    name: "Centered CTA",
    category: "cta",
    description: "Bold call to action with gradient background",
    html: `<section class="section" style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:white;text-align:center;">
  <div class="container" style="max-width:640px;">
    <h2 style="font-size:2.25rem;font-weight:800;margin-bottom:16px;">Ready to Get Started?</h2>
    <p style="font-size:1.125rem;opacity:0.9;margin-bottom:32px;">Join 2,000+ teams already using our platform. Start your free trial today — no credit card required.</p>
    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
      <a href="#" class="btn btn-lg" style="background:white;color:#3b82f6;font-weight:700;">Start Free Trial</a>
      <a href="#" class="btn btn-ghost btn-lg" style="color:white;border-color:rgba(255,255,255,0.4);">Talk to Sales</a>
    </div>
    <p style="font-size:0.8125rem;opacity:0.7;margin-top:16px;">No credit card required · Free 14-day trial · Cancel anytime</p>
  </div>
</section>`,
  },
  {
    id: "cta-newsletter",
    name: "Newsletter CTA",
    category: "cta",
    description: "Email signup with inline input",
    html: `<section class="section section-alt">
  <div class="container" style="max-width:640px;text-align:center;">
    <h2 style="font-size:1.75rem;font-weight:700;margin-bottom:12px;">Stay in the Loop</h2>
    <p style="color:#6b7280;margin-bottom:24px;">Get the latest updates, tips, and exclusive content delivered straight to your inbox.</p>
    <form style="display:flex;gap:8px;max-width:460px;margin:0 auto;" onsubmit="event.preventDefault();">
      <input type="email" placeholder="Enter your email" class="input" style="flex:1;" />
      <button type="submit" class="btn btn-primary">Subscribe</button>
    </form>
    <p style="font-size:0.75rem;color:#9ca3af;margin-top:12px;">No spam, ever. Unsubscribe at any time.</p>
  </div>
</section>`,
  },

  // ── Contact ──
  {
    id: "contact-form",
    name: "Contact Form",
    category: "contact",
    description: "Contact form with info sidebar",
    html: `<section class="section" id="contact">
  <div class="container">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:64px;">
      <div>
        <h2 style="font-size:2rem;font-weight:700;margin-bottom:16px;">Get in Touch</h2>
        <p style="color:#6b7280;line-height:1.7;margin-bottom:32px;">Have a question or want to work together? We'd love to hear from you. Fill out the form and we'll respond within 24 hours.</p>
        <div style="display:flex;flex-direction:column;gap:20px;">
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:40px;height:40px;border-radius:10px;background:#eff6ff;display:flex;align-items:center;justify-content:center;color:#3b82f6;font-size:1.25rem;">📧</div>
            <div>
              <div style="font-weight:600;font-size:0.875rem;">Email</div>
              <div style="color:#6b7280;font-size:0.875rem;">hello@example.com</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:40px;height:40px;border-radius:10px;background:#eff6ff;display:flex;align-items:center;justify-content:center;color:#3b82f6;font-size:1.25rem;">📱</div>
            <div>
              <div style="font-weight:600;font-size:0.875rem;">Phone</div>
              <div style="color:#6b7280;font-size:0.875rem;">+1 (555) 123-4567</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:40px;height:40px;border-radius:10px;background:#eff6ff;display:flex;align-items:center;justify-content:center;color:#3b82f6;font-size:1.25rem;">📍</div>
            <div>
              <div style="font-weight:600;font-size:0.875rem;">Office</div>
              <div style="color:#6b7280;font-size:0.875rem;">123 Innovation Drive, San Francisco, CA</div>
            </div>
          </div>
        </div>
      </div>
      <form style="display:flex;flex-direction:column;gap:16px;" onsubmit="event.preventDefault();">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div>
            <label style="display:block;font-size:0.875rem;font-weight:500;margin-bottom:4px;">First Name</label>
            <input type="text" class="input" placeholder="John" />
          </div>
          <div>
            <label style="display:block;font-size:0.875rem;font-weight:500;margin-bottom:4px;">Last Name</label>
            <input type="text" class="input" placeholder="Doe" />
          </div>
        </div>
        <div>
          <label style="display:block;font-size:0.875rem;font-weight:500;margin-bottom:4px;">Email</label>
          <input type="email" class="input" placeholder="john@example.com" />
        </div>
        <div>
          <label style="display:block;font-size:0.875rem;font-weight:500;margin-bottom:4px;">Message</label>
          <textarea class="input" rows="4" placeholder="Tell us about your project..." style="resize:vertical;"></textarea>
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%;">Send Message</button>
      </form>
    </div>
  </div>
</section>`,
  },

  // ── Footer ──
  {
    id: "footer-4-col",
    name: "4-Column Footer",
    category: "footer",
    description: "Comprehensive footer with columns and social links",
    html: `<footer style="background:#0f172a;color:rgba(148,163,184,0.8);padding:64px 0 32px;">
  <div class="container">
    <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:48px;margin-bottom:48px;">
      <div>
        <div style="font-size:1.5rem;font-weight:800;color:white;margin-bottom:16px;">Brand</div>
        <p style="line-height:1.7;max-width:280px;font-size:0.9375rem;">Building the future of web development, one pixel at a time. Making the web accessible to everyone.</p>
      </div>
      <div>
        <h4 style="color:white;font-weight:600;margin-bottom:16px;font-size:0.875rem;text-transform:uppercase;letter-spacing:0.05em;">Product</h4>
        <ul style="list-style:none;padding:0;display:flex;flex-direction:column;gap:10px;">
          <li><a href="#" style="color:inherit;text-decoration:none;font-size:0.9375rem;">Features</a></li>
          <li><a href="#" style="color:inherit;text-decoration:none;font-size:0.9375rem;">Pricing</a></li>
          <li><a href="#" style="color:inherit;text-decoration:none;font-size:0.9375rem;">Templates</a></li>
          <li><a href="#" style="color:inherit;text-decoration:none;font-size:0.9375rem;">Integrations</a></li>
        </ul>
      </div>
      <div>
        <h4 style="color:white;font-weight:600;margin-bottom:16px;font-size:0.875rem;text-transform:uppercase;letter-spacing:0.05em;">Company</h4>
        <ul style="list-style:none;padding:0;display:flex;flex-direction:column;gap:10px;">
          <li><a href="#" style="color:inherit;text-decoration:none;font-size:0.9375rem;">About</a></li>
          <li><a href="#" style="color:inherit;text-decoration:none;font-size:0.9375rem;">Blog</a></li>
          <li><a href="#" style="color:inherit;text-decoration:none;font-size:0.9375rem;">Careers</a></li>
          <li><a href="#" style="color:inherit;text-decoration:none;font-size:0.9375rem;">Contact</a></li>
        </ul>
      </div>
      <div>
        <h4 style="color:white;font-weight:600;margin-bottom:16px;font-size:0.875rem;text-transform:uppercase;letter-spacing:0.05em;">Legal</h4>
        <ul style="list-style:none;padding:0;display:flex;flex-direction:column;gap:10px;">
          <li><a href="#" style="color:inherit;text-decoration:none;font-size:0.9375rem;">Privacy</a></li>
          <li><a href="#" style="color:inherit;text-decoration:none;font-size:0.9375rem;">Terms</a></li>
          <li><a href="#" style="color:inherit;text-decoration:none;font-size:0.9375rem;">Security</a></li>
          <li><a href="#" style="color:inherit;text-decoration:none;font-size:0.9375rem;">Cookies</a></li>
        </ul>
      </div>
    </div>
    <div style="border-top:1px solid rgba(148,163,184,0.15);padding-top:24px;display:flex;align-items:center;justify-content:space-between;">
      <p style="font-size:0.8125rem;">&copy; 2026 Brand. All rights reserved.</p>
      <div style="display:flex;gap:16px;">
        <a href="#" style="color:inherit;text-decoration:none;font-size:0.875rem;">Twitter</a>
        <a href="#" style="color:inherit;text-decoration:none;font-size:0.875rem;">GitHub</a>
        <a href="#" style="color:inherit;text-decoration:none;font-size:0.875rem;">LinkedIn</a>
      </div>
    </div>
  </div>
</footer>`,
  },
  {
    id: "footer-simple",
    name: "Simple Footer",
    category: "footer",
    description: "Minimal footer with links and copyright",
    html: `<footer style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:32px 0;">
  <div class="container" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;">
    <p style="color:#6b7280;font-size:0.875rem;">&copy; 2026 Brand. All rights reserved.</p>
    <nav style="display:flex;gap:24px;">
      <a href="#" style="color:#6b7280;text-decoration:none;font-size:0.875rem;">Privacy</a>
      <a href="#" style="color:#6b7280;text-decoration:none;font-size:0.875rem;">Terms</a>
      <a href="#" style="color:#6b7280;text-decoration:none;font-size:0.875rem;">Contact</a>
    </nav>
  </div>
</footer>`,
  },

  // ── Logo Strip / Social Proof ──
  {
    id: "logo-strip",
    name: "Logo Strip",
    category: "stats",
    description: "Trusted by companies logo bar",
    html: `<section style="padding:40px 0;border-top:1px solid #f3f4f6;border-bottom:1px solid #f3f4f6;">
  <div class="container">
    <p style="text-align:center;color:#9ca3af;font-size:0.8125rem;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:24px;">Trusted by 500+ companies worldwide</p>
    <div class="logo-strip" style="display:flex;align-items:center;justify-content:center;gap:48px;flex-wrap:wrap;opacity:0.4;">
      <span style="font-size:1.5rem;font-weight:700;color:#374151;">Acme Corp</span>
      <span style="font-size:1.5rem;font-weight:700;color:#374151;">TechFlow</span>
      <span style="font-size:1.5rem;font-weight:700;color:#374151;">DataSync</span>
      <span style="font-size:1.5rem;font-weight:700;color:#374151;">CloudBase</span>
      <span style="font-size:1.5rem;font-weight:700;color:#374151;">NexGen</span>
    </div>
  </div>
</section>`,
  },

  // ── How It Works ──
  {
    id: "how-it-works",
    name: "How It Works",
    category: "features",
    description: "3-step process with numbered steps",
    html: `<section class="section">
  <div class="container" style="max-width:860px;">
    <div style="text-align:center;margin-bottom:56px;">
      <h2 style="font-size:2rem;font-weight:700;margin-bottom:12px;">How It Works</h2>
      <p style="color:#6b7280;">Get up and running in three simple steps.</p>
    </div>
    <div style="display:flex;flex-direction:column;gap:48px;">
      <div style="display:flex;align-items:flex-start;gap:24px;">
        <div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#2563eb);color:white;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:1.25rem;flex-shrink:0;">1</div>
        <div>
          <h3 style="font-size:1.25rem;font-weight:600;margin-bottom:6px;">Create Your Account</h3>
          <p style="color:#6b7280;line-height:1.7;">Sign up in seconds with just your email. No credit card required. Get instant access to all features.</p>
        </div>
      </div>
      <div style="display:flex;align-items:flex-start;gap:24px;">
        <div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#2563eb);color:white;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:1.25rem;flex-shrink:0;">2</div>
        <div>
          <h3 style="font-size:1.25rem;font-weight:600;margin-bottom:6px;">Describe Your Vision</h3>
          <p style="color:#6b7280;line-height:1.7;">Tell us about your business in plain English. Our AI agents analyze your brief and create a custom strategy.</p>
        </div>
      </div>
      <div style="display:flex;align-items:flex-start;gap:24px;">
        <div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#2563eb);color:white;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:1.25rem;flex-shrink:0;">3</div>
        <div>
          <h3 style="font-size:1.25rem;font-weight:600;margin-bottom:6px;">Launch Your Site</h3>
          <p style="color:#6b7280;line-height:1.7;">Review the generated site, customize as needed, and deploy to a live URL in one click. You're live in minutes.</p>
        </div>
      </div>
    </div>
  </div>
</section>`,
  },
];

export default function SectionLibrary({ onAddSection }: SectionLibraryProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return SECTION_TEMPLATES.filter((t) => {
      if (activeCategory !== "all" && t.category !== activeCategory) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [activeCategory, search]);

  return (
    <div className="h-full flex flex-col bg-[#1a1a2e]/95 backdrop-blur-sm border-l border-white/5">
      {/* Header */}
      <div className="px-3 py-3 border-b border-white/5">
        <div className="flex items-center gap-2 mb-2">
          <Plus size={14} className="text-blue-400/60" />
          <span className="text-[11px] font-medium text-white/50 uppercase tracking-wider">
            Add Section
          </span>
          <span className="ml-auto text-[10px] text-white/50">{filtered.length} sections</span>
        </div>
        {/* Search */}
        <div className="relative">
          <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-white/50" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sections..."
            className="w-full bg-white/5 border border-white/10 rounded text-[11px] text-white/80 pl-7 pr-2 py-1.5 outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-1 px-3 py-2 border-b border-white/5">
        {SECTION_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-colors ${
              activeCategory === cat.id
                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                : "bg-white/5 text-white/50 border border-transparent hover:text-white/60 hover:bg-white/10"
            }`}
          >
            <cat.icon size={10} />
            {cat.label}
          </button>
        ))}
      </div>

      {/* Section list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-2 space-y-1.5">
          {filtered.map((template) => (
            <div
              key={template.id}
              className="bg-white/5 rounded border border-white/10 overflow-hidden hover:border-white/20 transition-colors"
            >
              <button
                onClick={() =>
                  setExpandedId(expandedId === template.id ? null : template.id)
                }
                className="flex items-center gap-2 w-full px-3 py-2 text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-medium text-white/70 truncate">
                    {template.name}
                  </div>
                  <div className="text-[9px] text-white/50 truncate">
                    {template.description}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[9px] text-white/50 uppercase">{template.category}</span>
                  {expandedId === template.id ? (
                    <ChevronDown size={10} className="text-white/50" />
                  ) : (
                    <ChevronRight size={10} className="text-white/50" />
                  )}
                </div>
              </button>

              {expandedId === template.id && (
                <div className="px-3 pb-2.5">
                  {/* Mini preview of the HTML structure */}
                  <div className="bg-black/30 rounded border border-white/5 p-2 mb-2 max-h-[120px] overflow-hidden">
                    <pre className="text-[9px] text-blue-300/50 font-mono whitespace-pre-wrap break-all leading-relaxed">
                      {template.html.substring(0, 300)}...
                    </pre>
                  </div>
                  <button
                    onClick={() => onAddSection(template.html)}
                    className="w-full flex items-center justify-center gap-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-[11px] font-medium py-1.5 rounded border border-blue-500/30 transition-colors"
                  >
                    <Plus size={12} />
                    Add to Page
                  </button>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-8 text-white/50 text-[11px]">
              No sections match your search
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
