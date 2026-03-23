import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const MOBILE_APP_SYSTEM = `You are Zoobicon, a world-class AI mobile app generator that produces production-ready React Native/Expo projects. When given a description, you produce a complete multi-file React Native app as a JSON object.

## Output Format
- Output ONLY a valid JSON object. No markdown, no explanation, no code fences.
- The JSON must follow this exact structure:
{
  "projectName": "my-app",
  "description": "A brief description of the app",
  "files": [
    { "path": "App.tsx", "content": "..." },
    { "path": "screens/HomeScreen.tsx", "content": "..." },
    { "path": "package.json", "content": "..." },
    { "path": "app.json", "content": "..." }
  ]
}

## Required Files (MINIMUM)
1. **App.tsx** — Root component with NavigationContainer and stack/tab navigator setup
2. **app.json** — Expo config with name, slug, version, orientation, icon, splash, platforms
3. **package.json** — Dependencies including expo, react, react-native, @react-navigation/native, @react-navigation/bottom-tabs, @react-navigation/native-stack, @expo/vector-icons, expo-status-bar, react-native-safe-area-context, react-native-screens
4. **screens/HomeScreen.tsx** — Main home screen
5. **screens/** — At least 2 additional screens (e.g., DetailScreen, ProfileScreen, SettingsScreen)
6. **navigation/index.tsx** — Navigation configuration (tab navigator + nested stacks)

## Code Rules — STRICT
- Use TypeScript (.tsx files) with proper type annotations
- Use ONLY functional components with React hooks (useState, useEffect, useCallback, useMemo)
- Use React Navigation v6+ for navigation (@react-navigation/native, @react-navigation/bottom-tabs, @react-navigation/native-stack)
- Use @expo/vector-icons (Ionicons, MaterialIcons, Feather) for all icons
- Use StyleSheet.create() for ALL styles — never inline style objects
- Use expo-status-bar for status bar management
- Use SafeAreaView from react-native-safe-area-context as the root wrapper
- Import from 'react-native' for core components: View, Text, ScrollView, FlatList, TouchableOpacity, Image, TextInput, ActivityIndicator, Dimensions, Platform, Alert
- Use real, specific content — never placeholder "Lorem ipsum" text
- Use https://picsum.photos/seed/KEYWORD/WIDTH/HEIGHT for images with descriptive keywords
- State management with React Context API (create a contexts/ folder if needed)
- All screens must be fully fleshed out with real UI, not stubs

## Design Standards — PREMIUM NATIVE FEEL
- Follow iOS Human Interface / Material Design conventions
- Use a consistent color palette defined in a constants/Colors.ts file
- Spacing system: 4, 8, 12, 16, 20, 24, 32, 40, 48 (multiples of 4)
- Border radius: 8 for small elements, 12 for cards, 16 for large containers, 9999 for pills
- Font sizes: 12 caption, 14 body, 16 body-large, 18 subtitle, 20 title, 24 h3, 28 h2, 32 h1
- Shadows for elevation: use Platform.select for iOS shadowX/shadowY vs Android elevation
- Touch targets: minimum 44x44 points
- Bottom tab bar: 5 tabs max, icons + labels, active/inactive states
- Pull-to-refresh on list screens
- Loading states with ActivityIndicator — never empty screens
- Empty states with illustration/icon, message, and action button

## App Architecture Pattern
- screens/ — Screen components (one per route)
- components/ — Reusable UI components
- navigation/ — Navigator configuration
- constants/ — Colors, layout constants, API URLs
- contexts/ — React Context providers (if state management needed)
- hooks/ — Custom hooks (if needed)
- types/ — TypeScript type definitions (if complex types needed)

## Navigation Pattern
- Bottom Tab Navigator as the root (3-5 tabs)
- Stack Navigator nested inside each tab for drill-down navigation
- Use typed navigation with RootStackParamList
- Consistent header styling across all stacks
- Tab bar icons from @expo/vector-icons with active/inactive colors

## IMPORTANT: JSON Escaping
- All file content in the "content" fields must be properly JSON-escaped.
- Escape all double quotes inside code as \\"
- Escape newlines as \\n
- Escape backslashes as \\\\
- Do NOT use backticks in a way that breaks JSON parsing.`;

interface MobileAppRequest {
  prompt: string;
  features?: string[];
}

interface FileData {
  path: string;
  content: string;
}

interface MobileAppResponse {
  projectName: string;
  description: string;
  files: FileData[];
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, features }: MobileAppRequest = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "A prompt is required" },
        { status: 400 }
      );
    }

    if (prompt.length > 5000) {
      return NextResponse.json(
        { error: "Prompt too long (max 5000 characters)" },
        { status: 400 }
      );
    }

    if (features && (!Array.isArray(features) || features.length > 20)) {
      return NextResponse.json(
        { error: "Features must be an array with a maximum of 20 entries" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });

    let userMessage = `Build me a polished, production-quality React Native/Expo mobile app: ${prompt}`;

    if (features && features.length > 0) {
      userMessage += `\n\nThe app should include these specific features: ${features.join(", ")}.`;
    }

    userMessage += `\n\nThis must feel like a professionally designed native app — not a web wrapper. Use smooth navigation transitions, consistent spacing, proper typography hierarchy, and a cohesive color system throughout. Every screen must have real, specific content relevant to the app's purpose. Include at least 3 full screens with a tab navigator.`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 64000,
      system: MOBILE_APP_SYSTEM,
      messages: [
        {
          role: "user",
          content: userMessage,
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "No response generated" },
        { status: 500 }
      );
    }

    let rawText = textBlock.text.trim();

    // Strip markdown code fences if present
    if (rawText.startsWith("```")) {
      rawText = rawText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    let parsed: MobileAppResponse;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse AI response as JSON" },
        { status: 500 }
      );
    }

    // Validate the response structure
    if (!parsed.files || !Array.isArray(parsed.files) || parsed.files.length === 0) {
      return NextResponse.json(
        { error: "Invalid response: missing files array" },
        { status: 500 }
      );
    }

    for (const file of parsed.files) {
      if (!file.path || !file.content) {
        return NextResponse.json(
          { error: "Invalid file data: each file must have path and content" },
          { status: 500 }
        );
      }
    }

    // Validate minimum required files
    const filePaths = parsed.files.map((f) => f.path.toLowerCase());
    const hasAppTsx = filePaths.some((p) => p === "app.tsx" || p === "app.js");
    const hasPackageJson = filePaths.some((p) => p === "package.json");
    const hasAppJson = filePaths.some((p) => p === "app.json");

    if (!hasAppTsx) {
      return NextResponse.json(
        { error: "Invalid response: missing App.tsx entry point" },
        { status: 500 }
      );
    }

    if (!hasPackageJson) {
      return NextResponse.json(
        { error: "Invalid response: missing package.json" },
        { status: 500 }
      );
    }

    if (!hasAppJson) {
      return NextResponse.json(
        { error: "Invalid response: missing app.json" },
        { status: 500 }
      );
    }

    if (!parsed.projectName) {
      parsed.projectName = "my-app";
    }

    if (!parsed.description) {
      parsed.description = "A React Native/Expo mobile app";
    }

    return NextResponse.json({
      projectName: parsed.projectName,
      description: parsed.description,
      files: parsed.files,
      fileCount: parsed.files.length,
    });
  } catch (err) {
    console.error("Mobile app generation error:", err);

    if (err instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `API error: ${err.message}` },
        { status: err.status || 500 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
