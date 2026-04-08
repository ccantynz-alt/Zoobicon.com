/**
 * Voice recognition wrapper around the Web Speech API.
 * Pure browser API — no React imports.
 */

export function isVoiceSupported(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as any;
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
}

export interface VoiceRecognizerOptions {
  onInterim?: (text: string) => void;
  onFinal?: (text: string) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
  lang?: string;
  watchdogMs?: number;
}

export class VoiceRecognizer {
  private recognition: any = null;
  private watchdog: ReturnType<typeof setTimeout> | null = null;
  private finalText = "";
  private opts: VoiceRecognizerOptions;
  private running = false;

  constructor(opts: VoiceRecognizerOptions = {}) {
    this.opts = opts;
  }

  start(): void {
    if (this.running) return;
    if (!isVoiceSupported()) {
      this.opts.onError?.("Voice recognition not supported in this browser");
      return;
    }

    const w = window as any;
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = this.opts.lang || "en-US";
    rec.maxAlternatives = 1;

    this.finalText = "";
    this.recognition = rec;
    this.running = true;

    rec.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        if (result.isFinal) {
          this.finalText += transcript;
        } else {
          interim += transcript;
        }
      }
      const display = (this.finalText + " " + interim).trim();
      this.opts.onInterim?.(display);
    };

    rec.onerror = (event: any) => {
      this.opts.onError?.(event.error || "Unknown voice recognition error");
    };

    rec.onend = () => {
      this.running = false;
      if (this.watchdog) {
        clearTimeout(this.watchdog);
        this.watchdog = null;
      }
      const final = this.finalText.trim();
      if (final) this.opts.onFinal?.(final);
      this.opts.onEnd?.();
    };

    try {
      rec.start();
    } catch (err: any) {
      this.running = false;
      this.opts.onError?.(err?.message || "Failed to start voice recognition");
      return;
    }

    const timeout = this.opts.watchdogMs ?? 60000;
    this.watchdog = setTimeout(() => this.stop(), timeout);
  }

  stop(): void {
    if (this.watchdog) {
      clearTimeout(this.watchdog);
      this.watchdog = null;
    }
    if (this.recognition && this.running) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
    }
  }

  isRunning(): boolean {
    return this.running;
  }
}
