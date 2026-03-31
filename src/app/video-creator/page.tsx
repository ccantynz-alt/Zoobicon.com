"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Video,
  Send,
  Loader2,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Sparkles,
  Check,
  Download,
  RefreshCw,
  User,
  Bot,
  Mic,
  Monitor,
  Smartphone,
  Square,
  Play,
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface VideoConfig {
  type: string;
  duration: string;
  tone: string;
  background: string;
}

export default function VideoCreatorChat() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [user, setUser] = useState<{ email: string; plan: string; role: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Production state
  const [finalScript, setFinalScript] = useState<string | null>(null);
  const [videoConfig, setVideoConfig] = useState<VideoConfig | null>(null);
  const [showProduction, setShowProduction] = useState(false);
  const [presenterDesc, setPresenterDesc] = useState("Beautiful professional woman, mid-30s, warm confident smile, sitting at a modern desk with a laptop, excited and engaging expression, business casual attire");
  const [presenterGender, setPresenterGender] = useState<"female" | "male">("female");
  const [presenterPreviewUrl, setPresenterPreviewUrl] = useState<string | null>(null);
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const [format, setFormat] = useState<"portrait" | "landscape" | "square">("landscape");
  const [bgColor, setBgColor] = useState("#1a1a2e");
  const [generating, setGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState("");
  const [videoStatus, setVideoStatus] = useState("");
  const [pipelineAvailable, setPipelineAvailable] = useState(false);

  // HeyGen fallback state (used when custom pipeline not available)
  const [avatars, setAvatars] = useState<{ id: string; name: string; preview_image_url?: string; gender: string }[]>([]);
  const [voices, setVoices] = useState<{ voice_id: string; name: string; gender: string }[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("");
  const [useHeyGen, setUseHeyGen] = useState(false);

  // Auth
  useEffect(() => {
    try {
      const stored = localStorage.getItem("zoobicon_user");
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        router.push("/auth/login");
      }
    } catch {
      router.push("/auth/login");
    }
  }, [router]);

  // ALWAYS load HeyGen as a reliable fallback — it's proven to work
  useEffect(() => {
    fetch("/api/video-creator/heygen")
      .then((r) => r.json())
      .then((h) => {
        if (h.presets?.length > 0) {
          setAvatars(h.presets);
          // Auto-select first female avatar
          const female = h.presets.find((a: { gender: string }) => a.gender === "female");
          setSelectedAvatar(female?.id || h.presets[0].id);
        }
        if (h.voices?.length > 0) {
          setVoices(h.voices);
          const femaleVoice = h.voices.find((v: { gender: string }) => v.gender === "female");
          setSelectedVoice(femaleVoice?.voice_id || h.voices[0].voice_id);
        }
      })
      .catch(() => {});

    // Also check if our custom pipeline is available (bonus, not required)
    fetch("/api/v1/video/generate")
      .then((r) => r.json())
      .then((d) => { if (d.available) setPipelineAvailable(true); })
      .catch(() => {});
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  // Parse final script from assistant messages
  const checkForFinalScript = useCallback((text: string) => {
    const scriptMatch = text.match(/---FINAL_SCRIPT---\n?([\s\S]*?)\n?---END_SCRIPT---/);
    const configMatch = text.match(/---VIDEO_CONFIG---\n?([\s\S]*?)\n?---END_CONFIG---/);

    if (scriptMatch) {
      setFinalScript(scriptMatch[1].trim());
      setShowProduction(true);

      if (configMatch) {
        try {
          const config = JSON.parse(configMatch[1].trim());
          setVideoConfig(config);
          if (config.background) setBgColor(config.background);
        } catch { /* ignore parse errors */ }
      }
    }
  }, []);

  // Send message
  const handleSend = async () => {
    if (!input.trim() || streaming) return;

    const userMsg: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setStreaming(true);

    // Add empty assistant message for streaming
    const assistantMsg: Message = { role: "assistant", content: "" };
    setMessages([...newMessages, assistantMsg]);

    try {
      const res = await fetch("/api/video-creator/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok) {
        setMessages([...newMessages, { role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
        setStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === "text") {
              fullText += event.content;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: fullText };
                return updated;
              });
            }
          } catch { /* skip */ }
        }
      }

      // Check if assistant produced a final script
      checkForFinalScript(fullText);
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: "Connection error. Please try again." };
        return updated;
      });
    }

    setStreaming(false);
    inputRef.current?.focus();
  };

  // Generate presenter preview using FLUX
  const handlePreviewPresenter = async () => {
    if (!presenterDesc.trim()) return;
    setGeneratingPreview(true);
    setPresenterPreviewUrl(null);
    try {
      const res = await fetch("/api/v1/video/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          script: "test",
          avatarDescription: presenterDesc,
          voiceGender: presenterGender,
          _previewOnly: true,
        }),
      });
      // For now, just show we're working on it
      // Full preview will come from the FLUX model
      setGeneratingPreview(false);
    } catch {
      setGeneratingPreview(false);
    }
  };

  // Generate video — ALWAYS uses HeyGen (proven, reliable)
  // Custom pipeline (Replicate) available as future upgrade
  const handleGenerateVideo = async (isPreview = false) => {
    if (!finalScript) {
      setVideoError("No script approved yet. Pick a draft from the chat first.");
      return;
    }
    if (!selectedAvatar) {
      setVideoError("No presenter available. Please reload the page.");
      return;
    }
    if (!selectedVoice) {
      setVideoError("No voice available. Please reload the page.");
      return;
    }

    setGenerating(true);
    setVideoError("");
    setVideoUrl(null);
    setVideoStatus(isPreview ? "Generating preview..." : "Starting...");

    try {
      const res = await fetch("/api/video-creator/heygen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          script: finalScript,
          avatarId: selectedAvatar,
          voiceId: selectedVoice,
          background: { type: "color", value: bgColor },
          format,
          test: isPreview,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setVideoError(data.error || "Failed to start video generation.");
        setGenerating(false);
        return;
      }

      const videoId = data.videoId;
      setVideoStatus("Rendering video — this takes about 2 minutes...");

      // Poll for completion
      let pollDone = false;
      const pollInterval = setInterval(async () => {
        if (pollDone) return;
        try {
          const statusRes = await fetch(`/api/video-creator/heygen?action=status&videoId=${videoId}`);
          const statusData = await statusRes.json();
          console.log("[video-creator] Poll status:", statusData.status, videoId);

          if (statusData.status === "completed" && statusData.videoUrl) {
            pollDone = true;
            clearInterval(pollInterval);
            setVideoUrl(statusData.videoUrl);
            setVideoStatus("");
            setGenerating(false);
          } else if (statusData.status === "failed") {
            pollDone = true;
            clearInterval(pollInterval);
            setVideoError(statusData.error || "Video generation failed. Try a different presenter or shorter script.");
            setVideoStatus("");
            setGenerating(false);
          } else {
            // Still processing — update status
            setVideoStatus(`Rendering video — ${statusData.status || "processing"}...`);
          }
        } catch { /* keep polling on network error */ }
      }, 5000);

      // Safety timeout after 10 minutes
      setTimeout(() => {
        if (!pollDone) {
          pollDone = true;
          clearInterval(pollInterval);
          setVideoError("Video is taking longer than expected. It may still complete — refresh in a few minutes to check.");
          setGenerating(false);
        }
      }, 600000);
    } catch {
      setVideoError("Failed to connect. Please try again.");
      setGenerating(false);
    }
  };

  // Clean display text (remove script/config blocks from visible messages)
  const cleanMessageText = (text: string) => {
    return text
      .replace(/---FINAL_SCRIPT---[\s\S]*?---END_SCRIPT---/g, "\n\n**Script approved and ready for production.**")
      .replace(/---VIDEO_CONFIG---[\s\S]*?---END_CONFIG---/g, "")
      .trim();
  };

  const handleLogout = () => {
    localStorage.removeItem("zoobicon_user");
    window.location.href = "/";
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white flex flex-col">
      {/* Nav */}
      <nav className="border-b border-white/[0.06] bg-[#0a0a14]/90 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-2.5">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                <Video className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold text-white">Zoobicon</span>
            </Link>
            <ChevronRight className="w-3 h-3 text-white/30" />
            <span className="text-sm text-white/70">AI Video Creator</span>
          </div>
          <div className="flex items-center gap-1">
            <Link href="/dashboard" className="text-xs text-white/50 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 flex items-center gap-1.5">
              <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
            </Link>
            <button onClick={handleLogout} className="text-xs text-white/50 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex max-w-6xl mx-auto w-full">
        {/* Chat Panel */}
        <div className={`flex-1 flex flex-col ${showProduction ? "border-r border-white/[0.06]" : ""}`}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-6">
                  <Video className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold mb-3">What video do you want to create?</h1>
                <p className="text-base text-slate-400 max-w-md mb-8">
                  Describe your video in plain English. I&apos;ll write the script, you approve it, and we&apos;ll generate a professional AI spokesperson video.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full">
                  {[
                    "A 30-second promo video for Zoobicon showing how easy it is to build a website with AI",
                    "A professional product launch video for our new domain search tool",
                    "A short explainer about what Zoobicon does — aimed at small business owners",
                    "A testimonial-style video about how AI is changing web development",
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => { setInput(suggestion); inputRef.current?.focus(); }}
                      className="p-3 rounded-xl border border-white/[0.08] bg-white/[0.03] text-left text-sm text-slate-400 hover:text-white hover:border-purple-500/30 hover:bg-purple-500/5 transition-all"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white"
                    : "bg-white/[0.06] text-slate-200"
                }`}>
                  {msg.role === "assistant" ? cleanMessageText(msg.content) : msg.content}
                  {msg.role === "assistant" && streaming && i === messages.length - 1 && (
                    <span className="inline-block w-1.5 h-5 bg-purple-400 ml-0.5 animate-pulse" />
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/30 flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-4 h-4 text-indigo-300" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-white/[0.06] px-4 sm:px-6 py-4">
            <div className="flex gap-3 max-w-3xl mx-auto">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Describe the video you want to create..."
                rows={2}
                className="flex-1 px-4 py-3 bg-white/[0.06] border border-white/[0.10] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-[15px]"
              />
              <button
                onClick={handleSend}
                disabled={streaming || !input.trim()}
                className="px-5 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-semibold disabled:opacity-40 transition-all self-end flex items-center gap-2"
              >
                {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Production Panel — appears when script is approved */}
        {showProduction && (
          <div className="w-[380px] flex-shrink-0 overflow-y-auto border-l border-white/[0.06] bg-white/[0.02]">
            <div className="p-5 space-y-5">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2 mb-1">
                  <Sparkles className="w-5 h-5 text-purple-400" /> Ready to Produce
                </h2>
                <p className="text-sm text-slate-400">Pick your presenter and generate the video.</p>
              </div>

              {/* Script preview */}
              <div>
                <label className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-2 block">Approved Script</label>
                <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-slate-300 max-h-40 overflow-y-auto whitespace-pre-wrap">
                  {finalScript}
                </div>
              </div>

              {/* Choose Presenter — real HeyGen avatars with photos */}
              <div>
                <label className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-2 block">Choose Presenter</label>
                {avatars.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                    {avatars.map((avatar) => (
                      <button
                        key={avatar.id}
                        onClick={() => {
                          setSelectedAvatar(avatar.id);
                          // ALWAYS match voice gender to avatar
                          const matchGender = avatar.gender || (avatar.name.match(/^(Abigail|Anna|Angela|Daisy|Kristin|Briana|Monica)/) ? "female" : "male");
                          const matchingVoice = voices.find((v) => v.gender === matchGender);
                          if (matchingVoice) setSelectedVoice(matchingVoice.voice_id);
                        }}
                        className={`p-2 rounded-xl border text-center transition-all ${
                          selectedAvatar === avatar.id
                            ? "border-purple-500/50 bg-purple-500/10 ring-1 ring-purple-500/20"
                            : "border-white/[0.08] bg-white/[0.02] hover:border-white/20"
                        }`}
                      >
                        {avatar.preview_image_url ? (
                          <img src={avatar.preview_image_url} alt={avatar.name} className="w-14 h-14 rounded-full mx-auto mb-1.5 object-cover" />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 mx-auto mb-1.5 flex items-center justify-center text-white font-bold text-lg">
                            {avatar.name[0]}
                          </div>
                        )}
                        <div className="text-[11px] font-medium text-white/80 truncate">{avatar.name}</div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-center">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-purple-400" />
                    <div className="text-sm text-slate-400">Loading presenters...</div>
                  </div>
                )}
              </div>

              {/* Voice — filtered to show only matching gender */}
              {voices.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-2 block">Voice</label>
                  <select
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="w-full bg-white/[0.06] border border-white/[0.10] rounded-xl px-3 py-2.5 text-sm text-white/80 focus:border-purple-500/50 focus:outline-none"
                  >
                    {voices.map((v) => (
                      <option key={v.voice_id} value={v.voice_id}>{v.name} ({v.gender})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Format */}
              <div>
                <label className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-2 block">Format</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { id: "landscape" as const, icon: Monitor, label: "16:9" },
                    { id: "portrait" as const, icon: Smartphone, label: "9:16" },
                    { id: "square" as const, icon: Square, label: "1:1" },
                  ]).map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFormat(f.id)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        format === f.id
                          ? "border-purple-500/50 bg-purple-500/10"
                          : "border-white/[0.08] bg-white/[0.02] hover:border-white/20"
                      }`}
                    >
                      <f.icon className="w-5 h-5 mx-auto mb-1 text-white/60" />
                      <div className="text-xs text-white/60">{f.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Background color */}
              <div>
                <label className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-2 block">Background</label>
                <div className="flex gap-3 items-center">
                  <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-10 h-10 rounded-lg border-0 cursor-pointer bg-transparent" />
                  <span className="text-sm text-white/50 font-mono">{bgColor}</span>
                </div>
              </div>

              {/* Preview + Generate buttons */}
              <div className="space-y-2">
                <button
                  onClick={() => handleGenerateVideo(true)}
                  disabled={generating || !selectedAvatar || !selectedVoice || !finalScript}
                  className="w-full py-3 border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 flex items-center justify-center gap-2 text-purple-300"
                >
                  {generating && videoStatus.includes("preview") ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Generating preview...</>
                  ) : (
                    <><Play className="w-4 h-4" /> Preview (free, watermarked)</>
                  )}
                </button>
                <button
                  onClick={() => handleGenerateVideo(false)}
                  disabled={generating || !selectedAvatar || !selectedVoice || !finalScript}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl font-bold text-base transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {generating && !videoStatus.includes("preview") ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> {videoStatus || "Generating..."}</>
                  ) : (
                    <><Sparkles className="w-5 h-5" /> Generate Final Video</>
                  )}
                </button>
              </div>

              {videoError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                  {videoError}
                </div>
              )}

              {/* Video result */}
              {videoUrl && (
                <div className="space-y-3">
                  <div className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5">
                    <Check className="w-4 h-4" /> Video Ready!
                  </div>
                  <video src={videoUrl} controls className="w-full rounded-xl border border-white/10" />
                  <a
                    href={videoUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-white/[0.10] bg-white/[0.05] text-sm text-white/80 hover:text-white hover:bg-white/[0.10] transition-all"
                  >
                    <Download className="w-4 h-4" /> Download Video
                  </a>
                  <button
                    onClick={() => { setVideoUrl(null); setFinalScript(null); setShowProduction(false); }}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm text-white/50 hover:text-white transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" /> Create Another Video
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
