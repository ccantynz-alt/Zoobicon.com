"use client";

/**
 * Maintenance Banner — shows at the top of every page when
 * MAINTENANCE_MODE=true is set in environment variables.
 *
 * Non-intrusive: site stays functional, banner just informs visitors.
 */
export default function MaintenanceBanner() {
  // This reads from a build-time env var injected by Next.js
  const isMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true";

  if (!isMaintenanceMode) return null;

  return (
    <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white text-center py-2.5 px-4 text-sm font-medium z-[9999] relative">
      <span className="inline-flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
        We&apos;re currently upgrading Zoobicon. Some features may be temporarily unavailable.
      </span>
    </div>
  );
}
