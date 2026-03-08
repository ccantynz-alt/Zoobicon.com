"use client";

import React, { useState, useCallback } from "react";
import { Globe, Check, Languages, Loader2 } from "lucide-react";

interface TranslatePanelProps {
  code: string;
  onApplyTranslation: (translatedCode: string) => void;
}

interface Language {
  code: string;
  name: string;
  flag: string;
}

const LANGUAGES: Language[] = [
  { code: "en", name: "English", flag: "\u{1F1FA}\u{1F1F8}" },
  { code: "es", name: "Spanish", flag: "\u{1F1EA}\u{1F1F8}" },
  { code: "fr", name: "French", flag: "\u{1F1EB}\u{1F1F7}" },
  { code: "de", name: "German", flag: "\u{1F1E9}\u{1F1EA}" },
  { code: "ja", name: "Japanese", flag: "\u{1F1EF}\u{1F1F5}" },
  { code: "zh", name: "Chinese (Simplified)", flag: "\u{1F1E8}\u{1F1F3}" },
  { code: "zh-TW", name: "Chinese (Traditional)", flag: "\u{1F1F9}\u{1F1FC}" },
  { code: "ko", name: "Korean", flag: "\u{1F1F0}\u{1F1F7}" },
  { code: "hi", name: "Hindi", flag: "\u{1F1EE}\u{1F1F3}" },
  { code: "ar", name: "Arabic", flag: "\u{1F1F8}\u{1F1E6}" },
  { code: "pt", name: "Portuguese", flag: "\u{1F1E7}\u{1F1F7}" },
  { code: "ru", name: "Russian", flag: "\u{1F1F7}\u{1F1FA}" },
  { code: "it", name: "Italian", flag: "\u{1F1EE}\u{1F1F9}" },
  { code: "nl", name: "Dutch", flag: "\u{1F1F3}\u{1F1F1}" },
  { code: "sv", name: "Swedish", flag: "\u{1F1F8}\u{1F1EA}" },
  { code: "no", name: "Norwegian", flag: "\u{1F1F3}\u{1F1F4}" },
  { code: "da", name: "Danish", flag: "\u{1F1E9}\u{1F1F0}" },
  { code: "fi", name: "Finnish", flag: "\u{1F1EB}\u{1F1EE}" },
  { code: "pl", name: "Polish", flag: "\u{1F1F5}\u{1F1F1}" },
  { code: "cs", name: "Czech", flag: "\u{1F1E8}\u{1F1FF}" },
  { code: "tr", name: "Turkish", flag: "\u{1F1F9}\u{1F1F7}" },
  { code: "th", name: "Thai", flag: "\u{1F1F9}\u{1F1ED}" },
  { code: "vi", name: "Vietnamese", flag: "\u{1F1FB}\u{1F1F3}" },
  { code: "id", name: "Indonesian", flag: "\u{1F1EE}\u{1F1E9}" },
  { code: "ms", name: "Malay", flag: "\u{1F1F2}\u{1F1FE}" },
  { code: "fil", name: "Filipino", flag: "\u{1F1F5}\u{1F1ED}" },
  { code: "uk", name: "Ukrainian", flag: "\u{1F1FA}\u{1F1E6}" },
  { code: "ro", name: "Romanian", flag: "\u{1F1F7}\u{1F1F4}" },
  { code: "el", name: "Greek", flag: "\u{1F1EC}\u{1F1F7}" },
  { code: "he", name: "Hebrew", flag: "\u{1F1EE}\u{1F1F1}" },
];

