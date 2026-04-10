"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers,
  Plus,
  Sparkles,
  ChevronDown,
  Play,
  Trash2,
  Check,
  Loader2,
  Calendar,
  X,
  FileText,
  ArrowRight,
} from "lucide-react";
import {
  type VideoSeries,
  type VideoSeriesEpisode,
  getVideoSeries,
  saveVideoSeries,
  deleteVideoSeries,
} from "@/lib/video-social-publish";

interface VideoSeriesPanelProps {
  /** Called when the user selects an episode to load into the main video creator */
  onLoadEpisode: (episode: VideoSeriesEpisode, seriesName: string) => void;
  currentPlatform: string;
  currentStyle: string;
}

const EPISODE_COUNTS = [5, 10, 20, 30];
const SCHEDULES: { value: VideoSeries["schedule"]; label: string; desc: string }[] = [
  { value: "daily", label: "Daily", desc: "Every day" },
  { value: "3x-week", label: "3x/week", desc: "Mon, Wed, Fri" },
  { value: "weekly", label: "Weekly", desc: "Once per week" },
];

export default function VideoSeriesPanel({
  onLoadEpisode,
  currentPlatform,
  currentStyle,
}: VideoSeriesPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [seriesList, setSeriesList] = useState<VideoSeries[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedSeries, setExpandedSeries] = useState<string | null>(null);

  // Create form state
  const [seriesName, setSeriesName] = useState("");
  const [seriesTopic, setSeriesTopic] = useState("");
  const [episodeCount, setEpisodeCount] = useState(10);
  const [schedule, setSchedule] = useState<VideoSeries["schedule"]>("3x-week");
  const [generating, setGenerating] = useState(false);
  const [generatingEpisode, setGeneratingEpisode] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setSeriesList(getVideoSeries());
  }, []);

  const refreshList = useCallback(() => {
    setSeriesList(getVideoSeries());
  }, []);

  // Generate all scripts for a new series
  const handleCreateSeries = useCallback(async () => {
    if (!seriesName.trim() || !seriesTopic.trim()) {
      setError("Enter a series name and topic.");
      return;
    }

    setGenerating(true);
    setError("");

    try {
      const res = await fetch("/api/video-creator/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectType: "series",
          topic: seriesTopic,
          targetAudience: "general audience",
          tone: "engaging and educational",
          duration: "30-60s per episode",
          keyPoints: [],
          seriesMode: true,
          seriesName,
          episodeCount,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to generate series scripts");
      }

      const data = await res.json();

      // Parse episodes from response - the API may return a single script
      // or we parse the series data
      let episodes: VideoSeriesEpisode[] = [];

      if (data.episodes && Array.isArray(data.episodes)) {
        episodes = data.episodes.map((ep: { episodeNumber?: number; title?: string; script?: string; hookLine?: string }, i: number) => ({
          number: ep.episodeNumber || i + 1,
          title: ep.title || `Episode ${i + 1}`,
          script: ep.script || "",
          hookLine: ep.hookLine || "",
          status: ep.script ? "scripted" : "draft",
        }));
      } else if (data.script) {
        // Fallback: split a single script into episode concepts
        const lines = data.script.split("\n").filter((l: string) => l.trim());
        episodes = Array.from({ length: episodeCount }, (_, i) => ({
          number: i + 1,
          title: lines[i] ? lines[i].replace(/^\d+[\.\)]\s*/, "").slice(0, 60) : `Episode ${i + 1}: ${seriesTopic}`,
          script: i === 0 ? data.script : "",
          hookLine: "",
          status: i === 0 ? "scripted" as const : "draft" as const,
        }));
      } else {
        // Generate placeholder episodes
        episodes = Array.from({ length: episodeCount }, (_, i) => ({
          number: i + 1,
          title: `Episode ${i + 1}`,
          script: "",
          hookLine: "",
          status: "draft" as const,
        }));
      }

      const series: VideoSeries = {
        id: `ser_${Date.now()}`,
        name: seriesName.trim(),
        description: seriesTopic.trim(),
        topic: seriesTopic.trim(),
        episodeCount,
        episodes,
        style: currentStyle,
        platform: currentPlatform,
        schedule,
        createdAt: new Date().toISOString(),
      };

      saveVideoSeries(series);
      refreshList();
      setShowCreate(false);
      setSeriesName("");
      setSeriesTopic("");
      setExpandedSeries(series.id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create series"
      );
    } finally {
      setGenerating(false);
    }
  }, [seriesName, seriesTopic, episodeCount, schedule, currentPlatform, currentStyle, refreshList]);

  // Generate script for a single episode
  const handleGenerateEpisodeScript = useCallback(
    async (seriesId: string, episodeNumber: number) => {
      const series = seriesList.find((s) => s.id === seriesId);
      if (!series) return;
      const episode = series.episodes.find((e) => e.number === episodeNumber);
      if (!episode) return;

      setGeneratingEpisode(`${seriesId}_${episodeNumber}`);
      setError("");

      try {
        const res = await fetch("/api/video-creator/script", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectType: "social-ad",
            topic: `${series.name} - Episode ${episodeNumber}: ${episode.title || series.topic}`,
            targetAudience: "general audience",
            tone: "engaging",
            duration: "30-60s",
            keyPoints: [
              `This is episode ${episodeNumber} of a ${series.episodeCount}-episode series called "${series.name}"`,
              `Series topic: ${series.topic}`,
              `Episode focus: ${episode.title}`,
            ],
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Script generation failed");
        }

        const data = await res.json();
        episode.script = data.script || "";
        episode.status = "scripted";
        saveVideoSeries(series);
        refreshList();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to generate script"
        );
      } finally {
        setGeneratingEpisode(null);
      }
    },
    [seriesList, refreshList]
  );

  // Generate all remaining scripts in a series
  const handleGenerateAllRemaining = useCallback(
    async (seriesId: string) => {
      const series = seriesList.find((s) => s.id === seriesId);
      if (!series) return;

      const remaining = series.episodes.filter((e) => e.status === "draft");
      for (const ep of remaining) {
        await handleGenerateEpisodeScript(seriesId, ep.number);
      }
    },
    [seriesList, handleGenerateEpisodeScript]
  );

  const handleDeleteSeries = (id: string) => {
    deleteVideoSeries(id);
    refreshList();
    if (expandedSeries === id) setExpandedSeries(null);
  };

  const getProgressStats = (series: VideoSeries) => {
    const scripted = series.episodes.filter(
      (e) => e.status === "scripted" || e.status === "generated" || e.status === "posted"
    ).length;
    const generated = series.episodes.filter(
      (e) => e.status === "generated" || e.status === "posted"
    ).length;
    const posted = series.episodes.filter(
      (e) => e.status === "posted"
    ).length;
    return { scripted, generated, posted, total: series.episodes.length };
  };

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.03] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-stone-500 to-stone-600 flex items-center justify-center">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold text-white">Video Series</div>
            <div className="text-[11px] text-white/50">
              Plan & batch-generate multi-episode content
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {seriesList.length > 0 && (
            <span className="text-[10px] bg-stone-500/20 text-stone-300 px-1.5 py-0.5 rounded-full">
              {seriesList.length}
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-white/40 transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Create new series button */}
              {!showCreate && (
                <button
                  onClick={() => setShowCreate(true)}
                  className="w-full py-2.5 rounded-lg border border-dashed border-stone-500/30 bg-stone-500/5 text-stone-300 text-xs font-medium hover:bg-stone-500/10 hover:border-stone-500/50 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create New Series
                </button>
              )}

              {/* Create series form */}
              <AnimatePresence>
                {showCreate && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-xl border border-stone-500/20 bg-stone-500/5 p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-stone-400" />
                          New Video Series
                        </div>
                        <button
                          onClick={() => setShowCreate(false)}
                          className="p-1 hover:bg-white/10 rounded"
                        >
                          <X className="w-3.5 h-3.5 text-white/50" />
                        </button>
                      </div>

                      {/* Series name */}
                      <div>
                        <label className="text-[10px] text-white/50 uppercase tracking-wider block mb-1">
                          Series Name
                        </label>
                        <input
                          value={seriesName}
                          onChange={(e) => setSeriesName(e.target.value)}
                          placeholder='e.g., "AI Tips for Entrepreneurs"'
                          className="w-full bg-white/[0.06] border border-white/[0.10] rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/30 outline-none focus:border-stone-500/40"
                        />
                      </div>

                      {/* Topic */}
                      <div>
                        <label className="text-[10px] text-white/50 uppercase tracking-wider block mb-1">
                          Topic / Niche
                        </label>
                        <textarea
                          value={seriesTopic}
                          onChange={(e) => setSeriesTopic(e.target.value)}
                          placeholder="What is the series about? The AI will generate unique episode scripts covering different angles of this topic."
                          rows={2}
                          className="w-full bg-white/[0.06] border border-white/[0.10] rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/30 outline-none focus:border-stone-500/40 resize-none"
                        />
                      </div>

                      {/* Episode count */}
                      <div>
                        <label className="text-[10px] text-white/50 uppercase tracking-wider block mb-1">
                          Number of Episodes
                        </label>
                        <div className="flex gap-2">
                          {EPISODE_COUNTS.map((count) => (
                            <button
                              key={count}
                              onClick={() => setEpisodeCount(count)}
                              className={`flex-1 py-2 rounded-lg border text-center transition-all ${
                                episodeCount === count
                                  ? "border-stone-500/50 bg-stone-500/15 text-stone-300"
                                  : "border-white/[0.08] bg-white/[0.03] text-white/60 hover:border-white/20"
                              }`}
                            >
                              <div className="text-sm font-bold">{count}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Publishing schedule */}
                      <div>
                        <label className="text-[10px] text-white/50 uppercase tracking-wider block mb-1">
                          Publishing Schedule
                        </label>
                        <div className="flex gap-2">
                          {SCHEDULES.map((s) => (
                            <button
                              key={s.value}
                              onClick={() => setSchedule(s.value)}
                              className={`flex-1 py-2 rounded-lg border text-center transition-all ${
                                schedule === s.value
                                  ? "border-stone-500/50 bg-stone-500/15 text-stone-300"
                                  : "border-white/[0.08] bg-white/[0.03] text-white/60 hover:border-white/20"
                              }`}
                            >
                              <div className="text-[11px] font-semibold">{s.label}</div>
                              <div className="text-[9px] text-white/40">{s.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {error && (
                        <div className="text-xs text-stone-400 bg-stone-500/10 border border-stone-500/20 rounded-lg px-3 py-2">
                          {error}
                        </div>
                      )}

                      {/* Generate button */}
                      <button
                        onClick={handleCreateSeries}
                        disabled={generating || !seriesName.trim() || !seriesTopic.trim()}
                        className="w-full py-2.5 rounded-lg bg-gradient-to-r from-stone-600 to-stone-600 text-white text-xs font-semibold hover:from-stone-500 hover:to-stone-500 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                      >
                        {generating ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Generating {episodeCount} Episode Scripts...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            Generate All Scripts ({episodeCount} episodes)
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Existing series list */}
              {seriesList.map((series) => {
                const stats = getProgressStats(series);
                const isExpanded = expandedSeries === series.id;

                return (
                  <div
                    key={series.id}
                    className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden"
                  >
                    {/* Series header */}
                    <button
                      onClick={() =>
                        setExpandedSeries(isExpanded ? null : series.id)
                      }
                      className="w-full flex items-start justify-between px-3 py-2.5 hover:bg-white/[0.03] transition-colors"
                    >
                      <div className="text-left">
                        <div className="text-xs font-semibold text-white flex items-center gap-2">
                          {series.name}
                          <span className="text-[9px] bg-stone-500/20 text-stone-300 px-1.5 py-0.5 rounded-full">
                            {series.episodeCount} eps
                          </span>
                        </div>
                        <div className="text-[10px] text-white/40 mt-0.5">
                          {series.topic.length > 60
                            ? series.topic.slice(0, 60) + "..."
                            : series.topic}
                        </div>
                        {/* Progress bar */}
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="h-1.5 w-24 rounded-full bg-white/[0.08] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-stone-500 to-stone-500 transition-all"
                              style={{
                                width: `${(stats.scripted / stats.total) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-[9px] text-white/40">
                            {stats.scripted}/{stats.total} scripted
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSeries(series.id);
                          }}
                          className="p-1.5 text-white/30 hover:text-stone-400 transition-colors rounded hover:bg-stone-500/10"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <ChevronDown
                          className={`w-3.5 h-3.5 text-white/30 transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </button>

                    {/* Episode list */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-white/[0.06] px-3 py-2 space-y-1">
                            {/* Batch actions */}
                            <div className="flex gap-2 mb-2">
                              <button
                                onClick={() =>
                                  handleGenerateAllRemaining(series.id)
                                }
                                disabled={
                                  !!generatingEpisode ||
                                  series.episodes.every(
                                    (e) => e.status !== "draft"
                                  )
                                }
                                className="flex-1 py-1.5 rounded-lg bg-stone-600/20 text-stone-300 text-[10px] font-medium hover:bg-stone-600/30 transition-all disabled:opacity-30 flex items-center justify-center gap-1"
                              >
                                <Sparkles className="w-3 h-3" />
                                Generate All Remaining
                              </button>
                            </div>

                            {/* Schedule info */}
                            <div className="flex items-center gap-1.5 text-[9px] text-white/40 mb-2">
                              <Calendar className="w-3 h-3" />
                              Publishing:{" "}
                              {
                                SCHEDULES.find((s) => s.value === series.schedule)
                                  ?.label
                              }{" "}
                              ({
                                SCHEDULES.find((s) => s.value === series.schedule)
                                  ?.desc
                              })
                            </div>

                            {/* Episodes */}
                            <div className="space-y-1 max-h-64 overflow-y-auto">
                              {series.episodes.map((episode) => {
                                const isGenerating =
                                  generatingEpisode ===
                                  `${series.id}_${episode.number}`;

                                return (
                                  <div
                                    key={episode.number}
                                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.03] group"
                                  >
                                    {/* Status icon */}
                                    <div
                                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${
                                        episode.status === "posted"
                                          ? "bg-stone-500/20 text-stone-400"
                                          : episode.status === "generated"
                                          ? "bg-stone-500/20 text-stone-400"
                                          : episode.status === "scripted"
                                          ? "bg-stone-500/20 text-stone-400"
                                          : "bg-white/[0.06] text-white/40"
                                      }`}
                                    >
                                      {episode.status === "posted" ? (
                                        <Check className="w-3 h-3" />
                                      ) : (
                                        episode.number
                                      )}
                                    </div>

                                    {/* Episode info */}
                                    <div className="flex-1 min-w-0">
                                      <div className="text-[10px] font-medium text-white/80 truncate">
                                        {episode.title}
                                      </div>
                                      {episode.script && (
                                        <div className="text-[9px] text-white/35 truncate">
                                          {episode.script.slice(0, 50)}...
                                        </div>
                                      )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      {episode.status === "draft" ? (
                                        <button
                                          onClick={() =>
                                            handleGenerateEpisodeScript(
                                              series.id,
                                              episode.number
                                            )
                                          }
                                          disabled={isGenerating}
                                          className="px-2 py-1 rounded text-[9px] text-stone-300 bg-stone-500/15 hover:bg-stone-500/25 transition-all flex items-center gap-1 disabled:opacity-40"
                                        >
                                          {isGenerating ? (
                                            <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                          ) : (
                                            <FileText className="w-2.5 h-2.5" />
                                          )}
                                          Script
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() =>
                                            onLoadEpisode(
                                              episode,
                                              series.name
                                            )
                                          }
                                          className="px-2 py-1 rounded text-[9px] text-stone-300 bg-stone-500/15 hover:bg-stone-500/25 transition-all flex items-center gap-1"
                                        >
                                          <Play className="w-2.5 h-2.5" />
                                          Load
                                        </button>
                                      )}
                                    </div>

                                    {/* Status badge */}
                                    <span
                                      className={`text-[8px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                                        episode.status === "posted"
                                          ? "bg-stone-500/20 text-stone-400"
                                          : episode.status === "generated"
                                          ? "bg-stone-500/20 text-stone-400"
                                          : episode.status === "scripted"
                                          ? "bg-stone-500/20 text-stone-300"
                                          : "bg-white/10 text-white/40"
                                      }`}
                                    >
                                      {episode.status}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}

              {seriesList.length === 0 && !showCreate && (
                <div className="text-center py-4 text-white/40 text-xs">
                  No series yet. Create one to plan multi-episode content.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
