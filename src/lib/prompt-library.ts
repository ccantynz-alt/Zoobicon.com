import Anthropic from '@anthropic-ai/sdk';

export type PromptModel = 'haiku' | 'sonnet';
export type VariableType = 'text' | 'longtext' | 'number' | 'select';
export type PromptCategory =
  | 'marketing'
  | 'sales'
  | 'support'
  | 'content'
  | 'dev'
  | 'design'
  | 'research';

export interface PromptVariable {
  key: string;
  label: string;
  type: VariableType;
  options?: string[];
  required: boolean;
  placeholder?: string;
}

export interface Prompt {
  id: string;
  name: string;
  category: PromptCategory;
  description: string;
  model: PromptModel;
  systemPrompt: string;
  userTemplate: string;
  variables: PromptVariable[];
  costEstimate: string;
  tags: string[];
}

const SENIOR_RULES =
  'You are a senior practitioner. Write with concrete specifics, real numbers, and plain language. Banned words: revolutionary, unleash, empower, synergy, next-generation, game-changer, leverage, elevate. No filler. No hedging. Output only the deliverable unless told otherwise.';

const v = (
  key: string,
  label: string,
  type: VariableType,
  required = true,
  placeholder?: string,
  options?: string[]
): PromptVariable => ({ key, label, type, required, placeholder, options });

