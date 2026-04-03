"use client";

import { useState, useEffect, useRef } from "react";
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
  Monitor,
  Smartphone,
  Square,
  Play,
  AlertCircle,
} from "lucide-react";

export default function VideoCreator() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string } | null>(null);

  // Step tracking
  const [step, setStep] = useState<"describe" | "scripts" | "produce">("describe");

  // Step 1: Describe
  const [description, setDescription] = useState("");
  const [generatingScripts, setGeneratingScripts] = useState(false);

  // Step 2: Scripts
  const [scripts, setScripts] = useState<string[]>([]);
  const [selectedScript, setSelectedScript] = useState<number | null>(null);
  const [editedScript, setEditedScript] = useState("");

  // Step 3: Produce
  const [presenterGender, setPresenterGender] = useState<"female" | "male">("female");
  const [format, setFormat] = useState<"landscape" | "portrait" | "square">("landscape");
  const [generating, setGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState("");
  const [videoStatus, setVideoStatus] = useState("");

  // Auth
  useEffect(() => {
    try {
      const stored = localStorage.getItem("zoobicon_user");
      if (stored) setUser(JSON.parse(stored));
      else router.push("/auth/login");
    } catch { router.push("/auth/login"); }
  }, [router]);

  // Step 1: Generate scripts from description
  const handleGenerateScripts = async () => {
    if (!description.trim()) return;
    setGeneratingScripts(true);
    setScripts([]);
    setVideoError("");

    try {
      const res = await fetch("/api/video-creator/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Write exactly 2 video scripts for this: ${description.trim()}

Output ONLY the scripts in this exact format, nothing else:

SCRIPT_1:
[First script here - 30-60 seconds, natural conversational tone]

SCRIPT_2:
[Second script here - different approach, same length]`
          }],
        }),
      });

      if (!res.ok) throw new Error("Failed to generate scripts");

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
            if (event.type === "text") fullText += event.content;
          } catch {}
        }
      }

      // Parse scripts from response
      const parsed: string[] = [];
      const script1Match = fullText.match(/SCRIPT_1:\s*([\s\S]*?)(?=SCRIPT_2:|$)/);
      const script2Match = fullText.match(/SCRIPT_2:\s*([\s\S]*?)$/);

      if (script1Match?.[1]?.trim()) parsed.push(script1Match[1].trim().replace(/^\[|\]$/g, "").replace(/\*\*/g, ""));
      if (script2Match?.[1]?.trim()) parsed.push(script2Match[1].trim().replace(/^\[|\]$/g, "").replace(/\*\*/g, ""));

      // Fallback: if parsing failed, split by double newline
      if (parsed.length === 0) {
        const chunks = fullText.split(/\n\n+/).filter(c => c.trim().length > 50);
        if (chunks.length >= 2) {
          parsed.push(chunks[0].trim());
          parsed.push(chunks[1].trim());
        } else if (chunks.length === 1) {
          parsed.push(chunks[0].trim());
        } else {
          parsed.push(fullText.trim());
        }
      }

      setScripts(parsed);
      setStep("scripts");
    } catch (err) {
      setVideoError("Failed to generate scripts. Please try again.");
    }
    setGeneratingScripts(false);
  };

  // Step 2: Select and move to production
  const handleSelectScript = (index: number) => {
    setSelectedScript(index);
    setEditedScript(scripts[index]);
  };

  const handleProceedToProduction = () => {
    if (editedScript.trim().length < 10) {
      setVideoError("Script is too short. Please write at least a few sentences.");
      return;
    }
    setStep("produce");
    setVideoError("");
  };

  // Step 3: Generate video using our Replicate pipeline
  const handleGenerateVideo = async () => {
    if (!editedScript.trim()) return;

    setGenerating(true);
    setVideoError("");
    setVideoUrl(null);
    setVideoStatus("Starting video generation...");

    try {
      const res = await fetch("/api/v1/video/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          script: editedScript.trim(),
          avatarDescription: presenterGender === "female"
            ? "Beautiful professional woman, mid-30s, warm confident smile, friendly expression, business casual attire, looking at camera"
            : "Professional man, mid-30s, confident smile, business casual attire, looking at camera",
          voiceGender: presenterGender,
          voiceStyle: "professional",
          background: "#0f172a",
          format,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Video generation failed (${res.status})`);
      }

      // Read SSE stream for progress updates
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === "status") {
              setVideoStatus(event.message || "Processing...");
            } else if (event.type === "done" && event.videoUrl) {
              setVideoUrl(event.videoUrl);
              setVideoStatus("");
              setGenerating(false);
              return;
            } else if (event.type === "error") {
              throw new Error(event.message || "Video generation failed.");
            }
          } catch (e) {
            if (e instanceof Error && e.message.includes("failed")) throw e;
          }
        }
      }

      // If we got here without a video URL, something went wrong
      if (!videoUrl) {
        throw new Error("Video generation completed but no video was returned. Please try again.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Video generation failed.";
      setVideoError(msg);
      setGenerating(false);
      setVideoStatus("");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("zoobicon_user");
    window.location.href = "/";
  };

  const handleStartOver = () => {
    setStep("describe");
    setDescription("");
    setScripts([]);
    setSelectedScript(null);
    setEditedScript("");
    setVideoUrl(null);
    setVideoError("");
    setVideoStatus("");
    setGenerating(false);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white">
      {/* Nav */}
      <nav className="border-b border-amber-500/[0.08] bg-[#0a0a14]/95 backdrop-blur-2xl">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-2.5">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Video className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold text-white">Zoobicon</span>
            </Link>
            <ChevronRight className="w-3 h-3 text-amber-500/30" />
            <span className="text-sm text-amber-200/70 font-medium">AI Video Creator</span>
          </div>
          <div className="flex items-center gap-1">
            <Link href="/dashboard" className="text-xs text-white/50 hover:text-amber-300 px-3 py-1.5 rounded-lg hover:bg-amber-500/5 flex items-center gap-1.5 transition-colors">
              <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
            </Link>
            <button onClick={handleLogout} className="text-xs text-white/50 hover:text-amber-300 px-3 py-1.5 rounded-lg hover:bg-amber-500/5 transition-colors">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Steps indicator */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-4">
        <div className="flex items-center gap-2">
          {[
            { key: "describe", label: "1. Describe", icon: Sparkles },
            { key: "scripts", label: "2. Pick Script", icon: Bot },
            { key: "produce", label: "3. Generate Video", icon: Video },
          ].map((s, i) => {
            const isActive = step === s.key;
            const isCompleted = (s.key === "describe" && step !== "describe") || (s.key === "scripts" && step === "produce");
            const isReachable = isActive || isCompleted;
            return (
              <div key={s.key} className="flex items-center gap-2">
                {i > 0 && <div className={`w-10 h-[2px] rounded-full transition-all ${isReachable ? "bg-gradient-to-r from-amber-500 to-amber-400" : "bg-white/[0.08]"}`} />}
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  isActive ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/25" :
                  isCompleted ? "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/20" :
                  "bg-white/[0.04] text-white/30 ring-1 ring-white/[0.06]"
                }`}>
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : <s.icon className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{s.label}</span>
                  <span className="sm:hidden">{s.label.split(". ")[0]}.</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-20">

        {/* Error display */}
        {videoError && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/[0.08] border border-red-500/20 backdrop-blur-sm flex items-start gap-3 shadow-lg shadow-red-500/5">
            <div className="w-9 h-9 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4.5 h-4.5 text-red-400" />
            </div>
            <div className="pt-1">
              <div className="text-sm font-semibold text-red-300">Something went wrong</div>
              <div className="text-sm text-red-400/70 mt-1 leading-relaxed">{videoError}</div>
              <button onClick={() => setVideoError("")} className="text-xs text-red-400/50 hover:text-red-300 mt-2 transition-colors">Dismiss</button>
            </div>
          </div>
        )}

        {/* ═══ STEP 1: DESCRIBE ═══ */}
        {step === "describe" && (
          <div className="space-y-6">
            <div className="text-center pt-8 pb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-amber-500/20">
                <Video className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">What video do you want to create?</h1>
              <p className="text-lg text-slate-400 max-w-md mx-auto">
                Describe it in plain English. We&apos;ll write the script and generate a professional AI spokesperson video.
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleGenerateScripts(); } }}
                placeholder="e.g. A 30-second promo video for Zoobicon featuring an excited female presenter explaining our AI website builder and domain search tools..."
                rows={4}
                className="w-full px-5 py-4 bg-white/[0.05] border border-white/[0.10] rounded-2xl text-white text-base placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/30 resize-none transition-all"
                autoFocus
              />

              <button
                onClick={handleGenerateScripts}
                disabled={generatingScripts || description.trim().length < 10}
                className="w-full mt-4 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 rounded-2xl font-bold text-lg disabled:opacity-40 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30"
              >
                {generatingScripts ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Writing scripts...</>
                ) : (
                  <><Sparkles className="w-5 h-5" /> Write 2 Script Options</>
                )}
              </button>

              {/* Quick suggestions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8">
                {[
                  "30-second promo for Zoobicon — excited female presenter showing off the AI builder and domain search",
                  "Product launch video for our free domain search tool — professional, confident tone",
                  "Short explainer about Zoobicon for small business owners who need a website fast",
                  "Testimonial-style video about how AI is making web development accessible to everyone",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setDescription(suggestion)}
                    className="p-3 rounded-xl border border-white/[0.08] bg-white/[0.03] text-left text-sm text-slate-400 hover:text-white hover:border-amber-500/30 hover:bg-amber-500/5 transition-all"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ STEP 2: PICK SCRIPT ═══ */}
        {step === "scripts" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Pick your script</h2>
                <p className="text-sm text-slate-400 mt-1">Select one, edit it if needed, then proceed.</p>
              </div>
              <button onClick={() => setStep("describe")} className="text-sm text-amber-400 hover:text-amber-300 transition-colors">
                &larr; Back
              </button>
            </div>

            <div className="grid gap-4">
              {scripts.map((script, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectScript(i)}
                  className={`p-5 rounded-2xl border text-left transition-all ${
                    selectedScript === i
                      ? "border-amber-500/40 bg-amber-500/[0.08] ring-1 ring-amber-500/20 shadow-lg shadow-amber-500/5"
                      : "border-white/[0.08] bg-white/[0.03] hover:border-amber-500/20 hover:bg-amber-500/[0.03]"
                  }`}
                >
                  <div className="text-xs font-semibold text-amber-400 mb-2">Draft {i + 1}</div>
                  <div className="text-[15px] text-slate-300 leading-relaxed whitespace-pre-wrap">{script}</div>
                </button>
              ))}
            </div>

            {selectedScript !== null && (
              <div className="space-y-4">
                <label className="text-sm font-semibold text-white/70">Edit your script (optional)</label>
                <textarea
                  value={editedScript}
                  onChange={(e) => setEditedScript(e.target.value)}
                  rows={6}
                  className="w-full px-5 py-4 bg-white/[0.05] border border-white/[0.10] rounded-2xl text-white text-[15px] focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/30 resize-none leading-relaxed transition-all"
                />
                <button
                  onClick={handleProceedToProduction}
                  className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30"
                >
                  <Play className="w-5 h-5" /> Proceed to Generate Video
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═══ STEP 3: PRODUCE ═══ */}
        {step === "produce" && !videoUrl && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Generate your video</h2>
                <p className="text-sm text-slate-400 mt-1">Choose your presenter style, then hit generate.</p>
              </div>
              <button onClick={() => setStep("scripts")} className="text-sm text-purple-400 hover:text-purple-300">
                &larr; Back to scripts
              </button>
            </div>

            {/* Script preview */}
            <div className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.08]">
              <div className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Your Script</div>
              <div className="text-[15px] text-slate-300 leading-relaxed whitespace-pre-wrap max-h-32 overflow-y-auto">{editedScript}</div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {/* Presenter gender */}
              <div>
                <label className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-3 block">Presenter</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPresenterGender("female")}
                    className={`p-4 rounded-xl border text-center transition-all ${
                      presenterGender === "female"
                        ? "border-pink-500/50 bg-pink-500/10 ring-1 ring-pink-500/20"
                        : "border-white/[0.08] bg-white/[0.02] hover:border-white/20"
                    }`}
                  >
                    <div className="text-base font-semibold">Female</div>
                    <div className="text-xs text-slate-500">Warm, professional</div>
                  </button>
                  <button
                    onClick={() => setPresenterGender("male")}
                    className={`p-4 rounded-xl border text-center transition-all ${
                      presenterGender === "male"
                        ? "border-blue-500/50 bg-blue-500/10 ring-1 ring-blue-500/20"
                        : "border-white/[0.08] bg-white/[0.02] hover:border-white/20"
                    }`}
                  >
                    <div className="text-base font-semibold">Male</div>
                    <div className="text-xs text-slate-500">Confident, clear</div>
                  </button>
                </div>
              </div>

              {/* Format */}
              <div>
                <label className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-3 block">Format</label>
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

              {/* How it works */}
              <div>
                <label className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-3 block">Pipeline</label>
                <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs text-slate-500 space-y-1.5">
                  <div>1. FLUX generates your presenter</div>
                  <div>2. Fish Speech creates the voice</div>
                  <div>3. OmniHuman animates the face</div>
                  <div className="text-purple-400 font-medium pt-1">~60-90 seconds total</div>
                </div>
              </div>
            </div>

            <button
              onClick={handleGenerateVideo}
              disabled={generating}
              className="w-full py-5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-2xl font-bold text-xl disabled:opacity-50 transition-all flex items-center justify-center gap-3"
            >
              {generating ? (
                <><Loader2 className="w-6 h-6 animate-spin" /> {videoStatus || "Generating..."}</>
              ) : (
                <><Sparkles className="w-6 h-6" /> Generate Video</>
              )}
            </button>
          </div>
        )}

        {/* ═══ VIDEO RESULT ═══ */}
        {videoUrl && (
          <div className="space-y-6 pt-4">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 text-emerald-400 font-semibold text-lg mb-4">
                <Check className="w-5 h-5" /> Your video is ready!
              </div>
            </div>

            <video
              src={videoUrl}
              controls
              autoPlay
              className="w-full max-w-2xl mx-auto rounded-2xl border border-white/10 shadow-2xl"
            />

            <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
              <a
                href={videoUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors"
              >
                <Download className="w-4 h-4" /> Download Video
              </a>
              <button
                onClick={handleStartOver}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-white/[0.10] text-white/70 hover:text-white hover:bg-white/[0.05] transition-all"
              >
                <RefreshCw className="w-4 h-4" /> Create Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
