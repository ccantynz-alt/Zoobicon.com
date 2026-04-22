"use client";

/* Web Speech API — use any for browser APIs not in default TS lib */
// eslint-disable-next-line
type SpeechRecognitionAny = any;

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic,
  MicOff,
  Copy,
  Download,
  Trash2,
  Settings,
  Mouse,
  Volume2,
  Pause,
  Play,
  RotateCcw,
  Check,
  ChevronDown,
  Keyboard,
  Clock,
  FileText,
  Zap,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
interface TranscriptSegment {
  id: string;
  text: string;
  timestamp: Date;
  mode: "realtime" | "whisper";
  isFinal: boolean;
}

type MicMode = "push-to-talk" | "always-on" | "toggle";
type Engine = "browser" | "whisper";

// ── Voice Commands ─────────────────────────────────────────────────────────
const VOICE_COMMANDS: Record<string, string> = {
  "new line": "\n",
  "new paragraph": "\n\n",
  period: ".",
  "full stop": ".",
  comma: ",",
  "question mark": "?",
  "exclamation mark": "!",
  "exclamation point": "!",
  colon: ":",
  semicolon: ";",
  "open quote": '"',
  "close quote": '"',
  "open parenthesis": "(",
  "close parenthesis": ")",
  dash: " — ",
  hyphen: "-",
  ellipsis: "...",
  "open bracket": "[",
  "close bracket": "]",
};