export const PROMPT_LIBRARY: Prompt[] = [
  {
    id: 'cold-outreach-email',
    name: 'Cold Outreach Email',
    category: 'sales',
    description: 'Short, specific cold email that earns a reply.',
    model: 'sonnet',
    systemPrompt: SENIOR_RULES + ' You write cold emails that get 15%+ reply rates.',
    userTemplate:
      'Write a 90-word cold email.\nProspect: {{prospect}}\nTheir company: {{company}}\nMy product: {{product}}\nSpecific value: {{value}}\nCTA: a 15-min call next week.',
    variables: [
      v('prospect', 'Prospect name + role', 'text', true, 'Jane Doe, VP Sales'),
      v('company', 'Their company', 'text', true, 'Acme Inc'),
      v('product', 'Your product', 'text', true, 'Zoobicon AI builder'),
      v('value', 'Specific value', 'longtext', true, 'cuts site build cost by 70%'),
    ],
    costEstimate: '$0.002',
    tags: ['email', 'outbound'],
  },
  {
    id: 'product-description',
    name: 'Product Description Writer',
    category: 'marketing',
    description: 'E-commerce product description with benefits and specs.',
    model: 'sonnet',
    systemPrompt: SENIOR_RULES,
    userTemplate:
      'Write a 120-word product description.\nProduct: {{name}}\nKey features: {{features}}\nTarget buyer: {{buyer}}\nTone: {{tone}}',
    variables: [
      v('name', 'Product name', 'text'),
      v('features', 'Key features', 'longtext'),
      v('buyer', 'Target buyer', 'text'),
      v('tone', 'Tone', 'select', true, undefined, ['premium', 'friendly', 'technical']),
    ],
    costEstimate: '$0.002',
    tags: ['ecommerce', 'copy'],
  },
  {
    id: 'blog-topic-generator',
    name: 'Blog Topic Generator',
    category: 'content',
    description: '20 blog topic ideas with search intent.',
    model: 'haiku',
    systemPrompt: SENIOR_RULES,
    userTemplate:
      'Generate 20 blog post topics for {{niche}}. For each: title, search intent, primary keyword. Audience: {{audience}}.',
    variables: [
      v('niche', 'Niche', 'text'),
      v('audience', 'Audience', 'text'),
    ],
    costEstimate: '$0.001',
    tags: ['seo', 'blog'],
  },
  {
    id: 'support-reply',
    name: 'Customer Support Reply',
    category: 'support',
    description: 'Friendly, accurate support response.',
    model: 'haiku',
    systemPrompt: SENIOR_RULES + ' You are a calm, accurate support rep.',
    userTemplate:
      'Customer message: {{message}}\nKnown facts: {{facts}}\nWrite a reply under 120 words.',
    variables: [
      v('message', 'Customer message', 'longtext'),
      v('facts', 'Known facts', 'longtext'),
    ],
    costEstimate: '$0.001',
    tags: ['support'],
  },
  {
    id: 'tweet-thread',
    name: 'Tweet Thread Builder',
    category: 'content',
    description: '8-tweet thread with hook and CTA.',
    model: 'sonnet',
    systemPrompt: SENIOR_RULES,
    userTemplate:
      'Write an 8-tweet thread.\nTopic: {{topic}}\nAngle: {{angle}}\nCTA: {{cta}}\nNumber each tweet. Hook tweet first.',
    variables: [
      v('topic', 'Topic', 'text'),
      v('angle', 'Angle', 'text'),
      v('cta', 'CTA', 'text'),
    ],
    costEstimate: '$0.002',
    tags: ['social', 'twitter'],
  },
  {
    id: 'press-release',
    name: 'Press Release Draft',
    category: 'marketing',
    description: 'AP-style press release.',
    model: 'sonnet',
    systemPrompt: SENIOR_RULES,
    userTemplate:
      'Write an AP-style press release.\nCompany: {{company}}\nAnnouncement: {{news}}\nQuote from: {{quoteFrom}}\nDate: {{date}}',
    variables: [
      v('company', 'Company', 'text'),
      v('news', 'Announcement', 'longtext'),
      v('quoteFrom', 'Quote attribution', 'text'),
      v('date', 'Date', 'text'),
    ],
    costEstimate: '$0.003',
    tags: ['pr'],
  },
  {
    id: 'job-description',
    name: 'Job Description Writer',
    category: 'content',
    description: 'Inclusive, specific job description.',
    model: 'sonnet',
    systemPrompt: SENIOR_RULES,
    userTemplate:
      'Write a job description.\nRole: {{role}}\nCompany: {{company}}\nMust-have skills: {{skills}}\nLocation: {{location}}\nSalary range: {{salary}}',
    variables: [
      v('role', 'Role', 'text'),
      v('company', 'Company', 'text'),
      v('skills', 'Must-have skills', 'longtext'),
      v('location', 'Location', 'text'),
      v('salary', 'Salary range', 'text'),
    ],
    costEstimate: '$0.003',
    tags: ['hr'],
  },
  {
    id: 'faq-generator',
    name: 'FAQ Generator',
    category: 'content',
    description: '10 FAQ Q&As from product info.',
    model: 'haiku',
    systemPrompt: SENIOR_RULES,
    userTemplate: 'Generate 10 FAQ Q&As for: {{product}}\nKey concerns: {{concerns}}',
    variables: [
      v('product', 'Product', 'text'),
      v('concerns', 'Key concerns', 'longtext'),
    ],
    costEstimate: '$0.001',
    tags: ['faq', 'seo'],
  },
  {
    id: 'meta-description',
    name: 'Meta Description Optimizer',
    category: 'marketing',
    description: 'Click-worthy 155-char meta descriptions.',
    model: 'haiku',
    systemPrompt: SENIOR_RULES,
    userTemplate:
      'Write 5 meta descriptions, each under 155 characters, for:\nPage title: {{title}}\nPage purpose: {{purpose}}\nPrimary keyword: {{keyword}}',
    variables: [
      v('title', 'Page title', 'text'),
      v('purpose', 'Page purpose', 'text'),
      v('keyword', 'Primary keyword', 'text'),
    ],
    costEstimate: '$0.001',
    tags: ['seo'],
  },
  {
    id: 'user-story',
    name: 'User Story Writer',
    category: 'dev',
    description: 'Agile user story with acceptance criteria.',
    model: 'haiku',
    systemPrompt: SENIOR_RULES,
    userTemplate:
      'Write a user story for: {{feature}}\nPersona: {{persona}}\nInclude 5 acceptance criteria.',
    variables: [
      v('feature', 'Feature', 'longtext'),
      v('persona', 'Persona', 'text'),
    ],
    costEstimate: '$0.001',
    tags: ['agile'],
  },
  {
    id: 'sql-from-english',
    name: 'SQL from Plain English',
    category: 'dev',
    description: 'Postgres SQL from a request.',
    model: 'sonnet',
    systemPrompt: SENIOR_RULES + ' Output only SQL in a code block.',
    userTemplate: 'Schema: {{schema}}\nRequest: {{request}}\nDialect: Postgres.',
    variables: [
      v('schema', 'Schema', 'longtext'),
      v('request', 'Request', 'longtext'),
    ],
    costEstimate: '$0.002',
    tags: ['sql'],
  },
  {
    id: 'regex-generator',
    name: 'Regex Generator',
    category: 'dev',
    description: 'Regex with explanation and tests.',
    model: 'haiku',
    systemPrompt: SENIOR_RULES,
    userTemplate:
      'Build a regex.\nFlavor: {{flavor}}\nMatch: {{match}}\nReject: {{reject}}\nReturn regex, plain-English explanation, 5 test cases.',
    variables: [
      v('flavor', 'Flavor', 'select', true, undefined, ['JavaScript', 'Python', 'PCRE']),
      v('match', 'Should match', 'longtext'),
      v('reject', 'Should reject', 'longtext'),
    ],
    costEstimate: '$0.001',
    tags: ['regex'],
  },
  {
    id: 'code-review',
    name: 'Code Review Comments',
    category: 'dev',
    description: 'Senior-level review feedback.',
    model: 'sonnet',
    systemPrompt: SENIOR_RULES + ' You review like a staff engineer.',
    userTemplate:
      'Review this code. Flag bugs, security issues, perf problems. Suggest fixes inline.\n\n```\n{{code}}\n```',
    variables: [v('code', 'Code', 'longtext')],
    costEstimate: '$0.004',
    tags: ['review'],
  },
  {
    id: 'bug-repro',
    name: 'Bug Report Reproducer',
    category: 'dev',
    description: 'Convert vague bug into clean repro.',
    model: 'haiku',
    systemPrompt: SENIOR_RULES,
    userTemplate:
      'Turn this into a clean bug report with: title, env, steps, expected, actual, suspected cause.\n\n{{report}}',
    variables: [v('report', 'Raw report', 'longtext')],
    costEstimate: '$0.001',
    tags: ['qa'],
  },
  {
    id: 'marketing-headlines',
    name: 'Marketing Headlines (10 variants)',
    category: 'marketing',
    description: '10 distinct headline angles.',
    model: 'haiku',
    systemPrompt: SENIOR_RULES,
    userTemplate:
      'Write 10 headlines for {{product}}. Audience: {{audience}}. Mix angles: outcome, fear, curiosity, social proof, contrarian.',
    variables: [
      v('product', 'Product', 'text'),
      v('audience', 'Audience', 'text'),
    ],
    costEstimate: '$0.001',
    tags: ['copy'],
  },
  {
    id: 'refund-reply',
    name: 'Refund Reply (empathetic)',
    category: 'support',
    description: 'Refund response that retains goodwill.',
    model: 'haiku',
    systemPrompt: SENIOR_RULES,
    userTemplate:
      'Write a refund response.\nCustomer reason: {{reason}}\nPolicy: {{policy}}\nApproved: {{approved}}',
    variables: [
      v('reason', 'Reason', 'longtext'),
      v('policy', 'Policy', 'text'),
      v('approved', 'Approved?', 'select', true, undefined, ['yes', 'no', 'partial']),
    ],
    costEstimate: '$0.001',
    tags: ['support'],
  },
  {
    id: 'discovery-questions',
    name: 'Sales Discovery Questions',
    category: 'sales',
    description: '15 discovery questions tailored to ICP.',
    model: 'haiku',
    systemPrompt: SENIOR_RULES,
    userTemplate:
      '15 sales discovery questions for selling {{product}} to {{icp}}. Group by: pain, budget, timing, authority.',
    variables: [
      v('product', 'Product', 'text'),
      v('icp', 'ICP', 'text'),
    ],
    costEstimate: '$0.001',
    tags: ['sales'],
  },
  {
    id: 'onboarding-sequence',
    name: 'Onboarding Email Sequence (5)',
    category: 'marketing',
    description: '5-email onboarding drip.',
    model: 'sonnet',
    systemPrompt: SENIOR_RULES,
    userTemplate:
      'Write a 5-email onboarding sequence for {{product}}.\nGoal: {{goal}}\nDay schedule: 0, 1, 3, 7, 14.',
    variables: [
      v('product', 'Product', 'text'),
      v('goal', 'Goal', 'text'),
    ],
    costEstimate: '$0.004',
    tags: ['email', 'lifecycle'],
  },
  {
    id: 'landing-page-copy',
    name: 'Landing Page Copy',
    category: 'marketing',
    description: 'Hero, features, social proof, CTA.',
    model: 'sonnet',
    systemPrompt: SENIOR_RULES,
    userTemplate:
      'Write landing page copy.\nProduct: {{product}}\nAudience: {{audience}}\nTop 3 outcomes: {{outcomes}}\nSections: hero, 3 features, 3 testimonials (placeholders), FAQ, CTA.',
    variables: [
      v('product', 'Product', 'text'),
      v('audience', 'Audience', 'text'),
      v('outcomes', 'Top outcomes', 'longtext'),
    ],
    costEstimate: '$0.005',
    tags: ['landing'],
  },
  {
    id: 'pricing-page-copy',
    name: 'Pricing Page Copy',
    category: 'marketing',
    description: 'Tier copy with anchoring.',
    model: 'sonnet',
    systemPrompt: SENIOR_RULES,
    userTemplate:
      'Write pricing page copy with 3 tiers for {{product}}.\nPrices: {{prices}}\nKey features per tier: {{features}}',
    variables: [
      v('product', 'Product', 'text'),
      v('prices', 'Prices', 'text'),
      v('features', 'Features per tier', 'longtext'),
    ],
    costEstimate: '$0.003',
    tags: ['pricing'],
  },
  {
    id: 'about-us',
    name: 'About Us Page',
    category: 'content',
    description: 'Honest, specific About page.',
    model: 'sonnet',
    systemPrompt: SENIOR_RULES,
    userTemplate:
      'Write an About Us page for {{company}}.\nFounded: {{founded}}\nStory: {{story}}\nValues: {{values}}',
    variables: [
      v('company', 'Company', 'text'),
      v('founded', 'Founded', 'text'),
      v('story', 'Story', 'longtext'),
      v('values', 'Values', 'longtext'),
    ],
    costEstimate: '$0.003',
    tags: ['about'],
  },
  {
    id: 'case-study-outline',
    name: 'Case Study Outline',
    category: 'content',
    description: 'Customer case study structure.',
    model: 'haiku',
    systemPrompt: SENIOR_RULES,
    userTemplate:
      'Outline a case study.\nCustomer: {{customer}}\nProblem: {{problem}}\nSolution: {{solution}}\nResults: {{results}}',
    variables: [
      v('customer', 'Customer', 'text'),
      v('problem', 'Problem', 'longtext'),
      v('solution', 'Solution', 'longtext'),
      v('results', 'Results', 'longtext'),
    ],
    costEstimate: '$0.001',
    tags: ['case-study'],
  },
  {
    id: 'competitor-analysis',
    name: 'Competitor Analysis',
    category: 'research',
    description: 'Side-by-side competitor breakdown.',
    model: 'sonnet',
    systemPrompt: SENIOR_RULES,
    userTemplate:
      'Analyze {{competitors}} versus {{ourProduct}}. Cover features, pricing, positioning, gaps. Output as a table.',
    variables: [
      v('competitors', 'Competitors', 'longtext'),
      v('ourProduct', 'Our product', 'text'),
    ],
    costEstimate: '$0.004',
    tags: ['research'],
  },
  {
    id: 'swot',
    name: 'SWOT Analysis',
    category: 'research',
    description: 'Strengths, weaknesses, opportunities, threats.',
    model: 'haiku',
    systemPrompt: SENIOR_RULES,
    userTemplate: 'SWOT analysis for {{company}}. Context: {{context}}',
    variables: [
      v('company', 'Company', 'text'),
      v('context', 'Context', 'longtext'),
    ],
    costEstimate: '$0.001',
    tags: ['strategy'],
  },
  {
    id: 'customer-persona',
    name: 'Customer Persona',
    category: 'research',
    description: 'Detailed buyer persona.',
    model: 'sonnet',
    systemPrompt: SENIOR_RULES,
    userTemplate:
      'Create a buyer persona for {{product}}. Include: demographics, role, goals, pains, objections, channels.',
    variables: [v('product', 'Product', 'text')],
    costEstimate: '$0.002',
    tags: ['persona'],
  },
  {
    id: 'brand-voice',
    name: 'Brand Voice Guide',
    category: 'design',
    description: 'Voice, tone, do/don\'t list.',
    model: 'sonnet',
    systemPrompt: SENIOR_RULES,
    userTemplate:
      'Write a brand voice guide for {{brand}}.\nPersonality traits: {{traits}}\nAudience: {{audience}}\nInclude do/don\'t examples.',
    variables: [
      v('brand', 'Brand', 'text'),
      v('traits', 'Personality traits', 'text'),
      v('audience', 'Audience', 'text'),
    ],
    costEstimate: '$0.003',
    tags: ['brand'],
  },
  {
    id: 'naming-brainstorm',
    name: 'Naming Brainstorm',
    category: 'design',
    description: '25 brandable name candidates.',
    model: 'haiku',
    systemPrompt: SENIOR_RULES,
    userTemplate:
      '25 brandable names for {{description}}. Mix: invented, compound, metaphor, classical. Note .com viability for each.',
    variables: [v('description', 'Description', 'longtext')],
    costEstimate: '$0.001',
    tags: ['naming'],
  },
  {
    id: 'tagline-generator',
    name: 'Tagline Generator',
    category: 'design',
    description: '15 taglines across angles.',
    model: 'haiku',
    systemPrompt: SENIOR_RULES,
    userTemplate: '15 taglines for {{product}}. Promise: {{promise}}',
    variables: [
      v('product', 'Product', 'text'),
      v('promise', 'Promise', 'text'),
    ],
    costEstimate: '$0.001',
    tags: ['tagline'],
  },
  {
    id: 'investor-pitch-email',
    name: 'Investor Pitch Email',
    category: 'sales',
    description: '150-word investor intro.',
    model: 'sonnet',
    systemPrompt: SENIOR_RULES,
    userTemplate:
      '150-word investor email.\nCompany: {{company}}\nTraction: {{traction}}\nRound: {{round}}\nAsk: 30-min call.',
    variables: [
      v('company', 'Company', 'text'),
      v('traction', 'Traction', 'longtext'),
      v('round', 'Round', 'text'),
    ],
    costEstimate: '$0.002',
    tags: ['fundraising'],
  },
  {
    id: 'apology-email',
    name: 'Apology Email',
    category: 'support',
    description: 'Sincere apology with remedy.',
    model: 'haiku',
    systemPrompt: SENIOR_RULES,
    userTemplate:
      'Write an apology email.\nWhat happened: {{incident}}\nWho was affected: {{affected}}\nRemedy: {{remedy}}',
    variables: [
      v('incident', 'Incident', 'longtext'),
      v('affected', 'Affected', 'text'),
      v('remedy', 'Remedy', 'text'),
    ],
    costEstimate: '$0.001',
    tags: ['support'],
  },
  {
    id: 'survey-questions',
    name: 'Survey Question Builder',
    category: 'research',
    description: '12 unbiased survey questions.',
    model: 'haiku',
    systemPrompt: SENIOR_RULES,
    userTemplate:
      '12 unbiased survey questions to learn: {{goal}}. Mix multiple-choice, scale, and open. Audience: {{audience}}.',
    variables: [
      v('goal', 'Goal', 'longtext'),
      v('audience', 'Audience', 'text'),
    ],
    costEstimate: '$0.001',
    tags: ['research'],
  },
];

