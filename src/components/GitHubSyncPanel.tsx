"use client";

import { useState, useEffect, useCallback } from "react";
import {
  GitBranchPlus,
  GitBranch,
  GitCommit,
  Loader2,
  Check,
  CheckCircle2,
  ExternalLink,
  Lock,
  Unlock,
  RefreshCw,
  RotateCcw,
  AlertCircle,
  LogOut,
  GitCommitHorizontal,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GitHubUser {
  login: string;
  avatarUrl: string;
  name: string;
}

interface SyncResult {
  repoUrl: string;
  commitSha: string;
  filesCommitted: number;
  isNewRepo: boolean;
}

interface RepoStatus {
  exists: boolean;
  repoUrl: string;
  defaultBranch: string;
  lastCommitSha: string;
  lastCommitMessage: string;
  lastCommitDate: string;
  totalCommits: number;
  isPrivate: boolean;
}

type SyncState = "idle" | "connecting" | "pushing" | "synced" | "error";
type ConnState = "checking" | "connected" | "disconnected" | "error";

interface GitHubSyncPanelProps {
  /** All files in the current project (path -> content) */
  files: Record<string, string>;
  /** Suggested repo name derived from the prompt */
  suggestedName?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function GitHubSyncPanel({
  files,
  suggestedName = "",
}: GitHubSyncPanelProps) {
  const [ghUser, setGhUser] = useState<GitHubUser | null>(null);
  const [connState, setConnState] = useState<ConnState>("checking");
  const [connError, setConnError] = useState<string>("");
  const [repoName, setRepoName] = useState(sanitizeRepoName(suggestedName));
  const [isPrivate, setIsPrivate] = useState(true);
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<SyncResult | null>(null);
  const [repoStatus, setRepoStatus] = useState<RepoStatus | null>(null);
  const [commitMessage, setCommitMessage] = useState("");
  const [pushProgress, setPushProgress] = useState<{ current: number; total: number } | null>(null);

  // Track the last synced repo so we can show "Update" instead of "Push"
  const [syncedRepo, setSyncedRepo] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("zoobicon_github_synced_repo");
  });

  // -----------------------------------------------------------------------
  // Check GitHub connection on mount
  // -----------------------------------------------------------------------

  const checkConnection = useCallback(async () => {
    setConnState("checking");
    setConnError("");
    try {
      const res = await fetch("/api/github/connect");
      if (!res.ok) {
        throw new Error(`Connection check failed (${res.status})`);
      }
      const data = await res.json();
      if (data.connected && data.user) {
        setGhUser(data.user);
        setConnState("connected");
      } else {
        setGhUser(null);
        setConnState("disconnected");
      }
    } catch (err) {
      setGhUser(null);
      setConnState("error");
      setConnError(
        err instanceof Error ? err.message : "Unable to reach GitHub"
      );
    }
  }, []);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  // Update repo name when suggested name changes
  useEffect(() => {
    if (suggestedName && !syncedRepo) {
      setRepoName(sanitizeRepoName(suggestedName));
    }
  }, [suggestedName, syncedRepo]);

  // Check repo status when we have a user and synced repo
  useEffect(() => {
    if (!ghUser || !syncedRepo) return;
    checkRepoStatus(syncedRepo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ghUser, syncedRepo]);

  // -----------------------------------------------------------------------
  // Actions
  // -----------------------------------------------------------------------

  const checkRepoStatus = async (name: string) => {
    try {
      const res = await fetch(
        `/api/github/sync?repoName=${encodeURIComponent(name)}`
      );
      if (!res.ok) return;
      const data = await res.json();
      if (data.exists) {
        setRepoStatus(data);
      }
    } catch {
      // Silently fail — not critical
    }
  };

  const handlePush = async () => {
    if (!repoName.trim() || syncState === "pushing") return;

    const fileEntries = Object.entries(files);
    const fileCount = fileEntries.length;
    if (fileCount === 0) {
      setError("No files to push. Generate a site first.");
      setSyncState("error");
      return;
    }

    setSyncState("pushing");
    setError("");
    setResult(null);
    setPushProgress({ current: 0, total: fileCount });

    // Simulated incremental progress (real upload is one POST; UX needs the indicator)
    let progressTimer: ReturnType<typeof setInterval> | null = null;
    let simulated = 0;
    progressTimer = setInterval(() => {
      simulated = Math.min(simulated + 1, fileCount - 1);
      setPushProgress({ current: simulated, total: fileCount });
      if (simulated >= fileCount - 1 && progressTimer) {
        clearInterval(progressTimer);
        progressTimer = null;
      }
    }, 180);

    try {
      const isUpdate = syncedRepo === repoName.trim();
      const method = isUpdate ? "PUT" : "POST";
      const body: Record<string, unknown> = {
        files,
        repoName: repoName.trim(),
        isPrivate,
      };

      if (isUpdate) {
        body.commitMessage =
          commitMessage.trim() || "Update from Zoobicon builder";
      } else {
        body.commitMessage =
          commitMessage.trim() || "Initial commit — generated by Zoobicon";
        body.description =
          "Generated by Zoobicon AI Builder — zoobicon.com";
      }

      const res = await fetch("/api/github/sync", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Push failed (${res.status})`);
      }

      if (progressTimer) clearInterval(progressTimer);
      setPushProgress({ current: fileCount, total: fileCount });

      setResult(data);
      setSyncState("synced");
      setSyncedRepo(repoName.trim());
      setCommitMessage("");

      // Persist last synced repo
      localStorage.setItem("zoobicon_github_synced_repo", repoName.trim());

      // Refresh repo status
      checkRepoStatus(repoName.trim());
    } catch (err) {
      if (progressTimer) clearInterval(progressTimer);
      setPushProgress(null);
      setError(
        err instanceof Error ? err.message : "Failed to push to GitHub"
      );
      setSyncState("error");
    }
  };

  const handleDisconnect = async () => {
    try {
      await fetch("/api/github/connect", { method: "DELETE" });
      setGhUser(null);
      setRepoStatus(null);
      setSyncState("idle");
      setResult(null);
      setConnState("disconnected");
    } catch (err) {
      setConnError(
        err instanceof Error ? err.message : "Failed to disconnect"
      );
      setConnState("error");
    }
  };

  const handleConnect = () => {
    // Open GitHub OAuth in the same window
    // The callback will redirect back and set the cookie
    window.location.href = "/api/auth/oauth/github";
  };

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  const isUpdate = syncedRepo === repoName.trim() && repoStatus?.exists;
  const fileCount = Object.keys(files).length;
  const isPushing = syncState === "pushing";

  // Connection status pill (shown above all states)
  const ConnectionPill = () => {
    if (connState === "checking") {
      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-white/50">
          <Loader2 className="w-3 h-3 animate-spin" />
          Checking GitHub...
        </div>
      );
    }
    if (connState === "connected" && ghUser) {
      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-500/10 border border-stone-500/30 text-[10px] text-stone-300">
          <CheckCircle2 className="w-3 h-3" />
          Connected as @{ghUser.login}
        </div>
      );
    }
    if (connState === "error") {
      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-500/10 border border-stone-500/30 text-[10px] text-stone-300">
          <AlertCircle className="w-3 h-3" />
          {connError || "Connection error"}
          <button
            onClick={checkConnection}
            className="ml-1 inline-flex items-center gap-0.5 hover:text-stone-200"
            title="Retry connection check"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            Retry
          </button>
        </div>
      );
    }
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-500/10 border border-stone-500/30 text-[10px] text-stone-300">
        <AlertCircle className="w-3 h-3" />
        Not connected
      </div>
    );
  };

  // Loading skeleton during initial OAuth check
  if (connState === "checking") {
    return (
      <div className="flex flex-col gap-4 p-4">
        <ConnectionPill />
        <div className="space-y-3 animate-pulse">
          <div className="h-10 rounded-lg bg-white/5" />
          <div className="h-20 rounded-lg bg-white/5" />
          <div className="h-10 rounded-lg bg-white/5" />
          <div className="h-12 rounded-lg bg-white/5" />
        </div>
        <p className="text-[10px] text-white/30 text-center">
          Verifying your GitHub session...
        </p>
      </div>
    );
  }

  // Connection error state
  if (connState === "error") {
    return (
      <div className="flex flex-col gap-4 p-4">
        <ConnectionPill />
        <div className="rounded-lg border border-stone-500/20 bg-stone-500/5 p-4 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-stone-300 font-medium mb-1">
              Couldn&apos;t reach GitHub
            </p>
            <p className="text-[11px] text-stone-300/70 leading-relaxed">
              {connError ||
                "We couldn&apos;t verify your GitHub connection. Check your network and try again."}
            </p>
          </div>
        </div>
        <button
          onClick={checkConnection}
          className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white font-medium rounded-lg px-4 py-3 text-sm transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  // Not connected — show connect button
  if (connState === "disconnected" || !ghUser) {
    return (
      <div className="flex flex-col gap-5 p-4">
        <ConnectionPill />
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white/5">
            <GitBranchPlus className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              Push to GitHub
            </h3>
            <p className="text-xs text-white/40">
              Sync your project to a GitHub repository
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 space-y-3">
          <p className="text-xs text-white/60 leading-relaxed">
            Connect your GitHub account to push generated projects directly to a
            repository. Every edit gets committed so a developer can take over at
            any point.
          </p>
          <ul className="text-xs text-white/50 space-y-1.5">
            <li className="flex items-center gap-2">
              <Check className="w-3 h-3 text-stone-400/60 shrink-0" />
              Create new repos or push to existing ones
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-3 h-3 text-stone-400/60 shrink-0" />
              Auto-commit on every change
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-3 h-3 text-stone-400/60 shrink-0" />
              Deploy to Vercel or Netlify from GitHub
            </li>
          </ul>
        </div>

        <button
          onClick={handleConnect}
          className="w-full flex items-center justify-center gap-2 bg-white text-black font-medium rounded-lg px-4 py-3 hover:bg-white/90 transition-colors text-sm"
        >
          <GitBranchPlus className="w-4 h-4" />
          Connect GitHub Account
        </button>
      </div>
    );
  }

  // Connected — show push UI
  const progressPct = pushProgress
    ? Math.round((pushProgress.current / Math.max(pushProgress.total, 1)) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-4 p-4">
      <ConnectionPill />

      {/* Connected user header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white/5">
            <GitBranchPlus className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              Push to GitHub
            </h3>
            <p className="text-xs text-white/40">@{ghUser.login}</p>
          </div>
        </div>
        <button
          onClick={handleDisconnect}
          disabled={isPushing}
          title="Disconnect GitHub"
          className="p-1.5 rounded text-white/30 hover:text-stone-400 hover:bg-stone-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Repo status (if previously synced) */}
      {repoStatus && (
        <div className="rounded-lg border border-stone-500/20 bg-stone-500/5 p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs text-stone-400">
            <GitBranch className="w-3.5 h-3.5" />
            <span className="font-medium">Synced</span>
            <span className="text-stone-400/60">
              {repoStatus.defaultBranch}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/40">
            <GitCommitHorizontal className="w-3 h-3" />
            <span className="truncate">{repoStatus.lastCommitMessage}</span>
          </div>
          <a
            href={repoStatus.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white/70 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            View on GitHub
          </a>
        </div>
      )}

      {/* Repository name input */}
      <div className="space-y-1.5">
        <label
          htmlFor="gh-repo-name"
          className="text-xs text-white/50 font-medium"
        >
          Repository name
        </label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/30">
              {ghUser.login}/
            </span>
            <input
              id="gh-repo-name"
              type="text"
              value={repoName}
              disabled={isPushing}
              onChange={(e) =>
                setRepoName(sanitizeRepoName(e.target.value))
              }
              placeholder="my-project"
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-[calc(0.75rem+var(--owner-width,4ch))] pr-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/25 transition-colors disabled:opacity-50"
              style={
                {
                  "--owner-width": `${ghUser.login.length + 1}ch`,
                } as React.CSSProperties
              }
            />
          </div>
          <button
            onClick={() => setIsPrivate(!isPrivate)}
            disabled={isPushing}
            title={isPrivate ? "Private repository" : "Public repository"}
            className={`p-2.5 rounded-lg border transition-colors disabled:opacity-50 ${
              isPrivate
                ? "border-white/10 bg-white/5 text-white/60 hover:text-white/80"
                : "border-stone-500/30 bg-stone-500/10 text-stone-400"
            }`}
          >
            {isPrivate ? (
              <Lock className="w-4 h-4" />
            ) : (
              <Unlock className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-[10px] text-white/30">
          {isPrivate ? "Private — only you can see it" : "Public — visible to everyone"}
        </p>
      </div>

      {/* Commit message (optional for updates) */}
      {isUpdate && (
        <div className="space-y-1.5">
          <label
            htmlFor="gh-commit-msg"
            className="text-xs text-white/50 font-medium"
          >
            Commit message{" "}
            <span className="text-white/30">(optional)</span>
          </label>
          <input
            id="gh-commit-msg"
            type="text"
            value={commitMessage}
            disabled={isPushing}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder="Update from Zoobicon builder"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/25 transition-colors disabled:opacity-50"
          />
        </div>
      )}

      {/* File count indicator */}
      <div className="flex items-center gap-2 text-xs text-white/40">
        <GitCommit className="w-3 h-3" />
        <span className="font-mono text-white/60">{fileCount}</span>
        file{fileCount !== 1 ? "s" : ""} ready to push
      </div>

      {/* Push progress bar */}
      {isPushing && pushProgress && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-white/60">
            <span className="flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" />
              Pushing {pushProgress.current}/{pushProgress.total} files...
            </span>
            <span className="font-mono text-white/40">{progressPct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-stone-400 to-stone-300 transition-all duration-200 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Error message */}
      {syncState === "error" && error && (
        <div className="rounded-lg border border-stone-500/20 bg-stone-500/5 p-3 space-y-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-stone-300 font-medium">Push failed</p>
              <p className="text-[11px] text-stone-300/70 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            onClick={handlePush}
            className="w-full flex items-center justify-center gap-1.5 bg-stone-500/10 hover:bg-stone-500/20 text-stone-300 text-[11px] font-medium rounded px-3 py-1.5 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Retry push
          </button>
        </div>
      )}

      {/* Success message */}
      {syncState === "synced" && result && (
        <div className="rounded-lg border border-stone-500/20 bg-stone-500/5 p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs text-stone-400">
            <CheckCircle2 className="w-4 h-4" />
            <span className="font-medium">
              {result.isNewRepo ? "Repository created" : "Changes pushed"} — {result.filesCommitted} files
            </span>
          </div>
          <a
            href={result.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-1.5 bg-stone-500/10 hover:bg-stone-500/20 text-stone-300 text-[11px] font-medium rounded px-3 py-2 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Open on GitHub
          </a>
          <p className="text-[10px] text-white/30 font-mono truncate text-center">
            {result.commitSha.slice(0, 7)}
          </p>
        </div>
      )}

      {/* Push / Update button */}
      <button
        onClick={handlePush}
        disabled={isPushing || !repoName.trim() || fileCount === 0}
        className={`w-full flex items-center justify-center gap-2 font-medium rounded-lg px-4 py-3 text-sm transition-all ${
          isPushing
            ? "bg-white/10 text-white/40 cursor-wait"
            : fileCount === 0
            ? "bg-white/5 text-white/20 cursor-not-allowed"
            : "bg-white text-black hover:bg-white/90"
        }`}
      >
        {isPushing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {isUpdate ? "Syncing..." : "Creating repository..."}
          </>
        ) : isUpdate ? (
          <>
            <RefreshCw className="w-4 h-4" />
            Push Changes
          </>
        ) : (
          <>
            <GitBranchPlus className="w-4 h-4" />
            {repoName ? "Create Repository & Push" : "Push to GitHub"}
          </>
        )}
      </button>

      {/* Tip */}
      <p className="text-[10px] text-white/25 leading-relaxed text-center">
        Every edit you make can be committed to this repo. Deploy to Vercel
        or Netlify directly from GitHub.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sanitizeRepoName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-|-$/g, "")
    .replace(/\.+/g, ".")
    .slice(0, 100);
}
