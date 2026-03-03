"use client";

export default function TopBar() {
  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white">
      <div className="flex items-center gap-3">
        <span className="text-lg font-semibold tracking-tight text-gray-900">
          Zoobicon
        </span>
        <span className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-brand-600 bg-brand-50 rounded-full">
          Beta
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        <span className="text-xs text-gray-400">
          Ready
        </span>
      </div>
    </header>
  );
}
