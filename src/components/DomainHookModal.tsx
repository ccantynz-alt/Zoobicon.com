'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, X, Sparkles, Globe, ArrowRight, ShieldCheck } from 'lucide-react';

interface DomainSuggestion {
  domain: string;
  available?: boolean;
  price?: number;
  tld?: string;
}

interface SiteFile {
  path: string;
  content: string;
}

export interface DomainHookCompleteResult {
  success: boolean;
  steps?: Record<string, unknown>;
  domain?: string;
  siteUrl?: string;
  mailbox?: string;
  error?: string;
}

interface DomainHookModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessName: string;
  industry?: string;
  siteFiles: Record<string, string> | SiteFile[];
  contactEmail: string;
  onComplete: (result: DomainHookCompleteResult) => void;
}

export default function DomainHookModal({
  isOpen,
  onClose,
  businessName,
  industry,
  contactEmail,
}: DomainHookModalProps) {
  const [suggestions, setSuggestions] = useState<DomainSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    const load = async (): Promise<void> => {
      setLoadingSuggestions(true);
      setSuggestError(null);
      setSuggestions([]);
      try {
        const res = await fetch('/api/domain-hook/suggest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ businessName, industry }),
        });
        const data = (await res.json()) as { suggestions?: DomainSuggestion[]; error?: string };
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
        if (!cancelled) setSuggestions((data.suggestions || []).slice(0, 5));
      } catch (err) {
        if (!cancelled) setSuggestError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        if (!cancelled) setLoadingSuggestions(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [isOpen, businessName, industry]);

  const handleSelect = async (s: DomainSuggestion): Promise<void> => {
    if (s.available === false || checkingOut) return;
    setCheckingOut(s.domain);
    setCheckoutError(null);

    // Split "mybusiness.com" → domain="mybusiness", tld="com"
    const dot = s.domain.indexOf('.');
    const domainName = dot > -1 ? s.domain.slice(0, dot) : s.domain;
    const tld = dot > -1 ? s.domain.slice(dot + 1) : (s.tld ?? 'com');
    const price = s.price ?? 14.99;

    try {
      const res = await fetch('/api/domains/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domains: [{ domain: domainName, tld, price }],
          email: contactEmail || undefined,
        }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error || 'Checkout unavailable');
      window.location.href = data.url;
    } catch (err) {
      setCheckingOut(null);
      setCheckoutError(err instanceof Error ? err.message : 'Could not start checkout');
    }
  };

  const handleClose = (): void => {
    if (checkingOut) return;
    setSuggestions([]);
    setCheckoutError(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(10,10,11,0.42)', backdropFilter: 'blur(4px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="relative w-full max-w-[480px] rounded-[24px] overflow-hidden"
            style={{
              background: 'var(--paper-elevated)',
              border: '1px solid var(--rule)',
              boxShadow: '0 32px 80px -16px rgba(10,10,11,0.22)',
            }}
            initial={{ scale: 0.96, y: 14, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 14, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 340 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={handleClose}
              disabled={!!checkingOut}
              className="absolute top-5 right-5 p-1.5 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ color: 'var(--ink-muted)' }}
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="px-8 pt-8 pb-5" style={{ borderBottom: '1px solid var(--rule)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4" style={{ color: 'var(--gold-deep)' }} />
                <span
                  className="text-[10px] font-semibold uppercase tracking-[0.2em]"
                  style={{ color: 'var(--gold-deep)' }}
                >
                  One more step
                </span>
              </div>
              <h2
                className="text-[21px] font-semibold tracking-[-0.022em] leading-tight"
                style={{ color: 'var(--ink)' }}
              >
                Your site is ready.{' '}
                <span className="display-italic font-normal" style={{ color: 'var(--gold-deep)' }}>
                  Claim a domain.
                </span>
              </h2>
              <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
                AI-matched domains for{' '}
                <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{businessName}</span>.
                {' '}Buy with one click — registered via OpenSRS.
              </p>
            </div>

            {/* Domain list */}
            <div className="px-8 py-6">
              {loadingSuggestions && (
                <div className="space-y-2">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-4 py-3.5 rounded-xl"
                      style={{ border: '1px solid var(--rule)', background: 'var(--paper)' }}
                    >
                      <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" style={{ color: 'var(--ink-muted)' }} />
                      <span className="text-[13px]" style={{ color: 'var(--ink-muted)' }}>
                        Checking availability…
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {suggestError && (
                <div
                  className="p-4 rounded-xl text-[13px]"
                  style={{
                    border: '1px solid rgba(239,68,68,0.18)',
                    background: 'rgba(239,68,68,0.04)',
                    color: 'var(--ink-secondary)',
                  }}
                >
                  Could not load suggestions: {suggestError}
                </div>
              )}

              {!loadingSuggestions && !suggestError && suggestions.length === 0 && (
                <div
                  className="p-4 rounded-xl text-[13px]"
                  style={{ border: '1px solid var(--rule)', color: 'var(--ink-muted)' }}
                >
                  No suggestions returned. Try a different business name.
                </div>
              )}

              <div className="space-y-2">
                {suggestions.map((s) => {
                  const taken = s.available === false;
                  const isThisLoading = checkingOut === s.domain;
                  const disabled = taken || (!!checkingOut && !isThisLoading);

                  return (
                    <button
                      key={s.domain}
                      onClick={() => void handleSelect(s)}
                      disabled={disabled}
                      className="group w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl transition-all text-left"
                      style={{
                        border: `1px solid ${isThisLoading ? 'var(--gold-deep)' : 'var(--rule)'}`,
                        background: isThisLoading ? 'rgba(201,169,97,0.06)' : 'var(--paper)',
                        opacity: disabled && !isThisLoading ? 0.45 : 1,
                        cursor: disabled ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Globe
                          className="w-4 h-4 flex-shrink-0"
                          style={{ color: taken ? 'var(--ink-muted)' : 'var(--gold-deep)' }}
                        />
                        <span
                          className="text-[14px] font-medium truncate"
                          style={{ color: taken ? 'var(--ink-muted)' : 'var(--ink)' }}
                        >
                          {s.domain}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {typeof s.price === 'number' && !taken && (
                          <span className="text-[13px]" style={{ color: 'var(--ink-secondary)' }}>
                            ${s.price}/yr
                          </span>
                        )}

                        {taken ? (
                          <span
                            className="px-2 py-0.5 rounded-md text-[11px] font-medium"
                            style={{ border: '1px solid var(--rule)', color: 'var(--ink-muted)' }}
                          >
                            Taken
                          </span>
                        ) : s.available === undefined ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: 'var(--ink-muted)' }} />
                        ) : isThisLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: 'var(--gold-deep)' }} />
                        ) : (
                          <>
                            <span
                              className="px-2 py-0.5 rounded-md text-[11px] font-medium"
                              style={{
                                border: '1px solid rgba(16,185,129,0.25)',
                                background: 'rgba(16,185,129,0.06)',
                                color: 'rgb(5,122,85)',
                              }}
                            >
                              Available
                            </span>
                            <ArrowRight
                              className="w-4 h-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
                              style={{ color: 'var(--gold-deep)' }}
                            />
                          </>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {checkoutError && (
                <div
                  className="mt-4 p-3 rounded-xl text-[13px]"
                  style={{
                    border: '1px solid rgba(239,68,68,0.18)',
                    background: 'rgba(239,68,68,0.04)',
                    color: 'var(--ink-secondary)',
                  }}
                >
                  {checkoutError}
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              className="px-8 py-4 flex items-center justify-between"
              style={{ borderTop: '1px solid var(--rule)' }}
            >
              <button
                onClick={handleClose}
                disabled={!!checkingOut}
                className="text-[13px] transition-colors disabled:opacity-30"
                style={{ color: 'var(--ink-muted)' }}
              >
                Skip for now
              </button>
              <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                <ShieldCheck className="w-3 h-3" />
                Secured via Stripe
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