export default function TranslatePanel({
  code,
  onApplyTranslation,
}: TranslatePanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState<Set<string>>(
    new Set()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [translatedCode, setTranslatedCode] = useState<string | null>(null);
  const [languageCount, setLanguageCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const toggleLanguage = useCallback((code: string) => {
    setSelectedLanguages((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedLanguages(
      new Set(LANGUAGES.filter((l) => l.code !== "en").map((l) => l.code))
    );
  }, []);

  const deselectAll = useCallback(() => {
    setSelectedLanguages(new Set());
  }, []);

  const handleTranslate = useCallback(async () => {
    if (selectedLanguages.size === 0) return;

    setIsLoading(true);
    setError(null);
    setTranslatedCode(null);

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          targetLanguages: Array.from(selectedLanguages),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Translation failed");
      }

      setTranslatedCode(data.translatedCode);
      setLanguageCount(data.languageCount);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  }, [code, selectedLanguages]);

  const handleApply = useCallback(() => {
    if (translatedCode) {
      onApplyTranslation(translatedCode);
      setIsOpen(false);
      setTranslatedCode(null);
      setSelectedLanguages(new Set());
    }
  }, [translatedCode, onApplyTranslation]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 transition-all hover:border-purple-500/50 hover:bg-purple-500/10 hover:text-white"
        title="Translate to multiple languages"
      >
        <Globe className="h-4 w-4" />
        <span>Translate</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[540px] rounded-xl border border-white/10 bg-[#0a0a0f] shadow-2xl shadow-purple-500/5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div className="flex items-center gap-2">
              <Languages className="h-5 w-5 text-purple-400" />
              <h3 className="text-sm font-semibold text-white">
                One-Click Translation
              </h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/40 transition-colors hover:text-white"
            >
              &times;
            </button>
          </div>

          <div className="max-h-[500px] overflow-y-auto p-5">
            {/* Success State */}
            {translatedCode && !isLoading && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-lg border border-green-500/20 bg-green-500/10 p-4">
                  <Check className="h-5 w-5 text-green-400" />
                  <div>
                    <p className="text-sm font-medium text-green-300">
                      Translation Complete
                    </p>
                    <p className="text-xs text-green-300/70">
                      Successfully translated to {languageCount} languages with
                      built-in language switcher
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <p className="mb-2 text-xs font-medium text-white/50">
                    Preview
                  </p>
                  <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2">
                    <Globe className="h-4 w-4 text-purple-400" />
                    <span className="text-sm text-white/70">
                      Language Switcher
                    </span>
                    <span className="ml-auto text-xs text-white/40">
                      {languageCount + 1} languages available
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-white/40">
                    A floating language switcher has been added to the top-right
                    corner of your page. Users can switch between all{" "}
                    {languageCount + 1} languages instantly.
                  </p>
                </div>

                <button
                  onClick={handleApply}
                  className="w-full rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-purple-500"
                >
                  Apply Translation
                </button>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="mb-4 h-8 w-8 animate-spin text-purple-400" />
                <p className="text-sm font-medium text-white/70">
                  Translating to {selectedLanguages.size} languages...
                </p>
                <p className="mt-1 text-xs text-white/40">
                  This may take a moment
                </p>
              </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-4">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {/* Language Selection */}
            {!translatedCode && !isLoading && (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-medium text-white/50">
                    Select target languages ({selectedLanguages.size} selected)
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAll}
                      className="text-xs text-purple-400 transition-colors hover:text-purple-300"
                    >
                      Select All
                    </button>
                    <span className="text-white/20">|</span>
                    <button
                      onClick={deselectAll}
                      className="text-xs text-purple-400 transition-colors hover:text-purple-300"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                <div className="mb-4 grid grid-cols-2 gap-1.5">
                  {LANGUAGES.filter((l) => l.code !== "en").map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => toggleLanguage(lang.code)}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-all ${
                        selectedLanguages.has(lang.code)
                          ? "border-purple-500/50 bg-purple-500/15 text-white"
                          : "border-white/5 bg-white/[0.02] text-white/50 hover:border-white/10 hover:bg-white/5 hover:text-white/70"
                      }`}
                    >
                      <span className="text-base">{lang.flag}</span>
                      <span className="truncate">{lang.name}</span>
                      {selectedLanguages.has(lang.code) && (
                        <Check className="ml-auto h-3.5 w-3.5 flex-shrink-0 text-purple-400" />
                      )}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleTranslate}
                  disabled={selectedLanguages.size === 0}
                  className="w-full rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {selectedLanguages.size > 0
                    ? `Translate Now (${selectedLanguages.size} languages)`
                    : "Select languages to translate"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
