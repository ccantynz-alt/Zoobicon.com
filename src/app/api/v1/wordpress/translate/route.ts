import { NextRequest } from "next/server";
import { authenticateWordPressRequest, callAI, apiResponse, apiError } from "@/lib/wordpress-api";

export const maxDuration = 60;

const LANGUAGES: Record<string, string> = {
  es: "Spanish", fr: "French", de: "German", it: "Italian", pt: "Portuguese",
  ja: "Japanese", ko: "Korean", zh: "Chinese (Simplified)", "zh-tw": "Chinese (Traditional)",
  ar: "Arabic", hi: "Hindi", ru: "Russian", nl: "Dutch", sv: "Swedish",
  pl: "Polish", tr: "Turkish", vi: "Vietnamese", th: "Thai", id: "Indonesian",
  ms: "Malay", fil: "Filipino", uk: "Ukrainian", cs: "Czech", ro: "Romanian",
  hu: "Hungarian", el: "Greek", he: "Hebrew", da: "Danish", fi: "Finnish",
  no: "Norwegian", bg: "Bulgarian", hr: "Croatian", sk: "Slovak", sl: "Slovenian",
  lt: "Lithuanian", lv: "Latvian", et: "Estonian", mi: "Maori", sm: "Samoan",
  to: "Tongan", fj: "Fijian",
};

export async function POST(req: NextRequest) {
  const auth = await authenticateWordPressRequest(req);
  if (auth instanceof Response) return auth;

  try {
    const { content, language = "es" } = await req.json();
    if (!content) return apiError(400, "missing_content", "Content to translate is required");

    const langName = LANGUAGES[language] || language;

    const systemPrompt = `You are a professional translator. Translate the following content to ${langName}.
Preserve all HTML formatting and tags exactly. Only translate the text content, not the HTML structure.
Output ONLY the translated content, no preamble or explanation.`;

    const result = await callAI(systemPrompt, content.substring(0, 10000), 4000);
    return apiResponse({ content: result, language, language_name: langName });
  } catch (error) {
    console.error("[wp-translate]", error);
    return apiError(500, "translate_failed", "Translation failed");
  }
}
