import { promises as dns } from 'dns';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const DISPOSABLE_DOMAINS = new Set<string>([
  'mailinator.com', 'tempmail.com', 'temp-mail.org', '10minutemail.com',
  'guerrillamail.com', 'guerrillamail.net', 'yopmail.com', 'trashmail.com',
  'throwawaymail.com', 'fakeinbox.com', 'getnada.com', 'maildrop.cc',
  'sharklasers.com', 'mintemail.com', 'mohmal.com', 'dispostable.com',
  'mailnesia.com', 'mytemp.email', 'tempr.email', 'mailcatch.com',
  'spambog.com', 'spam4.me', 'mailnull.com', 'tempinbox.com',
  'emailondeck.com', 'fakemail.net', 'mailtemp.info', 'mailbox.org',
  'inboxbear.com', 'wegwerfemail.de', 'tempmailo.com', 'tmpmail.org',
  'mailpoof.com', 'burnermail.io',
]);

export function validateSyntax(email: string): boolean {
  return typeof email === 'string' && email.length <= 254 && EMAIL_REGEX.test(email);
}

export interface MxResult { ok: boolean; records: string[] }
export async function checkMxRecords(domain: string): Promise<MxResult> {
  try {
    const records = await dns.resolveMx(domain);
    const sorted = records.sort((a, b) => a.priority - b.priority).map(r => r.exchange);
    return { ok: sorted.length > 0, records: sorted };
  } catch {
    return { ok: false, records: [] };
  }
}

export interface SpfResult { ok: boolean; record?: string }
export async function checkSpfRecord(domain: string): Promise<SpfResult> {
  try {
    const txts = await dns.resolveTxt(domain);
    for (const chunks of txts) {
      const joined = chunks.join('');
      if (joined.toLowerCase().startsWith('v=spf1')) {
        return { ok: true, record: joined };
      }
    }
    return { ok: false };
  } catch {
    return { ok: false };
  }
}

export interface DmarcResult { ok: boolean; record?: string }
export async function checkDmarcRecord(domain: string): Promise<DmarcResult> {
  try {
    const txts = await dns.resolveTxt(`_dmarc.${domain}`);
    for (const chunks of txts) {
      const joined = chunks.join('');
      if (joined.toLowerCase().startsWith('v=dmarc1')) {
        return { ok: true, record: joined };
      }
    }
    return { ok: false };
  } catch {
    return { ok: false };
  }
}

export interface DkimResult { ok: boolean; record?: string }
export async function checkDkim(domain: string, selector: string = 'default'): Promise<DkimResult> {
  try {
    const txts = await dns.resolveTxt(`${selector}._domainkey.${domain}`);
    for (const chunks of txts) {
      const joined = chunks.join('');
      if (joined.toLowerCase().includes('v=dkim1') || joined.toLowerCase().includes('k=')) {
        return { ok: true, record: joined };
      }
    }
    return { ok: false };
  } catch {
    return { ok: false };
  }
}

export interface DeliverabilityResult {
  valid: boolean;
  syntaxOk: boolean;
  mxOk: boolean;
  spfOk: boolean;
  dmarcOk: boolean;
  dkimOk: boolean;
  disposable: boolean;
  score: number;
  issues: string[];
  mxRecords: string[];
  domain: string;
}

export async function validateEmailDeliverability(email: string): Promise<DeliverabilityResult> {
  const issues: string[] = [];
  const syntaxOk = validateSyntax(email);
  const domain = syntaxOk ? email.split('@')[1].toLowerCase() : '';

  if (!syntaxOk) {
    issues.push('Invalid email syntax');
    return {
      valid: false, syntaxOk: false, mxOk: false, spfOk: false, dmarcOk: false,
      dkimOk: false, disposable: false, score: 0, issues, mxRecords: [], domain,
    };
  }

  const disposable = DISPOSABLE_DOMAINS.has(domain);
  if (disposable) issues.push('Disposable/throwaway email domain');

  const [mxR, spfR, dmarcR, dkimR] = await Promise.allSettled([
    checkMxRecords(domain),
    checkSpfRecord(domain),
    checkDmarcRecord(domain),
    checkDkim(domain),
  ]);

  const mx: MxResult = mxR.status === 'fulfilled' ? mxR.value : { ok: false, records: [] };
  const spf: SpfResult = spfR.status === 'fulfilled' ? spfR.value : { ok: false };
  const dmarc: DmarcResult = dmarcR.status === 'fulfilled' ? dmarcR.value : { ok: false };
  const dkim: DkimResult = dkimR.status === 'fulfilled' ? dkimR.value : { ok: false };

  if (!mx.ok) issues.push('No MX records found — domain cannot receive email');
  if (!spf.ok) issues.push('No SPF record — sender authentication missing');
  if (!dmarc.ok) issues.push('No DMARC record — domain unprotected from spoofing');
  if (!dkim.ok) issues.push('No DKIM record found at default selector');

  let score = 0;
  if (syntaxOk) score += 20;
  if (mx.ok) score += 20;
  if (spf.ok) score += 20;
  if (dmarc.ok) score += 20;
  if (dkim.ok) score += 20;
  if (disposable) score = Math.max(0, score - 30);

  return {
    valid: syntaxOk && mx.ok && !disposable,
    syntaxOk,
    mxOk: mx.ok,
    spfOk: spf.ok,
    dmarcOk: dmarc.ok,
    dkimOk: dkim.ok,
    disposable,
    score,
    issues,
    mxRecords: mx.records,
    domain,
  };
}
