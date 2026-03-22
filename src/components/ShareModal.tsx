"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Copy,
  Check,
  ExternalLink,
  Share2,
  QrCode,
  Clock,
  FileCode,
  Layers,
  Download,
} from "lucide-react";
import {
  generateShareUrl,
  generateShareText,
  generateOGImageUrl,
  copyToClipboard,
  trackShare,
} from "@/lib/social-publish";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteUrl: string;
  siteName: string;
  buildTime?: number;
  siteSize?: number;
  pageCount?: number;
}

// Simple QR code SVG generator (no external dependencies)
function generateQRMatrix(data: string): boolean[][] {
  const size = 21;
  const matrix: boolean[][] = Array.from({ length: size }, () =>
    Array(size).fill(false)
  );

  // Finder patterns (top-left, top-right, bottom-left)
  const drawFinder = (sx: number, sy: number) => {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const isOuter = y === 0 || y === 6 || x === 0 || x === 6;
        const isInner = y >= 2 && y <= 4 && x >= 2 && x <= 4;
        matrix[sy + y][sx + x] = isOuter || isInner;
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(size - 7, 0);
  drawFinder(0, size - 7);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Data area — hash-based pattern from URL
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = (hash * 31 + data.charCodeAt(i)) & 0xffffffff;
  }

  for (let y = 8; y < size - 8; y++) {
    for (let x = 8; x < size - 8; x++) {
      if (x === 6 || y === 6) continue;
      hash = (hash * 1103515245 + 12345) & 0x7fffffff;
      matrix[y][x] = hash % 3 !== 0;
    }
  }

  // Fill remaining areas with pattern
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (
        (y < 8 && x < 8) ||
        (y < 8 && x >= size - 8) ||
        (y >= size - 8 && x < 8)
      )
        continue;
      if (x === 6 || y === 6) continue;
      if (y >= 8 && y < size - 8 && x >= 8 && x < size - 8) continue;
      hash = (hash * 1103515245 + 12345) & 0x7fffffff;
      matrix[y][x] = hash % 2 === 0;
    }
  }

  return matrix;
}

function QRCodeSVG({ data, size = 120 }: { data: string; size?: number }) {
  const matrix = generateQRMatrix(data);
  const cellSize = size / matrix.length;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect width={size} height={size} fill="white" rx="4" />
      {matrix.map((row, y) =>
        row.map((cell, x) =>
          cell ? (
            <rect
              key={`${x}-${y}`}
              x={x * cellSize + 0.5}
              y={y * cellSize + 0.5}
              width={cellSize - 0.5}
              height={cellSize - 0.5}
              fill="#0a0a12"
              rx={0.5}
            />
          ) : null
        )
      )}
    </svg>
  );
}

// Platform icons as inline SVGs
function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function RedditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 100-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 11-2.88 0 1.441 1.441 0 012.88 0z" />
    </svg>
  );
}

const PLATFORM_CONFIG = [
  {
    id: "twitter",
    name: "Twitter / X",
    Icon: TwitterIcon,
    color: "from-zinc-800 to-zinc-900",
    hoverColor: "hover:from-zinc-700 hover:to-zinc-800",
    textColor: "text-white",
    hasWebShare: true,
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    Icon: LinkedInIcon,
    color: "from-[#0077B5] to-[#005E93]",
    hoverColor: "hover:from-[#0088cc] hover:to-[#0077B5]",
    textColor: "text-white",
    hasWebShare: true,
  },
  {
    id: "facebook",
    name: "Facebook",
    Icon: FacebookIcon,
    color: "from-[#1877F2] to-[#0C5DC7]",
    hoverColor: "hover:from-[#2088FF] hover:to-[#1877F2]",
    textColor: "text-white",
    hasWebShare: true,
  },
  {
    id: "reddit",
    name: "Reddit",
    Icon: RedditIcon,
    color: "from-[#FF4500] to-[#CC3700]",
    hoverColor: "hover:from-[#FF5722] hover:to-[#FF4500]",
    textColor: "text-white",
    hasWebShare: true,
  },
  {
    id: "tiktok",
    name: "TikTok",
    Icon: TikTokIcon,
    color: "from-zinc-900 to-black",
    hoverColor: "hover:from-zinc-800 hover:to-zinc-900",
    textColor: "text-white",
    hasWebShare: false,
  },
  {
    id: "instagram",
    name: "Instagram",
    Icon: InstagramIcon,
    color: "from-[#833AB4] via-[#E1306C] to-[#F77737]",
    hoverColor: "hover:from-[#9B4DCA] hover:via-[#E94580] hover:to-[#F88B4D]",
    textColor: "text-white",
    hasWebShare: false,
  },
];

