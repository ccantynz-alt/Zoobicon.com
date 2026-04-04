"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Rocket,
  Check,
  Copy,
  ExternalLink,
  Globe,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DeployState = "idle" | "naming" | "deploying" | "deployed" | "error";

interface DeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeploy: (siteName: string) => Promise<{ url: string; slug: string; deployTimeMs?: number } | null>;
  defaultName?: string;
  deployState?: DeployState;
  deployUrl?: string;
  deployError?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DeployModal({
  isOpen,
  onClose,
  onDeploy,
  defaultName = "",
  deployState: externalState,
  deployUrl: externalUrl,
  deployError: externalError,
}: DeployModalProps) {
  const [siteName, setSiteName] = useState(defaultName);
  const [state, setState] = useState<DeployState>("naming");
  const [url, setUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");
  const [deployTime, setDeployTime] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Sync with external state if provided
  useEffect(() => {
    if (externalState) setState(externalState);
    if (externalUrl) setUrl(externalUrl);
    if (externalError) setError(externalError);
  }, [externalState, externalUrl, externalError]);

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setSiteName(defaultName);
      if (!externalState || externalState === "idle") {
        setState("naming");
      }
      setError("");
      setCopied(false);
      // Focus input after animation
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen, defaultName, externalState]);

  // Escape to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && state !== "deploying") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, state, onClose]);

  const handleDeploy = useCallback(async () => {
    const name = siteName.trim() || "My Site";
    setState("deploying");
    setError("");

    try {
      const result = await onDeploy(name);
      if (result) {
        setUrl(result.url);
        setSlug(result.slug);
        setDeployTime(result.deployTimeMs ?? null);
        setState("deployed");
      } else {
        setState("error");
        setError("Deploy failed — please try again");
      }
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Deploy failed");
    }
  }, [siteName, onDeploy]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [url]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === backdropRef.current && state !== "deploying") onClose();
    },
    [onClose, state]
  );

  const previewSlug = siteName.trim()
    ? siteName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40)
    : "my-site";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={backdropRef}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleBackdropClick}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a12] shadow-2xl"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Top accent */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500 to-transparent" />

            {/* Close button */}
            {state !== "deploying" && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            )}

            <div className="p-6">
              {/* ---- NAMING STATE ---- */}
              {state === "naming" && (
                <>
                  <div className="text-center mb-5">
                    <motion.div
                      className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 ring-1 ring-amber-500/30"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.1, damping: 15 }}
                    >
                      <Rocket className="h-5 w-5 text-amber-400" />
                    </motion.div>
                    <h2 className="text-xl font-bold text-white">Deploy Your Site</h2>
                    <p className="mt-1 text-sm text-zinc-400">
                      Your site will be live instantly at zoobicon.sh
                    </p>
                  </div>

                  {/* Site name input */}
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                      Site Name
                    </label>
                    <input
                      ref={inputRef}
                      type="text"
                      value={siteName}
                      onChange={(e) => setSiteName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleDeploy(); }}
                      placeholder="My Awesome Site"
                      maxLength={100}
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/20 transition-all"
                    />
                  </div>

                  {/* URL preview */}
                  <div className="mb-5 flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5">
                    <Globe className="h-4 w-4 text-zinc-500 flex-shrink-0" />
                    <span className="text-xs text-zinc-500 truncate">
                      https://<span className="text-amber-400/80 font-medium">{previewSlug}</span>.zoobicon.sh
                    </span>
                  </div>

                  {/* Deploy button */}
                  <button
                    onClick={handleDeploy}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-400 hover:to-amber-500 shadow-lg shadow-amber-500/20 active:scale-[0.98]"
                  >
                    <Rocket className="h-4 w-4" />
                    Deploy Now
                  </button>

                  <p className="mt-3 text-center text-[10px] text-zinc-500">
                    Free sites include a &quot;Built with Zoobicon&quot; badge.{" "}
                    <a href="/pricing" className="text-amber-400/60 hover:text-amber-400 transition-colors">
                      Upgrade to remove
                    </a>
                  </p>
                </>
              )}

              {/* ---- DEPLOYING STATE ---- */}
              {state === "deploying" && (
                <div className="text-center py-8">
                  <motion.div
                    className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="h-6 w-6 text-amber-400" />
                  </motion.div>
                  <h2 className="text-lg font-bold text-white mb-1">Deploying...</h2>
                  <p className="text-sm text-zinc-400">
                    Publishing to zoobicon.sh
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-3">
                    {["Validating", "Uploading", "Going live"].map((step, i) => (
                      <motion.div
                        key={step}
                        className="flex items-center gap-1.5 text-xs text-zinc-500"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.8 }}
                      >
                        <motion.div
                          className="h-1.5 w-1.5 rounded-full bg-amber-400"
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ duration: 0.8, delay: i * 0.8, repeat: Infinity, repeatDelay: 1.6 }}
                        />
                        {step}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* ---- DEPLOYED STATE ---- */}
              {state === "deployed" && (
                <>
                  <div className="text-center mb-5">
                    <motion.div
                      className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 ring-1 ring-emerald-500/30"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", damping: 12 }}
                    >
                      <Check className="h-6 w-6 text-emerald-400" />
                    </motion.div>
                    <h2 className="text-xl font-bold text-white">Your site is live!</h2>
                    {deployTime !== null && (
                      <p className="mt-1 text-sm text-zinc-400">
                        Deployed in {deployTime < 1000 ? `${deployTime}ms` : `${(deployTime / 1000).toFixed(1)}s`}
                      </p>
                    )}
                  </div>

                  {/* Live URL with copy */}
                  <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-sm text-emerald-400">
                        {url}
                      </p>
                    </div>
                    <button
                      onClick={handleCopy}
                      className="flex shrink-0 items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-white/15 active:scale-95"
                    >
                      {copied ? (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <Check className="h-3.5 w-3.5" />
                          Copied
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Copy className="h-3.5 w-3.5" />
                          Copy
                        </span>
                      )}
                    </button>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 rounded-lg bg-white/10 p-1.5 text-zinc-400 transition-colors hover:bg-white/15 hover:text-white"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-400 hover:to-emerald-500 transition-all active:scale-[0.98]"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Visit Site
                    </a>
                    <button
                      onClick={onClose}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/5 text-zinc-300 hover:bg-white/10 transition-all"
                    >
                      Done
                    </button>
                  </div>
                </>
              )}

              {/* ---- ERROR STATE ---- */}
              {state === "error" && (
                <>
                  <div className="text-center mb-5">
                    <motion.div
                      className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20 ring-1 ring-red-500/30"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", damping: 12 }}
                    >
                      <AlertCircle className="h-5 w-5 text-red-400" />
                    </motion.div>
                    <h2 className="text-xl font-bold text-white">Deploy Failed</h2>
                    <p className="mt-2 text-sm text-red-300/80 max-w-xs mx-auto">
                      {error || "Something went wrong. Please try again."}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => { setState("naming"); setError(""); }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-400 hover:to-amber-500 transition-all active:scale-[0.98]"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Try Again
                    </button>
                    <button
                      onClick={onClose}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/5 text-zinc-300 hover:bg-white/10 transition-all"
                    >
                      Close
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
