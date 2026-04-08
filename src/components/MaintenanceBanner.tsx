"use client";

/**
 * Maintenance Banner — shows at the top of every page.
 * Remove this component or set MAINTENANCE_ACTIVE to false to disable.
 */
export default function MaintenanceBanner() {
  // HARDCODED ON — remove this line or set to false to disable
  const MAINTENANCE_ACTIVE = false;

  if (!MAINTENANCE_ACTIVE) return null;

  return (
    <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white text-center py-2.5 px-4 text-sm font-medium z-[9999] relative">
      <span className="inline-flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
        We&apos;re currently upgrading Zoobicon. Some features may be temporarily unavailable.
      </span>
    </div>
  );
}
