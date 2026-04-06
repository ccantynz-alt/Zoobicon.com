"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
} from "lucide-react";

// ── React component for preview / embedding inside the app ──

interface CreatorBadgeProps {
  siteSlug?: string;
  variant?: "light" | "dark";
  removable?: boolean;
  onRemove?: () => void;
}

export default function CreatorBadge({
  siteSlug = "",
  variant = "dark",
  removable = false,
  onRemove,
}: CreatorBadgeProps) {
  const [hovered, setHovered] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const utmUrl = `https://zoobicon.com?utm_source=badge&utm_medium=site&utm_campaign=powered_by${siteSlug ? `&utm_content=${siteSlug}` : ""}`;

  const isDark = variant === "dark";
  const bg = isDark
    ? "rgba(10, 10, 18, 0.92)"
    : "rgba(255, 255, 255, 0.95)";
  const border = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
  const textPrimary = isDark ? "#ffffff" : "#0a0a12";
  const textSecondary = isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.55)";
  const accentGradient = "linear-gradient(135deg, #06b6d4, #8b5cf6)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 2, duration: 0.5, ease: "easeOut" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "fixed",
        bottom: 16,
        right: 16,
        zIndex: 9999,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <a
        href={utmUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: "none" }}
      >
        <motion.div
          layout
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 12px",
            borderRadius: 999,
            background: bg,
            border: `1px solid ${border}`,
            backdropFilter: "blur(12px)",
            boxShadow: isDark
              ? "0 4px 24px rgba(0,0,0,0.4)"
              : "0 4px 24px rgba(0,0,0,0.1)",
            cursor: "pointer",
            overflow: "hidden",
            whiteSpace: "nowrap" as const,
          }}
        >
          {/* Z logo mark */}
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: 6,
              background: accentGradient,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2 2.5H10L2 9.5H10"
                stroke="white"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: textPrimary,
              letterSpacing: "-0.01em",
            }}
          >
            Built with Zoobicon
          </span>

          <AnimatePresence>
            {hovered && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.25 }}
                style={{
                  fontSize: 11,
                  color: textSecondary,
                  overflow: "hidden",
                  whiteSpace: "nowrap" as const,
                }}
              >
                &mdash; Build yours free
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </a>

      {/* Remove button for Pro+ */}
      {removable && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setDismissed(true);
            onRemove?.();
          }}
          style={{
            position: "absolute",
            top: -6,
            right: -6,
            width: 18,
            height: 18,
            borderRadius: 999,
            background: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
          }}
          aria-label="Remove badge"
        >
          <X size={10} color={textPrimary} />
        </button>
      )}
    </motion.div>
  );
}

// ── Static HTML export for injection into deployed sites ──

/**
 * Returns a self-contained HTML snippet (inline CSS + JS) for the
 * "Built with Zoobicon" badge. Inject this before </body> in any
 * deployed site.
 *
 * On Pro+ plans (plan !== "free"), returns an empty string.
 */
export function getCreatorBadgeHTML(
  siteSlug: string,
  plan?: string
): string {
  // Pro+ plans: no badge
  if (plan && plan !== "free") return "";

  const utmUrl = `https://zoobicon.com?utm_source=badge&utm_medium=site&utm_campaign=powered_by&utm_content=${encodeURIComponent(siteSlug)}`;

  return `<!-- Built with Zoobicon -->
<div id="zb-badge" style="
  position:fixed;bottom:16px;right:16px;z-index:9999;
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  opacity:0;transform:translateY(8px);
  transition:opacity .5s ease,transform .5s ease;
">
  <a href="${utmUrl}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;" id="zb-badge-link">
    <div id="zb-badge-inner" style="
      display:flex;align-items:center;gap:8px;
      padding:6px 12px;border-radius:999px;
      background:rgba(10,10,18,0.92);
      border:1px solid rgba(255,255,255,0.1);
      backdrop-filter:blur(12px);
      box-shadow:0 4px 24px rgba(0,0,0,0.4);
      cursor:pointer;overflow:hidden;white-space:nowrap;
      transition:box-shadow .2s ease;
    ">
      <div style="
        width:20px;height:20px;border-radius:6px;
        background:linear-gradient(135deg,#06b6d4,#8b5cf6);
        display:flex;align-items:center;justify-content:center;flex-shrink:0;
      ">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 2.5H10L2 9.5H10" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <span style="font-size:12px;font-weight:500;color:#fff;letter-spacing:-0.01em;">Built with Zoobicon</span>
      <span id="zb-badge-expand" style="
        font-size:11px;color:rgba(255,255,255,0.6);
        overflow:hidden;white-space:nowrap;
        max-width:0;opacity:0;
        transition:max-width .25s ease,opacity .25s ease;
      ">&mdash; Build yours free</span>
    </div>
  </a>
</div>
<script>
(function(){
  var b=document.getElementById('zb-badge');
  var e=document.getElementById('zb-badge-expand');
  var i=document.getElementById('zb-badge-inner');
  if(!b||!e||!i)return;
  setTimeout(function(){b.style.opacity='1';b.style.transform='translateY(0)';},2000);
  i.addEventListener('mouseenter',function(){e.style.maxWidth='160px';e.style.opacity='1';});
  i.addEventListener('mouseleave',function(){e.style.maxWidth='0';e.style.opacity='0';});
})();
</script>`;
}
