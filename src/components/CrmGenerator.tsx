"use client";

import { useState } from "react";
import {
  Users,
  DollarSign,
  FileText,
  BarChart3,
  Mail,
  Kanban,
  Calendar,
  CheckSquare,
  UserCircle,
  Clock,
  Loader2,
  Briefcase,
} from "lucide-react";

interface CrmGeneratorProps {
  onGenerate: (html: string) => void;
}

interface FeatureOption {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const FEATURE_OPTIONS: FeatureOption[] = [
  {
    id: "contact-management",
    label: "Contact Management",
    description: "Add, edit, search, and organize contacts",
    icon: <Users className="w-5 h-5" />,
  },
  {
    id: "lead-tracking",
    label: "Lead Tracking",
    description: "Track leads through your sales funnel",
    icon: <UserCircle className="w-5 h-5" />,
  },
  {
    id: "invoice-generation",
    label: "Invoice Generation",
    description: "Create professional invoices with PDF layout",
    icon: <FileText className="w-5 h-5" />,
  },
  {
    id: "payment-tracking",
    label: "Payment Tracking",
    description: "Monitor payments, balances, and overdue invoices",
    icon: <DollarSign className="w-5 h-5" />,
  },
  {
    id: "email-templates",
    label: "Email Templates",
    description: "Pre-built email templates with variables",
    icon: <Mail className="w-5 h-5" />,
  },
  {
    id: "pipeline-view",
    label: "Pipeline View",
    description: "Kanban board for deal stages",
    icon: <Kanban className="w-5 h-5" />,
  },
  {
    id: "analytics-dashboard",
    label: "Analytics Dashboard",
    description: "Revenue charts, conversion rates, and trends",
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    id: "task-management",
    label: "Task Management",
    description: "To-do lists with priorities and due dates",
    icon: <CheckSquare className="w-5 h-5" />,
  },
  {
    id: "client-portal",
    label: "Client Portal",
    description: "Client-facing view with invoices and status",
    icon: <Briefcase className="w-5 h-5" />,
  },
  {
    id: "appointment-scheduling",
    label: "Appointment Scheduling",
    description: "Calendar view with booking and reminders",
    icon: <Calendar className="w-5 h-5" />,
  },
];

const BUSINESS_TYPES = [
  "Agency",
  "Freelancer",
  "Consultant",
  "SaaS",
  "Retail",
  "Services",
];

const COLOR_SCHEMES = [
  { name: "Blue", primary: "#3b82f6", bg: "bg-blue-500" },
  { name: "Purple", primary: "#8b5cf6", bg: "bg-purple-500" },
  { name: "Emerald", primary: "#10b981", bg: "bg-emerald-500" },
  { name: "Rose", primary: "#f43f5e", bg: "bg-rose-500" },
  { name: "Amber", primary: "#f59e0b", bg: "bg-amber-500" },
  { name: "Cyan", primary: "#06b6d4", bg: "bg-cyan-500" },
];

export default function CrmGenerator({ onGenerate }: CrmGeneratorProps) {
  const [showConfig, setShowConfig] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("Agency");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([
    "contact-management",
    "lead-tracking",
    "invoice-generation",
    "analytics-dashboard",
  ]);
  const [selectedColorScheme, setSelectedColorScheme] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleFeature = (featureId: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(featureId)
        ? prev.filter((f) => f !== featureId)
        : [...prev, featureId]
    );
  };

  const selectAll = () => {
    setSelectedFeatures(FEATURE_OPTIONS.map((f) => f.id));
  };

  const deselectAll = () => {
    setSelectedFeatures([]);
  };

  const handleGenerate = async () => {
    if (!businessName.trim()) {
      setError("Please enter a business name");
      return;
    }

    if (selectedFeatures.length === 0) {
      setError("Please select at least one feature");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/crm/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: businessName.trim(),
          businessType,
          features: selectedFeatures,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate CRM");
      }

      onGenerate(data.html);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!showConfig) {
    return (
      <button
        onClick={() => setShowConfig(true)}
        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-600 hover:from-blue-500 hover:to-blue-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
      >
        <Briefcase className="w-5 h-5" />
        Generate CRM System
      </button>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 bg-gradient-to-r from-blue-600/20 to-blue-600/20 border-b border-gray-700">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-blue-400" />
          CRM System Generator
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Configure and generate a complete CRM dashboard for your business
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Business Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Business Name
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Acme Corp"
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Business Type
            </label>
            <select
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              {BUSINESS_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Color Scheme */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Color Scheme
          </label>
          <div className="flex gap-3">
            {COLOR_SCHEMES.map((scheme, index) => (
              <button
                key={scheme.name}
                onClick={() => setSelectedColorScheme(index)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                  selectedColorScheme === index
                    ? "border-white bg-gray-800 shadow-lg"
                    : "border-gray-700 hover:border-gray-500"
                }`}
              >
                <div className={`w-4 h-4 rounded-full ${scheme.bg}`} />
                <span className="text-sm text-gray-300">{scheme.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Features */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-300">
              Features ({selectedFeatures.length} selected)
            </label>
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Select All
              </button>
              <span className="text-gray-600">|</span>
              <button
                onClick={deselectAll}
                className="text-xs text-gray-400 hover:text-gray-300 transition-colors"
              >
                Deselect All
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {FEATURE_OPTIONS.map((feature) => {
              const isSelected = selectedFeatures.includes(feature.id);
              return (
                <button
                  key={feature.id}
                  onClick={() => toggleFeature(feature.id)}
                  className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                    isSelected
                      ? "border-blue-500/50 bg-blue-500/10 shadow-sm"
                      : "border-gray-700 hover:border-gray-600 hover:bg-gray-800/50"
                  }`}
                >
                  <div
                    className={`mt-0.5 p-1.5 rounded-md ${
                      isSelected
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-gray-800 text-gray-500"
                    }`}
                  >
                    {feature.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-medium ${
                          isSelected ? "text-white" : "text-gray-300"
                        }`}
                      >
                        {feature.label}
                      </span>
                      {isSelected && (
                        <Clock className="w-3.5 h-3.5 text-blue-400" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {feature.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setShowConfig(false)}
            className="px-4 py-2 text-sm text-gray-400 hover:text-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-600 hover:from-blue-500 hover:to-blue-500 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl disabled:shadow-none transition-all duration-200 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating CRM...
              </>
            ) : (
              <>
                <BarChart3 className="w-5 h-5" />
                Generate CRM
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