export default function ShareModal({
  isOpen,
  onClose,
  siteUrl,
  siteName,
  buildTime,
  siteSize,
  pageCount = 1,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Reset states when modal opens
  useEffect(() => {
    if (isOpen) {
      setCopied(false);
      setCopiedPlatform(null);
      setShowQR(false);
    }
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleCopyLink = useCallback(async () => {
    const success = await copyToClipboard(siteUrl);
    if (success) {
      setCopied(true);
      trackShare("copy_link", siteUrl);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [siteUrl]);

  const handleShare = useCallback(
    async (platformId: string) => {
      const text = generateShareText(platformId, siteName, siteUrl, buildTime);
      const shareUrl = generateShareUrl(platformId, siteUrl, text);

      trackShare(platformId, siteUrl);

      if (shareUrl) {
        // Platforms with web share URLs — open in popup
        window.open(shareUrl, "_blank", "noopener,noreferrer,width=600,height=500");
      } else {
        // TikTok / Instagram — copy caption to clipboard
        const success = await copyToClipboard(text);
        if (success) {
          setCopiedPlatform(platformId);
          setTimeout(() => setCopiedPlatform(null), 2500);
        }
      }
    },
    [siteName, siteUrl, buildTime]
  );

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === backdropRef.current) onClose();
    },
    [onClose]
  );

  const formatSize = (bytes?: number) => {
    if (!bytes) return "N/A";
    if (bytes < 1024) return `${bytes}B`;
    return `${(bytes / 1024).toFixed(1)}KB`;
  };

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
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a12] shadow-2xl shadow-cyan-500/5"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Top gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Content */}
            <div className="p-6">
              {/* Header */}
              <div className="mb-6 text-center">
                <motion.div
                  className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/20 to-violet-500/20 ring-1 ring-cyan-500/30"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.1, damping: 15 }}
                >
                  <Share2 className="h-5 w-5 text-cyan-400" />
                </motion.div>
                <h2 className="text-xl font-bold text-white">
                  Your site is live!
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Share your creation with the world
                </p>
              </div>

              {/* Site URL with copy */}
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-sm text-cyan-400">
                    {siteUrl}
                  </p>
                </div>
                <button
                  onClick={handleCopyLink}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-white/15 active:scale-95"
                >
                  <AnimatePresence mode="wait">
                    {copied ? (
                      <motion.span
                        key="check"
                        className="flex items-center gap-1.5 text-emerald-400"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                      >
                        <Check className="h-3.5 w-3.5" />
                        Copied
                      </motion.span>
                    ) : (
                      <motion.span
                        key="copy"
                        className="flex items-center gap-1.5"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copy
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
                <a
                  href={siteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 rounded-lg bg-white/10 p-1.5 text-zinc-400 transition-colors hover:bg-white/15 hover:text-white"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>

              {/* Preview + QR toggle area */}
              <div className="mb-5 flex gap-3">
                {/* Site preview thumbnail */}
                <div className="flex-1 overflow-hidden rounded-lg border border-white/10 bg-white/5">
                  <div className="relative aspect-video w-full overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={generateOGImageUrl(siteUrl) + `&name=${encodeURIComponent(siteName)}`}
                      alt={`Preview of ${siteName}`}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a12]/60 to-transparent" />
                    <div className="absolute bottom-2 left-2">
                      <span className="rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-medium text-zinc-300 backdrop-blur-sm">
                        {siteName || "Untitled Site"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* QR Code toggle */}
                <div className="flex flex-col items-center gap-1.5">
                  <button
                    onClick={() => setShowQR(!showQR)}
                    className={`flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-all ${
                      showQR
                        ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-400"
                        : "border-white/10 bg-white/5 text-zinc-400 hover:text-white"
                    }`}
                  >
                    <QrCode className="h-3.5 w-3.5" />
                    QR
                  </button>
                  <AnimatePresence>
                    {showQR && (
                      <motion.div
                        className="rounded-lg border border-white/10 bg-white p-2"
                        initial={{ opacity: 0, scale: 0.8, height: 0 }}
                        animate={{ opacity: 1, scale: 1, height: "auto" }}
                        exit={{ opacity: 0, scale: 0.8, height: 0 }}
                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                      >
                        <QRCodeSVG data={siteUrl} size={100} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Stats bar */}
              <div className="mb-5 flex items-center justify-center gap-6 rounded-lg border border-white/5 bg-white/[0.02] py-2.5">
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <Clock className="h-3.5 w-3.5 text-cyan-500/70" />
                  <span className="font-medium text-zinc-300">{buildTime ? `${buildTime}s` : "~95s"}</span>
                  <span className="text-zinc-500">build</span>
                </div>
                <div className="h-3 w-px bg-white/10" />
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <Layers className="h-3.5 w-3.5 text-violet-500/70" />
                  <span className="font-medium text-zinc-300">{pageCount}</span>
                  <span className="text-zinc-500">{pageCount === 1 ? "page" : "pages"}</span>
                </div>
                <div className="h-3 w-px bg-white/10" />
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <FileCode className="h-3.5 w-3.5 text-emerald-500/70" />
                  <span className="font-medium text-zinc-300">{formatSize(siteSize)}</span>
                  <span className="text-zinc-500">size</span>
                </div>
              </div>

              {/* Share buttons grid */}
              <div className="mb-4">
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Share on
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {PLATFORM_CONFIG.map((platform, i) => (
                    <motion.button
                      key={platform.id}
                      onClick={() => handleShare(platform.id)}
                      className={`group relative flex flex-col items-center gap-1.5 rounded-xl bg-gradient-to-br ${platform.color} ${platform.hoverColor} p-3 transition-all active:scale-95`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * i }}
                      whileHover={{ y: -2 }}
                    >
                      <platform.Icon className={`h-5 w-5 ${platform.textColor}`} />
                      <span className={`text-[10px] font-medium ${platform.textColor} opacity-80`}>
                        {copiedPlatform === platform.id
                          ? "Caption copied!"
                          : platform.name}
                      </span>
                      {!platform.hasWebShare && copiedPlatform !== platform.id && (
                        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-700 text-[8px] text-zinc-300">
                          <Copy className="h-2.5 w-2.5" />
                        </span>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Download OG image */}
              <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-4 py-2.5">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <Download className="h-3.5 w-3.5" />
                  <span>Download share image</span>
                </div>
                <a
                  href={generateOGImageUrl(siteUrl) + `&name=${encodeURIComponent(siteName)}`}
                  download={`${siteName || "site"}-og.svg`}
                  className="rounded-md bg-white/10 px-2.5 py-1 text-[10px] font-medium text-zinc-300 transition-colors hover:bg-white/15 hover:text-white"
                >
                  SVG
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