export function getPrompt(id: string): Prompt | undefined {
  return PROMPT_LIBRARY.find((p) => p.id === id);
}

export function listPrompts(category?: PromptCategory): Prompt[] {
  if (!category) return PROMPT_LIBRARY;
  return PROMPT_LIBRARY.filter((p) => p.category === category);
}

function fillTemplate(template: string, variables: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const val = variables[key];
    return val === undefined || val === null ? '' : String(val);
  });
}

export interface RunResult {
  text: string;
  tokens: { input: number; output: number };
}

const MODEL_IDS: Record<PromptModel, string> = {
  haiku: 'claude-haiku-4-5',
  sonnet: 'claude-sonnet-4-5',
};

export async function runPrompt(
  id: string,
  variables: Record<string, string | number>
): Promise<RunResult> {
  const prompt = getPrompt(id);
  if (!prompt) {
    throw new Error(`Prompt not found: ${id}`);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const err = new Error(
      'ANTHROPIC_API_KEY is not configured. Set it in your environment to run prompts.'
    ) as Error & { status?: number };
    err.status = 503;
    throw err;
  }

  for (const variable of prompt.variables) {
    if (variable.required && (variables[variable.key] === undefined || variables[variable.key] === '')) {
      throw new Error(`Missing required variable: ${variable.key}`);
    }
  }

  const userMessage = fillTemplate(prompt.userTemplate, variables);
  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: MODEL_IDS[prompt.model],
    max_tokens: 2048,
    system: prompt.systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const text = response.content
    .map((block) => (block.type === 'text' ? block.text : ''))
    .join('')
    .trim();

  return {
    text,
    tokens: {
      input: response.usage.input_tokens,
      output: response.usage.output_tokens,
    },
  };
}

export function estimateCost(model: PromptModel, inputTokens: number, outputTokens: number): number {
  const rates: Record<PromptModel, { input: number; output: number }> = {
    haiku: { input: 0.8 / 1_000_000, output: 4 / 1_000_000 },
    sonnet: { input: 3 / 1_000_000, output: 15 / 1_000_000 },
  };
  const r = rates[model];
  return inputTokens * r.input + outputTokens * r.output;
}
