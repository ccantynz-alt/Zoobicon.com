"use client";

import { useState, useCallback } from "react";
import { Share2, Copy, Check, X, ExternalLink } from "lucide-react";

interface ShareModalProps {
  projectSlug: string;
  projectName: string;
  /** The full HTML of the project to share (passed inline to the API) */
  projectHtml?: string;
}

export default function ShareModal({ projectSlug, projectName, projectHtml }: ShareModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const generateShareLink = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/projects/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectSlug,
          name: projectName,
          html: projectHtml || "",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to generate share link");
        return;
      }

      const fullUrl = `${window.location.origin}${data.shareUrl}`;
      setShareUrl(fullUrl);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [projectSlug, projectName, projectHtml]);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    if (!shareUrl) {
      generateShareLink();
    }
  }, [shareUrl, generateShareLink]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleCopy = useCallback(async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the input text
      const input = document.querySelector<HTMLInputElement>("#share-url-input");
      if (input) {
        input.select();
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  }, [shareUrl]);

  const shareText = `Check out "${projectName}" — built with Zoobicon AI`;

  const twitterUrl = shareUrl
    ? `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
    : "#";

  const linkedinUrl = shareUrl
    ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
    : "#";

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={handleOpen}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs text-white/60 hover:text-white/90 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-lg transition-all"
        title="Share project"
      >
        <Share2 className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Share</span>
      </button>

      {/* Modal overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <div className="relative w-full max-w-md bg-[#1a1a2e] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <Share2 className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">Share Project</h2>
                  <p className="text-[11px] text-white/40 mt-0.5 truncate max-w-[250px]">
                    {projectName}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 text-white/30 hover:text-white/70 hover:bg-white/[0.06] rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5">
              {/* Error state */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <p className="text-xs text-red-400">{error}</p>
                  <button
                    onClick={generateShareLink}
                    className="mt-2 text-[11px] text-red-300 underline hover:text-red-200"
                  >
                    Try again
                  </button>
                </div>
              )}

              {/* Loading state */}
              {loading && !error && (
                <div className="flex items-center justify-center py-4">
                  <div className="w-5 h-5 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                  <span className="ml-3 text-xs text-white/40">Generating share link...</span>
                </div>
              )}

              {/* Share URL */}
              {shareUrl && !loading && (
                <>
                  {/* URL input + copy */}
                  <div>
                    <label className="text-[11px] text-white/40 uppercase tracking-wider mb-2 block">
                      Share Link
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        id="share-url-input"
                        type="text"
                        readOnly
                        value={shareUrl}
                        className="flex-1 px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-xs text-white/80 font-mono focus:outline-none focus:border-blue-500/40 selection:bg-blue-500/30"
                        onFocus={(e) => e.target.select()}
                      />
                      <button
                        onClick={handleCopy}
                        className={`shrink-0 p-2.5 rounded-lg border transition-all ${
                          copied
                            ? "bg-green-500/10 border-green-500/30 text-green-400"
                            : "bg-white/[0.04] border-white/[0.08] text-white/50 hover:text-white/80 hover:bg-white/[0.08]"
                        }`}
                        title={copied ? "Copied!" : "Copy to clipboard"}
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Social share buttons */}
                  <div>
                    <label className="text-[11px] text-white/40 uppercase tracking-wider mb-2 block">
                      Share on Social
                    </label>
                    <div className="flex items-center gap-2">
                      {/* Twitter/X */}
                      <a
                        href={twitterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg text-xs text-white/60 hover:text-white/90 transition-all"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                        <span>Post on X</span>
                        <ExternalLink className="w-3 h-3 opacity-40" />
                      </a>

                      {/* LinkedIn */}
                      <a
                        href={linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg text-xs text-white/60 hover:text-white/90 transition-all"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                        <span>LinkedIn</span>
                        <ExternalLink className="w-3 h-3 opacity-40" />
                      </a>
                    </div>
                  </div>

                  {/* Open preview link */}
                  <a
                    href={shareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 rounded-lg text-xs text-blue-400 hover:text-blue-300 transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open Preview
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
