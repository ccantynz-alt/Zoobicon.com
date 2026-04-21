"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Link2,
  Calendar,
  Clock,
  Check,
  X,
  ExternalLink,
  Loader2,
  ChevronDown,
  Plus,
  Trash2,
  Copy,
  AlertCircle,
} from "lucide-react";
import {
  VIDEO_PLATFORMS,
  type VideoSocialPlatform,
  type ScheduledVideoPost,
  getConnections,
  setConnection,
  removeConnection,
  getScheduledPosts,
  saveScheduledPost,
  deleteScheduledPost,
  generateVideoHashtags,
  generateVideoCaption,
} from "@/lib/video-social-publish";

interface SocialPublishPanelProps {
  script: string;
  videoUrl?: string | null;
  sceneImages?: { sceneNumber: number; imageUrl: string }[];
  voiceoverUrl?: string | null;
}

export default function SocialPublishPanel({
  script,
  videoUrl,
  sceneImages,
  voiceoverUrl,
}: SocialPublishPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [connections, setConnections] = useState<
    Record<string, { connected: boolean; username: string }>
  >({});
  const [posts, setPosts] = useState<ScheduledVideoPost[]>([]);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [connectUsername, setConnectUsername] = useState("");
  const [publishingTo, setPublishingTo] = useState<string | null>(null);
  const [showScheduler, setShowScheduler] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [copiedCaption, setCopiedCaption] = useState<string | null>(null);

  // Per-platform caption & hashtags (editable)
  const [captions, setCaptions] = useState<Record<string, string>>({});
  const [hashtags, setHashtags] = useState<Record<string, string[]>>({});
  const [newHashtag, setNewHashtag] = useState("");

  useEffect(() => {
    setConnections(getConnections());
    setPosts(getScheduledPosts());
  }, []);

  // Generate default captions/hashtags when script changes
  useEffect(() => {
    if (!script) return;
    const newCaptions: Record<string, string> = {};
    const newHashtags: Record<string, string[]> = {};
    for (const p of VIDEO_PLATFORMS) {
      if (!captions[p.id]) {
        newCaptions[p.id] = generateVideoCaption(script, p.id);
      }
      if (!hashtags[p.id]) {
        newHashtags[p.id] = generateVideoHashtags(script, p.id);
      }
    }
    if (Object.keys(newCaptions).length > 0) {
      setCaptions((prev) => ({ ...prev, ...newCaptions }));
    }
    if (Object.keys(newHashtags).length > 0) {
      setHashtags((prev) => ({ ...prev, ...newHashtags }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [script]);

  const handleConnect = (platformId: string) => {
    setConnectingPlatform(platformId);
    setConnectUsername("");
  };

  const confirmConnect = () => {
    if (!connectingPlatform || !connectUsername.trim()) return;
    setConnection(connectingPlatform, connectUsername.trim());
    setConnections(getConnections());
    setConnectingPlatform(null);
    setConnectUsername("");
  };

  const handleDisconnect = (platformId: string) => {
    removeConnection(platformId);
    setConnections(getConnections());
  };

  const handlePublish = useCallback(
    async (platform: VideoSocialPlatform) => {
      setPublishingTo(platform.id);

      const post: ScheduledVideoPost = {
        id: `vsp_${Date.now()}_${platform.id}`,
        platform: platform.id,
        videoUrl: videoUrl || "",
        title: captions[platform.id] || "",
        description: captions[platform.id] || "",
        hashtags: hashtags[platform.id] || [],
        scheduledAt: null,
        status: connections[platform.id]?.connected ? "posting" : "draft",
        createdAt: new Date().toISOString(),
      };

      try {
        const res = await fetch("/api/social/publish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            platform: platform.id,
            videoUrl: videoUrl || "",
            title: captions[platform.id] || "",
            description:
              (captions[platform.id] || "") +
              "\n\n" +
              (hashtags[platform.id] || []).join(" "),
            hashtags: hashtags[platform.id] || [],
            connected: !!connections[platform.id]?.connected,
          }),
        });

        const data = await res.json();
        post.status = data.status || "draft";
        post.postedUrl = data.postedUrl;
        if (data.error) post.error = data.error;
      } catch {
        post.status = "draft";
        post.error = "Failed to publish. Download and upload manually.";
      }

      saveScheduledPost(post);
      setPosts(getScheduledPosts());
      setPublishingTo(null);
    },
    [videoUrl, captions, hashtags, connections]
  );

  const handleSchedule = useCallback(
    (platform: VideoSocialPlatform) => {
      if (!scheduleDate) return;

      const scheduledAt = new Date(
        `${scheduleDate}T${scheduleTime}:00`
      ).toISOString();

      const post: ScheduledVideoPost = {
        id: `vsp_${Date.now()}_${platform.id}`,
        platform: platform.id,
        videoUrl: videoUrl || "",
        title: captions[platform.id] || "",
        description: captions[platform.id] || "",
        hashtags: hashtags[platform.id] || [],
        scheduledAt,
        status: "scheduled",
        createdAt: new Date().toISOString(),
      };

      saveScheduledPost(post);
      setPosts(getScheduledPosts());
      setShowScheduler(null);
    },
    [videoUrl, captions, hashtags, scheduleDate, scheduleTime]
  );

  const handleRemovePost = (id: string) => {
    deleteScheduledPost(id);
    setPosts(getScheduledPosts());
  };

  const handleCopyCaption = async (platformId: string) => {
    const text =
      (captions[platformId] || "") +
      "\n\n" +
      (hashtags[platformId] || []).join(" ");
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCaption(platformId);
      setTimeout(() => setCopiedCaption(null), 2000);
    } catch {
      // fallback
    }
  };

  const handleRemoveHashtag = (platformId: string, index: number) => {
    setHashtags((prev) => ({
      ...prev,
      [platformId]: (prev[platformId] || []).filter((_, i) => i !== index),
    }));
  };

  const handleAddHashtag = (platformId: string) => {
    if (!newHashtag.trim()) return;
    const tag = newHashtag.startsWith("#") ? newHashtag.trim() : `#${newHashtag.trim()}`;
    setHashtags((prev) => ({
      ...prev,
      [platformId]: [...(prev[platformId] || []), tag],
    }));
    setNewHashtag("");
  };

  const hasContent = !!script && (!!videoUrl || (sceneImages && sceneImages.length > 0) || !!voiceoverUrl);

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.03] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ff0050] via-[#833ab4] to-[#ff0000] flex items-center justify-center">
            <Send className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold text-white">
              Publish to Social Media
            </div>
            <div className="text-[11px] text-white/50">
              Auto-post to TikTok, YouTube Shorts & Camera Reels
            </div>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-white/40 transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4">
              {!hasContent && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-stone-500/10 border border-stone-500/20">
                  <AlertCircle className="w-4 h-4 text-stone-400 flex-shrink-0" />
                  <p className="text-xs text-stone-300">
                    Generate a video, images, or voiceover first to enable publishing.
                  </p>
                </div>
              )}

              {/* Platform Cards */}
              {VIDEO_PLATFORMS.map((platform) => {
                const conn = connections[platform.id];
                const isConnected = !!conn?.connected;

                return (
                  <div
                    key={platform.id}
                    className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden"
                  >
                    {/* Platform header */}
                    <div
                      className="flex items-center justify-between px-3 py-2.5"
                      style={{
                        background: `linear-gradient(135deg, ${platform.gradientFrom}10, ${platform.gradientTo}10)`,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold"
                          style={{
                            background: `linear-gradient(135deg, ${platform.gradientFrom}, ${platform.gradientTo})`,
                          }}
                        >
                          {platform.name[0]}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white">
                            {platform.name}
                          </div>
                          <div className="text-[10px] text-white/40">
                            Max {platform.maxDuration}s &middot;{" "}
                            {platform.aspectRatio}
                          </div>
                        </div>
                      </div>

                      {isConnected ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-stone-400 flex items-center gap-1">
                            <Check className="w-3 h-3" />@{conn.username}
                          </span>
                          <button
                            onClick={() => handleDisconnect(platform.id)}
                            className="text-[9px] text-white/30 hover:text-stone-400 transition-colors"
                          >
                            Disconnect
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleConnect(platform.id)}
                          className="px-2.5 py-1 rounded-md text-[10px] font-medium text-white/70 border border-white/[0.10] hover:border-white/20 hover:bg-white/[0.05] transition-all flex items-center gap-1"
                        >
                          <Link2 className="w-3 h-3" /> Connect
                        </button>
                      )}
                    </div>

                    {/* Caption & hashtags */}
                    <div className="p-3 space-y-2">
                      {/* Editable caption */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] text-white/50 uppercase tracking-wider">
                            Caption
                          </label>
                          <button
                            onClick={() => handleCopyCaption(platform.id)}
                            className="text-[10px] text-white/40 hover:text-white/60 transition-colors flex items-center gap-1"
                          >
                            {copiedCaption === platform.id ? (
                              <>
                                <Check className="w-3 h-3 text-stone-400" />{" "}
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" /> Copy
                              </>
                            )}
                          </button>
                        </div>
                        <textarea
                          value={captions[platform.id] || ""}
                          onChange={(e) =>
                            setCaptions((prev) => ({
                              ...prev,
                              [platform.id]: e.target.value,
                            }))
                          }
                          rows={2}
                          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/30 outline-none focus:border-stone-500/30 resize-none"
                          placeholder="Write your caption..."
                        />
                      </div>

                      {/* Hashtags */}
                      <div>
                        <label className="text-[10px] text-white/50 uppercase tracking-wider block mb-1">
                          Hashtags
                        </label>
                        <div className="flex flex-wrap gap-1 mb-1.5">
                          {(hashtags[platform.id] || []).map((tag, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white/[0.06] text-[10px] text-white/70"
                            >
                              {tag}
                              <button
                                onClick={() =>
                                  handleRemoveHashtag(platform.id, i)
                                }
                                className="text-white/30 hover:text-stone-400 transition-colors ml-0.5"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-1">
                          <input
                            value={newHashtag}
                            onChange={(e) => setNewHashtag(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddHashtag(platform.id);
                              }
                            }}
                            placeholder="Add hashtag..."
                            className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-md px-2 py-1 text-[10px] text-white placeholder:text-white/30 outline-none focus:border-stone-500/30"
                          />
                          <button
                            onClick={() => handleAddHashtag(platform.id)}
                            className="px-2 py-1 rounded-md border border-white/[0.08] bg-white/[0.04] text-[10px] text-white/50 hover:text-white hover:bg-white/[0.08] transition-all"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handlePublish(platform)}
                          disabled={
                            !hasContent || publishingTo === platform.id
                          }
                          className="flex-1 py-2 rounded-lg text-[11px] font-medium text-white transition-all flex items-center justify-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
                          style={{
                            background: `linear-gradient(135deg, ${platform.gradientFrom}, ${platform.gradientTo})`,
                          }}
                        >
                          {publishingTo === platform.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Send className="w-3 h-3" />
                          )}
                          {isConnected
                            ? "Post Now"
                            : "Download & Upload Manually"}
                        </button>

                        <button
                          onClick={() =>
                            setShowScheduler(
                              showScheduler === platform.id
                                ? null
                                : platform.id
                            )
                          }
                          disabled={!hasContent}
                          className="px-3 py-2 rounded-lg border border-white/[0.10] bg-white/[0.04] text-[11px] text-white/60 hover:text-white hover:bg-white/[0.08] transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          <Calendar className="w-3 h-3" />
                          Schedule
                        </button>
                      </div>

                      {/* Manual upload link when not connected */}
                      {!isConnected && (
                        <a
                          href={platform.uploadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-white/40 hover:text-white/60 transition-colors flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Open {platform.name} upload page
                        </a>
                      )}

                      {/* Schedule picker */}
                      <AnimatePresence>
                        {showScheduler === platform.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="p-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] space-y-2">
                              <div className="text-[10px] text-white/50 font-medium flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Schedule for
                                later
                              </div>
                              <div className="flex gap-2">
                                <input
                                  type="date"
                                  value={scheduleDate}
                                  onChange={(e) =>
                                    setScheduleDate(e.target.value)
                                  }
                                  min={
                                    new Date().toISOString().split("T")[0]
                                  }
                                  className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-md px-2 py-1.5 text-[10px] text-white outline-none focus:border-stone-500/30"
                                />
                                <input
                                  type="time"
                                  value={scheduleTime}
                                  onChange={(e) =>
                                    setScheduleTime(e.target.value)
                                  }
                                  className="w-24 bg-white/[0.04] border border-white/[0.08] rounded-md px-2 py-1.5 text-[10px] text-white outline-none focus:border-stone-500/30"
                                />
                              </div>
                              <button
                                onClick={() => handleSchedule(platform)}
                                disabled={!scheduleDate}
                                className="w-full py-1.5 rounded-md bg-stone-600/20 text-stone-300 text-[10px] font-medium hover:bg-stone-600/30 transition-all disabled:opacity-30 flex items-center justify-center gap-1"
                              >
                                <Calendar className="w-3 h-3" />
                                Schedule Post
                              </button>
                              {!isConnected && (
                                <p className="text-[9px] text-white/30">
                                  Connect your account to auto-publish at the
                                  scheduled time. Without connection, you will
                                  get a reminder to upload manually.
                                </p>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })}

              {/* Post to All */}
              {hasContent && (
                <button
                  onClick={() => {
                    VIDEO_PLATFORMS.forEach((p) => handlePublish(p));
                  }}
                  disabled={!!publishingTo}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#ff0050] via-[#833ab4] to-[#ff0000] text-white text-xs font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" />
                  Post to All Platforms
                </button>
              )}

              {/* Scheduled / Recent Posts */}
              {posts.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">
                    Recent Posts
                  </div>
                  {posts.slice(0, 5).map((post) => {
                    const plat = VIDEO_PLATFORMS.find(
                      (p) => p.id === post.platform
                    );
                    return (
                      <div
                        key={post.id}
                        className="flex items-center gap-2 px-2.5 py-2 rounded-lg border border-white/[0.06] bg-white/[0.02]"
                      >
                        <div
                          className="w-5 h-5 rounded flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0"
                          style={{
                            background: plat
                              ? `linear-gradient(135deg, ${plat.gradientFrom}, ${plat.gradientTo})`
                              : "#666",
                          }}
                        >
                          {plat?.name[0] || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] text-white/70 truncate">
                            {post.title || "Untitled"}
                          </div>
                          <div className="text-[9px] text-white/40">
                            {post.status === "scheduled" && post.scheduledAt
                              ? `Scheduled: ${new Date(
                                  post.scheduledAt
                                ).toLocaleDateString()} ${new Date(
                                  post.scheduledAt
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}`
                              : post.status === "posted"
                              ? "Posted"
                              : post.status === "failed"
                              ? post.error || "Failed"
                              : "Draft"}
                          </div>
                        </div>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                            post.status === "posted"
                              ? "bg-stone-500/20 text-stone-400"
                              : post.status === "scheduled"
                              ? "bg-stone-500/20 text-stone-400"
                              : post.status === "failed"
                              ? "bg-stone-500/20 text-stone-400"
                              : "bg-white/10 text-white/50"
                          }`}
                        >
                          {post.status}
                        </span>
                        <button
                          onClick={() => handleRemovePost(post.id)}
                          className="p-1 text-white/30 hover:text-stone-400 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connect Modal */}
      <AnimatePresence>
        {connectingPlatform && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setConnectingPlatform(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-[#0f2148] rounded-xl border border-white/[0.10] p-5 space-y-4"
            >
              <div className="text-center">
                <div className="text-lg font-bold text-white mb-1">
                  Connect{" "}
                  {
                    VIDEO_PLATFORMS.find(
                      (p) => p.id === connectingPlatform
                    )?.name
                  }
                </div>
                <p className="text-xs text-white/50">
                  Full OAuth connection is being set up. For now, enter your
                  username to enable the publishing flow. You will be notified
                  when auto-posting is live.
                </p>
              </div>

              <div>
                <label className="text-[10px] text-white/50 uppercase tracking-wider block mb-1">
                  Your username
                </label>
                <input
                  value={connectUsername}
                  onChange={(e) => setConnectUsername(e.target.value)}
                  placeholder="@username"
                  className="w-full bg-white/[0.06] border border-white/[0.10] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-stone-500/40"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") confirmConnect();
                  }}
                />
              </div>

              <div className="bg-stone-500/10 border border-stone-500/20 rounded-lg px-3 py-2">
                <p className="text-[10px] text-stone-300">
                  Auto-posting requires OAuth app approval from{" "}
                  {
                    VIDEO_PLATFORMS.find(
                      (p) => p.id === connectingPlatform
                    )?.name
                  }
                  . Until then, we will prepare your posts with optimized
                  captions and hashtags for one-click manual upload.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setConnectingPlatform(null)}
                  className="flex-1 py-2.5 rounded-lg border border-white/[0.10] text-xs text-white/60 hover:text-white hover:bg-white/[0.05] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmConnect}
                  disabled={!connectUsername.trim()}
                  className="flex-1 py-2.5 rounded-lg bg-stone-600 text-white text-xs font-semibold hover:bg-stone-500 transition-all disabled:opacity-30"
                >
                  Connect
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
