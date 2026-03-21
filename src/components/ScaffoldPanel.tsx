"use client";

import { useState } from "react";
import {
  Shield,
  Database,
  Users,
  Settings,
  Upload,
  MessageSquare,
  Bell,
  Check,
  Loader2,
  Code,
  Key,
  Lock,
} from "lucide-react";

interface ScaffoldPanelProps {
  code: string;
  onApplyScaffold: (enhancedCode: string) => void;
}

interface FeatureOption {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

interface ApiEndpoint {
  method: string;
  path: string;
  description: string;
}

interface ScaffoldResult {
  enhancedCode: string;
  schema: string;
  apiEndpoints: ApiEndpoint[];
  features: string[];
}

const authFeatures: FeatureOption[] = [
  {
    id: "auth-email",
    label: "Email/Password",
    description: "Login & signup with email validation",
    icon: <Key className="w-4 h-4" />,
  },
  {
    id: "auth-google",
    label: "Google OAuth",
    description: "Sign in with Google account",
    icon: <Shield className="w-4 h-4" />,
  },
  {
    id: "auth-github",
    label: "GitHub OAuth",
    description: "Sign in with GitHub account",
    icon: <Lock className="w-4 h-4" />,
  },
];

const databaseFeatures: FeatureOption[] = [
  {
    id: "database-users",
    label: "Users",
    description: "User accounts and profiles table",
    icon: <Users className="w-4 h-4" />,
  },
  {
    id: "database-posts",
    label: "Posts/Blog",
    description: "Blog posts with authors and categories",
    icon: <Code className="w-4 h-4" />,
  },
  {
    id: "database-products",
    label: "Products",
    description: "Product catalog with pricing and stock",
    icon: <Database className="w-4 h-4" />,
  },
  {
    id: "database-orders",
    label: "Orders",
    description: "Order management with line items",
    icon: <Database className="w-4 h-4" />,
  },
];

const extraFeatures: FeatureOption[] = [
  {
    id: "admin-panel",
    label: "Admin Panel",
    description: "Dashboard with stats and management",
    icon: <Settings className="w-4 h-4" />,
  },
  {
    id: "user-profiles",
    label: "User Profiles",
    description: "Profile pages with avatar and settings",
    icon: <Users className="w-4 h-4" />,
  },
  {
    id: "file-uploads",
    label: "File Uploads",
    description: "Drag-and-drop file upload with preview",
    icon: <Upload className="w-4 h-4" />,
  },
  {
    id: "comments",
    label: "Comments",
    description: "Threaded comments with replies",
    icon: <MessageSquare className="w-4 h-4" />,
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "Bell icon with unread count and dropdown",
    icon: <Bell className="w-4 h-4" />,
  },
];

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: "bg-emerald-500/20 text-emerald-400",
    POST: "bg-blue-500/20 text-blue-400",
    PUT: "bg-amber-500/20 text-amber-400",
    PATCH: "bg-orange-500/20 text-orange-400",
    DELETE: "bg-red-500/20 text-red-400",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-mono font-semibold ${colors[method] || "bg-gray-500/20 text-gray-400"}`}
    >
      {method}
    </span>
  );
}

export default function ScaffoldPanel({
  code,
  onApplyScaffold,
}: ScaffoldPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ScaffoldResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleFeature = (id: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    if (selectedFeatures.length === 0 || isLoading) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/scaffold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, features: selectedFeatures }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Scaffolding failed");
      }

      const data: ScaffoldResult = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (result) {
      onApplyScaffold(result.enhancedCode);
      setIsOpen(false);
      setResult(null);
      setSelectedFeatures([]);
    }
  };

  const renderFeatureCheckbox = (feature: FeatureOption) => {
    const isSelected = selectedFeatures.includes(feature.id);
    return (
      <label
        key={feature.id}
        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
          isSelected
            ? "border-blue-500/50 bg-blue-500/10"
            : "border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]"
        }`}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => toggleFeature(feature.id)}
          className="sr-only"
        />
        <div
          className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
            isSelected
              ? "bg-blue-500 border-blue-500"
              : "border-white/20 bg-transparent"
          }`}
        >
          {isSelected && <Check className="w-3 h-3 text-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-blue-400">{feature.icon}</span>
            <span className="text-sm font-medium text-white">
              {feature.label}
            </span>
          </div>
          <p className="text-xs text-white/50 mt-0.5">{feature.description}</p>
        </div>
      </label>
    );
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-300 hover:bg-blue-600/30 hover:border-blue-500/50 transition-all text-sm font-medium"
      >
        <Database className="w-4 h-4" />
        Add Full-Stack Features
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0a0a0f] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Database className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-lg">
                Full-Stack Scaffolding
              </h2>
              <p className="text-white/50 text-xs">
                Add auth, database, and features to your site
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsOpen(false);
              setResult(null);
              setError(null);
            }}
            className="text-white/50 hover:text-white transition-colors text-xl leading-none px-2"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {!result ? (
            <>
              {/* Auth Section */}
              <div>
                <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-400" />
                  Authentication
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {authFeatures.map(renderFeatureCheckbox)}
                </div>
              </div>

              {/* Database Section */}
              <div>
                <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-400" />
                  Database Tables
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {databaseFeatures.map(renderFeatureCheckbox)}
                </div>
              </div>

              {/* Features Section */}
              <div>
                <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-emerald-400" />
                  Features
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {extraFeatures.map(renderFeatureCheckbox)}
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {error}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Results: Added Features */}
              <div>
                <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
                  Added Features
                </h3>
                <div className="space-y-1.5">
                  {result.features.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span className="text-white/80">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Results: SQL Schema */}
              <div>
                <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
                  SQL Schema
                </h3>
                <pre className="bg-[#06060a] border border-white/5 rounded-lg p-4 overflow-x-auto text-xs text-emerald-300/80 font-mono leading-relaxed max-h-60 overflow-y-auto">
                  <code>{result.schema}</code>
                </pre>
              </div>

              {/* Results: API Endpoints */}
              <div>
                <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
                  API Endpoints
                </h3>
                <div className="bg-[#06060a] border border-white/5 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="px-4 py-2 text-left text-white/50 font-medium text-xs">
                          Method
                        </th>
                        <th className="px-4 py-2 text-left text-white/50 font-medium text-xs">
                          Path
                        </th>
                        <th className="px-4 py-2 text-left text-white/50 font-medium text-xs">
                          Description
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.apiEndpoints.map((endpoint, i) => (
                        <tr
                          key={i}
                          className="border-b border-white/[0.03] last:border-0"
                        >
                          <td className="px-4 py-2">
                            <MethodBadge method={endpoint.method} />
                          </td>
                          <td className="px-4 py-2 font-mono text-xs text-white/60">
                            {endpoint.path}
                          </td>
                          <td className="px-4 py-2 text-xs text-white/50">
                            {endpoint.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5 flex items-center justify-end gap-3">
          {!result ? (
            <>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setError(null);
                }}
                className="px-4 py-2 text-sm text-white/50 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={selectedFeatures.length === 0 || isLoading}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedFeatures.length === 0 || isLoading
                    ? "bg-white/5 text-white/50 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-500"
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Building full-stack features...
                  </>
                ) : (
                  <>
                    <Code className="w-4 h-4" />
                    Generate Scaffolding
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setResult(null);
                  setError(null);
                }}
                className="px-4 py-2 text-sm text-white/50 hover:text-white transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleApply}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-all"
              >
                <Check className="w-4 h-4" />
                Apply to Code
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
