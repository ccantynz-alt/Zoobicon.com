'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  Loader2,
  X,
  Sparkles,
  Globe,
  Rocket,
  Mail,
  Send,
} from 'lucide-react';

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

type StepKey = 'register' | 'deploy' | 'mailbox' | 'email';
type StepStatus = 'pending' | 'running' | 'done' | 'error';

interface StepDef {
  key: StepKey;
  label: string;
  icon: typeof Globe;
}

const STEPS: StepDef[] = [
  { key: 'register', label: 'Register domain', icon: Globe },
  { key: 'deploy', label: 'Deploy website', icon: Rocket },
  { key: 'mailbox', label: 'Create mailbox', icon: Mail },
  { key: 'email', label: 'Send welcome email', icon: Send },
];

export default function DomainHookModal({
  isOpen,
  onClose,
  businessName,
  industry,
  siteFiles,
  contactEmail,
  onComplete,
}: DomainHookModalProps) {
  const [suggestions, setSuggestions] = useState<DomainSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [stepStatus, setStepStatus] = useState<Record<StepKey, StepStatus>>({
    register: 'pending',
    deploy: 'pending',
    mailbox: 'pending',
    email: 'pending',
  });
  const [finalResult, setFinalResult] = useState<DomainHookCompleteResult | null>(null);
  const [completeError, setCompleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    const fetchSuggestions = async (): Promise<void> => {
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
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          setSuggestError(message);
        }
      } finally {
        if (!cancelled) setLoadingSuggestions(false);
      }
    };
    void fetchSuggestions();
    return () => {
      cancelled = true;
    };
  }, [isOpen, businessName, industry]);

  const runComplete = async (domain: string): Promise<void> => {
    setSelected(domain);
    setRunning(true);
    setCompleteError(null);
    setFinalResult(null);
    setStepStatus({
      register: 'running',
      deploy: 'pending',
      mailbox: 'pending',
      email: 'pending',
    });

    // Visual progression while real call runs
    const advance = (key: StepKey, next: StepKey | null): void => {
      setStepStatus((prev) => ({
        ...prev,
        [key]: 'done',
        ...(next ? { [next]: 'running' as StepStatus } : {}),
      }));
    };
    const t1 = setTimeout(() => advance('register', 'deploy'), 1200);
    const t2 = setTimeout(() => advance('deploy', 'mailbox'), 2600);
    const t3 = setTimeout(() => advance('mailbox', 'email'), 4000);

    try {
      const res = await fetch('/api/domain-hook/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: contactEmail,
          chosenDomain: domain,
          siteFiles,
          contactEmail,
        }),
      });
      const data = (await res.json()) as DomainHookCompleteResult;
      [t1, t2, t3].forEach(clearTimeout);
      if (!res.ok || data.success === false) {
        const message = data.error || `HTTP ${res.status}`;
        setStepStatus((prev) => {
          const next = { ...prev };
          (Object.keys(next) as StepKey[]).forEach((k) => {
            if (next[k] === 'running' || next[k] === 'pending') next[k] = 'error';
          });
          return next;
        });
        setCompleteError(message);
        return;
      }
      setStepStatus({
        register: 'done',
        deploy: 'done',
        mailbox: 'done',
        email: 'done',
      });
      setFinalResult(data);
      onComplete(data);
    } catch (err) {
      [t1, t2, t3].forEach(clearTimeout);
      const message = err instanceof Error ? err.message : 'Unknown error';
      setCompleteError(message);
    } finally {
      setRunning(false);
    }
  };

  const handleClose = (): void => {
    if (running) return;
    setSelected(null);
    setFinalResult(null);
    setCompleteError(null);
    setStepStatus({
      register: 'pending',
      deploy: 'pending',
      mailbox: 'pending',
      email: 'pending',
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="relative w-full max-w-2xl rounded-2xl bg-gradient-to-b from-gray-900 to-navy-950 border border-white/10 shadow-2xl overflow-hidden"
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleClose}
              disabled={running}
              className="absolute top-4 right-4 p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-8">
              {!finalResult && !selected && (
                <>
                  <div className="flex items-center gap-3 mb-2">
                    <Sparkles className="w-6 h-6 text-stone-400" />
                    <h2 className="text-2xl font-bold tracking-tight text-white">
                      Pick your domain
                    </h2>
                  </div>
                  <p className="text-white/60 mb-6">
                    AI-curated domains for{' '}
                    <span className="text-white font-medium">{businessName}</span>
                  </p>

                  {loadingSuggestions && (
                    <div className="space-y-3">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/5"
                        >
                          <Loader2 className="w-5 h-5 text-stone-400 animate-spin" />
                          <span className="text-white/40">Checking availability...</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {suggestError && (
                    <div className="p-4 rounded-xl bg-stone-500/10 border border-stone-500/30 text-stone-300">
                      Couldn&apos;t load suggestions: {suggestError}
                    </div>
                  )}

                  {!loadingSuggestions && !suggestError && suggestions.length === 0 && (
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-white/60">
                      No suggestions returned. Try a different business name.
                    </div>
                  )}

                  <div className="space-y-3">
                    {suggestions.map((s) => (
                      <button
                        key={s.domain}
                        onClick={() => void runComplete(s.domain)}
                        className="group w-full flex items-center justify-between gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-stone-400/60 hover:bg-white/10 transition text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Globe className="w-5 h-5 text-stone-400 flex-shrink-0" />
                          <span className="text-white font-medium truncate">
                            {s.domain}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {typeof s.price === 'number' && (
                            <span className="text-white/60 text-sm">${s.price}/yr</span>
                          )}
                          {s.available === true && (
                            <span className="px-2 py-1 rounded-md text-xs font-semibold bg-stone-500/20 text-stone-300 border border-stone-500/30">
                              Available
                            </span>
                          )}
                          {s.available === false && (
                            <span className="px-2 py-1 rounded-md text-xs font-semibold bg-stone-500/20 text-stone-300 border border-stone-500/30">
                              Taken
                            </span>
                          )}
                          {s.available === undefined && (
                            <Loader2 className="w-4 h-4 text-white/40 animate-spin" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {selected && !finalResult && (
                <>
                  <div className="flex items-center gap-3 mb-2">
                    <Loader2 className="w-6 h-6 text-stone-400 animate-spin" />
                    <h2 className="text-2xl font-bold tracking-tight text-white">
                      Setting up {selected}
                    </h2>
                  </div>
                  <p className="text-white/60 mb-8">
                    Hang tight — building your business in real time.
                  </p>

                  <div className="space-y-3">
                    {STEPS.map(({ key, label, icon: Icon }) => {
                      const status = stepStatus[key];
                      return (
                        <div
                          key={key}
                          className={`flex items-center gap-4 p-4 rounded-xl border transition ${
                            status === 'done'
                              ? 'bg-stone-500/10 border-stone-500/30'
                              : status === 'running'
                              ? 'bg-stone-500/10 border-stone-500/40'
                              : status === 'error'
                              ? 'bg-stone-500/10 border-stone-500/30'
                              : 'bg-white/5 border-white/10'
                          }`}
                        >
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                            {status === 'done' ? (
                              <Check className="w-5 h-5 text-stone-400" />
                            ) : status === 'running' ? (
                              <Loader2 className="w-5 h-5 text-stone-400 animate-spin" />
                            ) : status === 'error' ? (
                              <X className="w-5 h-5 text-stone-400" />
                            ) : (
                              <Icon className="w-5 h-5 text-white/40" />
                            )}
                          </div>
                          <span
                            className={`font-medium ${
                              status === 'pending' ? 'text-white/40' : 'text-white'
                            }`}
                          >
                            {label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {completeError && (
                    <div className="mt-6 p-4 rounded-xl bg-stone-500/10 border border-stone-500/30 text-stone-300">
                      {completeError}
                    </div>
                  )}
                </>
              )}

              {finalResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-6"
                >
                  <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-stone-400 via-stone-400 to-stone-500 flex items-center justify-center mb-6 shadow-lg shadow-stone-500/30">
                    <Check className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-stone-200 to-stone-200 bg-clip-text text-transparent mb-3">
                    You&apos;re live!
                  </h2>
                  <p className="text-white/70 mb-6">
                    {finalResult.domain || selected} is registered, deployed, and ready.
                  </p>
                  <div className="space-y-2 text-left max-w-md mx-auto mb-8">
                    {finalResult.siteUrl && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10">
                        <Globe className="w-4 h-4 text-stone-400" />
                        <span className="text-white/80 text-sm truncate">
                          {finalResult.siteUrl}
                        </span>
                      </div>
                    )}
                    {finalResult.mailbox && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10">
                        <Mail className="w-4 h-4 text-stone-400" />
                        <span className="text-white/80 text-sm truncate">
                          {finalResult.mailbox}
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleClose}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-stone-500 to-stone-500 text-white font-semibold hover:opacity-90 transition"
                  >
                    Done
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