function applyVoiceCommands(text: string): string {
  let result = text;
  for (const [command, replacement] of Object.entries(VOICE_COMMANDS)) {
    const regex = new RegExp(`\\b${command}\\b`, "gi");
    result = result.replace(regex, replacement);
  }
  return result;
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function DictationPage() {
  // State
  const [isListening, setIsListening] = useState(false);
  const [micMode, setMicMode] = useState<MicMode>("toggle");
  const [engine, setEngine] = useState<Engine>("browser");
  const [text, setText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [whisperApiKey, setWhisperApiKey] = useState("");
  const [language, setLanguage] = useState("en-US");
  const [autoCapitalize, setAutoCapitalize] = useState(true);
  const [voiceCommands, setVoiceCommands] = useState(true);
  const [fontSize, setFontSize] = useState(18);
  const [showVoiceCommands, setShowVoiceCommands] = useState(false);
  const [whisperStatus, setWhisperStatus] = useState<string>("");
  const [continuousRestart, setContinuousRestart] = useState(true);

  // Refs
  const recognitionRef = useRef<SpeechRecognitionAny | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isListeningRef = useRef(false);
  const mouseWheelPressedRef = useRef(false);

  // Keep ref in sync
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  // ── Word & char count ────────────────────────────────────────────────────
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;

  // ── Session timer ────────────────────────────────────────────────────────
  useEffect(() => {
    if (isSessionActive) {
      sessionTimerRef.current = setInterval(() => {
        setSessionDuration((d) => d + 1);
      }, 1000);
    } else if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
    }
    return () => {
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    };
  }, [isSessionActive]);

  const formatDuration = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // ── Audio level visualization ────────────────────────────────────────────
  const startAudioVisualization = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const update = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg =
          dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
        setAudioLevel(avg / 128);
        animFrameRef.current = requestAnimationFrame(update);
      };
      update();
    } catch {
      // Mic access denied or unavailable
    }
  }, []);

  const stopAudioVisualization = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  // ── Browser Speech Recognition ──────────────────────────────────────────
  const startBrowserRecognition = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(
        "Speech recognition not supported in this browser. Use Globe2 or Edge."
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionAny) => {
      let interim = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;

        if (result.isFinal) {
          let processed = transcript;
          if (voiceCommands) processed = applyVoiceCommands(processed);
          if (autoCapitalize) {
            processed =
              processed.charAt(0).toUpperCase() + processed.slice(1);
          }
          finalTranscript += processed;
        } else {
          interim += transcript;
        }
      }

      if (finalTranscript) {
        setText((prev) => {
          const needsSpace = prev.length > 0 && !prev.endsWith("\n") && !prev.endsWith(" ");
          return prev + (needsSpace ? " " : "") + finalTranscript;
        });
        setSegments((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            text: finalTranscript,
            timestamp: new Date(),
            mode: "realtime",
            isFinal: true,
          },
        ]);
        setInterimText("");
      } else {
        setInterimText(interim);
      }
    };

    recognition.onend = () => {
      // Auto-restart if in always-on or toggle mode and still supposed to be listening
      if (isListeningRef.current && continuousRestart) {
        try {
          recognition.start();
        } catch {
          // Already started
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionAny) => {
      if (event.error === "not-allowed") {
        alert("Microphone access denied. Please allow mic access.");
        setIsListening(false);
        setIsSessionActive(false);
      }
      // For other errors, recognition.onend will handle restart
    };

    recognition.start();
    recognitionRef.current = recognition;
  }, [language, voiceCommands, autoCapitalize, continuousRestart]);

  // ── Whisper API Recording ───────────────────────────────────────────────
  const startWhisperRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Send chunks every 5 seconds for near-real-time transcription
      mediaRecorder.start(5000);
      mediaRecorderRef.current = mediaRecorder;

      // Process chunks periodically
      const processInterval = setInterval(async () => {
        if (audioChunksRef.current.length === 0) return;

        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        audioChunksRef.current = [];

        if (audioBlob.size < 1000) return; // Skip tiny chunks

        try {
          setWhisperStatus("Transcribing...");
          const formData = new FormData();
          formData.append("file", audioBlob, "audio.webm");
          formData.append("model", "whisper-1");
          formData.append("language", language.split("-")[0]);

          const response = await fetch(
            "https://api.openai.com/v1/audio/transcriptions",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${whisperApiKey}`,
              },
              body: formData,
            }
          );

          if (!response.ok) {
            const err = await response.text();
            setWhisperStatus(`Error: ${response.status}`);
            console.error("Whisper API error:", err);
            return;
          }

          const data = await response.json();
          if (data.text && data.text.trim()) {
            let processed = data.text.trim();
            if (voiceCommands) processed = applyVoiceCommands(processed);

            setText((prev) => {
              const needsSpace = prev.length > 0 && !prev.endsWith("\n") && !prev.endsWith(" ");
              return prev + (needsSpace ? " " : "") + processed;
            });
            setSegments((prev) => [
              ...prev,
              {
                id: crypto.randomUUID(),
                text: processed,
                timestamp: new Date(),
                mode: "whisper",
                isFinal: true,
              },
            ]);
            setWhisperStatus("Ready");
          }
        } catch (err) {
          setWhisperStatus("Connection error");
          console.error("Whisper transcription failed:", err);
        }
      }, 6000);

      // Store interval for cleanup
      (mediaRecorder as unknown as Record<string, unknown>)._processInterval =
        processInterval;
    } catch {
      alert("Microphone access denied.");
      setIsListening(false);
      setIsSessionActive(false);
    }
  }, [whisperApiKey, language, voiceCommands]);

  // ── Start / Stop ────────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    if (engine === "whisper" && !whisperApiKey) {
      setShowSettings(true);
      alert("Please enter your OpenAI API key for Whisper.");
      return;
    }

    setIsListening(true);
    setIsSessionActive(true);
    startAudioVisualization();

    if (engine === "browser") {
      startBrowserRecognition();
    } else {
      startWhisperRecording();
    }
  }, [
    engine,
    whisperApiKey,
    startAudioVisualization,
    startBrowserRecognition,
    startWhisperRecording,
  ]);

  const stopListening = useCallback(() => {
    setIsListening(false);
    setInterimText("");
    stopAudioVisualization();

    if (recognitionRef.current) {
      recognitionRef.current.onend = null; // Prevent auto-restart
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current) {
      const recorder = mediaRecorderRef.current;
      const interval = (recorder as unknown as Record<string, unknown>)
        ._processInterval as NodeJS.Timeout;
      if (interval) clearInterval(interval);
      recorder.stop();
      recorder.stream.getTracks().forEach((t) => t.stop());
      mediaRecorderRef.current = null;
    }
  }, [stopAudioVisualization]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // ── Mouse wheel click (middle button) ────────────────────────────────────
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 1) {
        // Middle mouse button (wheel click)
        e.preventDefault();
        if (micMode === "push-to-talk") {
          mouseWheelPressedRef.current = true;
          if (!isListeningRef.current) startListening();
        } else {
          toggleListening();
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 1 && micMode === "push-to-talk") {
        e.preventDefault();
        mouseWheelPressedRef.current = false;
        if (isListeningRef.current) stopListening();
      }
    };

    // Prevent default middle-click scroll behavior
    const handleAuxClick = (e: MouseEvent) => {
      if (e.button === 1) e.preventDefault();
    };

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("auxclick", handleAuxClick);

    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("auxclick", handleAuxClick);
    };
  }, [micMode, startListening, stopListening, toggleListening]);

  // ── Keyboard shortcut (F2 or Ctrl+Shift+M) ──────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "F2" ||
        (e.ctrlKey && e.shiftKey && e.key === "M")
      ) {
        e.preventDefault();
        if (micMode === "push-to-talk") {
          if (!isListeningRef.current) startListening();
        } else {
          toggleListening();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (micMode === "push-to-talk" && (e.key === "F2" || (e.ctrlKey && e.shiftKey && e.key === "M"))) {
        if (isListeningRef.current) stopListening();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [micMode, startListening, stopListening, toggleListening]);

  // ── Actions ──────────────────────────────────────────────────────────────
  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadText = () => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dictation-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearText = () => {
    if (text && confirm("Clear all text?")) {
      setText("");
      setInterimText("");
      setSegments([]);
      setSessionDuration(0);
    }
  };

  const undoLastSegment = () => {
    if (segments.length === 0) return;
    const last = segments[segments.length - 1];
    setText((prev) => {
      const idx = prev.lastIndexOf(last.text);
      if (idx === -1) return prev;
      // Also remove the preceding space if present
      const start = idx > 0 && prev[idx - 1] === " " ? idx - 1 : idx;
      return prev.slice(0, start) + prev.slice(idx + last.text.length);
    });
    setSegments((prev) => prev.slice(0, -1));
  };

  // ── Cleanup ──────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      }
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      stopAudioVisualization();
    };
  }, [stopAudioVisualization]);

  // ── Auto-scroll textarea ─────────────────────────────────────────────────
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [text, interimText]);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a1628] text-white flex flex-col">
      {/* Top Bar */}
      <header className="border-b border-white/10 bg-[#0a1628]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-stone-500 to-stone-500 flex items-center justify-center">
              <Mic className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight">Dictation</h1>
            {engine === "whisper" && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-stone-500/20 text-stone-400 border border-stone-500/30">
                Whisper API
              </span>
            )}
            {engine === "browser" && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-stone-500/20 text-stone-400 border border-stone-500/30">
                Browser Speech
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Session stats */}
            {isSessionActive && (
              <div className="flex items-center gap-3 text-xs text-white/50 mr-4">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDuration(sessionDuration)}
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {wordCount} words
                </span>
              </div>
            )}

            <button
              onClick={() => setShowVoiceCommands(!showVoiceCommands)}
              className="p-2 rounded-lg hover:bg-white/5 text-white/50 hover:text-white/80 transition-colors"
              title="Voice commands"
            >
              <Keyboard className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg hover:bg-white/5 text-white/50 hover:text-white/80 transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full px-4 py-6 gap-4">
        {/* Voice Commands Reference */}
        {showVoiceCommands && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm">
            <h3 className="font-medium mb-3 text-white/80">
              Voice Commands (say these while dictating)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {Object.entries(VOICE_COMMANDS).map(([cmd, result]) => (
                <div
                  key={cmd}
                  className="flex items-center gap-2 text-white/60"
                >
                  <span className="font-mono text-xs bg-white/10 px-1.5 py-0.5 rounded">
                    &ldquo;{cmd}&rdquo;
                  </span>
                  <span className="text-white/40">
                    {result === "\n"
                      ? "\\n"
                      : result === "\n\n"
                        ? "\\n\\n"
                        : result}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
            <h3 className="font-medium text-white/80">Settings</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Engine Selection */}
              <div>
                <label className="block text-xs text-white/50 mb-1.5">
                  Recognition Engine
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (isListening) stopListening();
                      setEngine("browser");
                    }}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm border transition-colors ${
                      engine === "browser"
                        ? "bg-stone-500/20 border-stone-500/50 text-stone-400"
                        : "bg-white/5 border-white/10 text-white/50 hover:text-white/80"
                    }`}
                  >
                    <Zap className="w-3 h-3 inline mr-1" />
                    Browser (Free)
                  </button>
                  <button
                    onClick={() => {
                      if (isListening) stopListening();
                      setEngine("whisper");
                    }}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm border transition-colors ${
                      engine === "whisper"
                        ? "bg-stone-500/20 border-stone-500/50 text-stone-400"
                        : "bg-white/5 border-white/10 text-white/50 hover:text-white/80"
                    }`}
                  >
                    <Volume2 className="w-3 h-3 inline mr-1" />
                    Whisper API
                  </button>
                </div>
              </div>

              {/* Mic Mode */}
              <div>
                <label className="block text-xs text-white/50 mb-1.5">
                  Mic Control Mode
                </label>
                <div className="flex gap-2">
                  {(
                    [
                      ["toggle", "Toggle"],
                      ["push-to-talk", "Push to Talk"],
                      ["always-on", "Always On"],
                    ] as const
                  ).map(([mode, label]) => (
                    <button
                      key={mode}
                      onClick={() => setMicMode(mode)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm border transition-colors ${
                        micMode === mode
                          ? "bg-stone-500/20 border-stone-500/50 text-stone-400"
                          : "bg-white/5 border-white/10 text-white/50 hover:text-white/80"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Whisper API Key */}
              {engine === "whisper" && (
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">
                    OpenAI API Key
                  </label>
                  <input
                    type="password"
                    value={whisperApiKey}
                    onChange={(e) => setWhisperApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-stone-500/50"
                  />
                  <p className="text-xs text-white/30 mt-1">
                    Stored in browser only. Never sent to our servers.
                  </p>
                </div>
              )}

              {/* Language */}
              <div>
                <label className="block text-xs text-white/50 mb-1.5">
                  Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-stone-500/50"
                >
                  <option value="en-US">English (US)</option>
                  <option value="en-GB">English (UK)</option>
                  <option value="en-AU">English (AU)</option>
                  <option value="es-ES">Spanish</option>
                  <option value="fr-FR">French</option>
                  <option value="de-DE">German</option>
                  <option value="it-IT">Italian</option>
                  <option value="pt-BR">Portuguese (BR)</option>
                  <option value="ja-JP">Japanese</option>
                  <option value="ko-KR">Korean</option>
                  <option value="zh-CN">Chinese (Simplified)</option>
                  <option value="ar-SA">Arabic</option>
                  <option value="hi-IN">Hindi</option>
                  <option value="ru-RU">Russian</option>
                  <option value="nl-NL">Dutch</option>
                  <option value="pl-PL">Polish</option>
                  <option value="sv-SE">Swedish</option>
                  <option value="tr-TR">Turkish</option>
                </select>
              </div>

              {/* Font Size */}
              <div>
                <label className="block text-xs text-white/50 mb-1.5">
                  Font Size: {fontSize}px
                </label>
                <input
                  type="range"
                  min={12}
                  max={32}
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full accent-stone-500"
                />
              </div>

              {/* Toggles */}
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoCapitalize}
                    onChange={(e) => setAutoCapitalize(e.target.checked)}
                    className="accent-stone-500"
                  />
                  Auto-capitalize sentences
                </label>
                <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={voiceCommands}
                    onChange={(e) => setVoiceCommands(e.target.checked)}
                    className="accent-stone-500"
                  />
                  Voice commands (say &ldquo;period&rdquo;, &ldquo;new line&rdquo;, etc.)
                </label>
                <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={continuousRestart}
                    onChange={(e) => setContinuousRestart(e.target.checked)}
                    className="accent-stone-500"
                  />
                  Auto-restart on silence (keeps mic active)
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Main Text Area */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="relative flex-1 flex flex-col bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
            {/* Audio level indicator bar */}
            {isListening && (
              <div className="h-1 bg-white/5">
                <div
                  className="h-full bg-gradient-to-r from-stone-500 to-stone-500 transition-all duration-100"
                  style={{ width: `${Math.min(audioLevel * 100, 100)}%` }}
                />
              </div>
            )}

            <textarea
              ref={textareaRef}
              value={text + (interimText ? (text ? " " : "") + interimText : "")}
              onChange={(e) => {
                setText(e.target.value);
                setInterimText("");
              }}
              placeholder={
                isListening
                  ? "Listening... speak now"
                  : micMode === "push-to-talk"
                    ? "Click the mouse wheel (or press F2) and hold to dictate..."
                    : "Click the mic button, press mouse wheel, or press F2 to start dictating..."
              }
              className="flex-1 w-full p-6 bg-transparent text-white placeholder-white/30 resize-none focus:outline-none min-h-[400px]"
              style={{
                fontSize: `${fontSize}px`,
                lineHeight: "1.7",
                caretColor: "#a78bfa",
              }}
              spellCheck
            />

            {/* Interim text styling overlay */}
            {interimText && (
              <div className="absolute bottom-2 left-6 right-6 text-xs text-white/30 italic truncate">
                Hearing: &ldquo;{interimText}&rdquo;
              </div>
            )}
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="flex items-center justify-between gap-4 py-2">
          {/* Left: Stats */}
          <div className="flex items-center gap-4 text-xs text-white/40">
            <span>{wordCount} words</span>
            <span>{charCount} characters</span>
            <span>{segments.length} segments</span>
            {engine === "whisper" && whisperStatus && (
              <span className="text-stone-400/60">{whisperStatus}</span>
            )}
          </div>

          {/* Center: Mic Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={undoLastSegment}
              disabled={segments.length === 0}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Undo last segment"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={toggleListening}
              className={`relative p-5 rounded-2xl transition-all duration-300 ${
                isListening
                  ? "bg-stone-500 hover:bg-stone-600 shadow-lg shadow-stone-500/30 scale-110"
                  : "bg-gradient-to-br from-stone-500 to-stone-500 hover:from-stone-400 hover:to-stone-400 shadow-lg shadow-stone-500/20"
              }`}
              title={
                isListening
                  ? "Stop listening"
                  : `Start listening (Mouse wheel click or F2)`
              }
            >
              {isListening ? (
                <MicOff className="w-6 h-6 text-white" />
              ) : (
                <Mic className="w-6 h-6 text-white" />
              )}
              {/* Pulse animation when listening */}
              {isListening && (
                <>
                  <span className="absolute inset-0 rounded-2xl bg-stone-500 animate-ping opacity-20" />
                  <span className="absolute -inset-1 rounded-2xl border-2 border-stone-400/30 animate-pulse" />
                </>
              )}
            </button>

            {/* Mode indicator */}
            <div className="flex items-center gap-1.5 text-xs text-white/40">
              <Mouse className="w-3.5 h-3.5" />
              <span>
                {micMode === "push-to-talk"
                  ? "Hold wheel"
                  : micMode === "always-on"
                    ? "Always on"
                    : "Click wheel"}
              </span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={copyToClipboard}
              disabled={!text}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Copy to clipboard"
            >
              {copied ? (
                <Check className="w-4 h-4 text-stone-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={downloadText}
              disabled={!text}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Download as .txt"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={clearText}
              disabled={!text}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-stone-500/10 text-white/50 hover:text-stone-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Clear all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Keyboard shortcuts hint */}
        <div className="text-center text-xs text-white/20 pb-2">
          <span className="font-mono bg-white/5 px-1.5 py-0.5 rounded">
            F2
          </span>{" "}
          or{" "}
          <span className="font-mono bg-white/5 px-1.5 py-0.5 rounded">
            Ctrl+Shift+M
          </span>{" "}
          to toggle mic &middot;{" "}
          <span className="font-mono bg-white/5 px-1.5 py-0.5 rounded">
            Mouse Wheel Click
          </span>{" "}
          for {micMode === "push-to-talk" ? "push-to-talk" : "toggle"}
        </div>
      </div>
    </div>
  );
}
