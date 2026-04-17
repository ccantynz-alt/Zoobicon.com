"use client";

import { useState, useRef } from "react";
import {
  ShoppingCart,
  Package,
  Tag,
  Search,
  Heart,
  Star,
  Truck,
  Percent,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  Upload,
} from "lucide-react";

interface Product {
  name: string;
  price: number;
  description: string;
}

interface EcommerceGeneratorProps {
  onGenerate: (html: string) => void;
}

const BUSINESS_TYPES = [
  { label: "Fashion", icon: "👗" },
  { label: "Electronics", icon: "💻" },
  { label: "Food", icon: "🍕" },
  { label: "Beauty", icon: "💄" },
  { label: "Home", icon: "🏠" },
  { label: "Sports", icon: "⚽" },
  { label: "Books", icon: "📚" },
  { label: "Custom", icon: "✨" },
];

const FEATURES = [
  { id: "shopping-cart", label: "Shopping Cart", icon: ShoppingCart },
  { id: "checkout", label: "Checkout", icon: Package },
  { id: "product-search", label: "Product Search", icon: Search },
  { id: "product-filters", label: "Product Filters", icon: Tag },
  { id: "wishlist", label: "Wishlist", icon: Heart },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "inventory-tracking", label: "Inventory Tracking", icon: Package },
  { id: "discount-codes", label: "Discount Codes", icon: Percent },
  { id: "shipping-calculator", label: "Shipping Calculator", icon: Truck },
  { id: "order-tracking", label: "Order Tracking", icon: Truck },
];

const THEMES = [
  {
    id: "modern-minimal",
    label: "Modern Minimal",
    colors: ["#ffffff", "#f5f5f5", "#1a1a1a"],
    description: "Clean lines, ample whitespace, subtle accents",
  },
  {
    id: "bold-colorful",
    label: "Bold & Colorful",
    colors: ["#ff6b6b", "#4ecdc4", "#ffe66d"],
    description: "Vibrant colors, playful design, energetic feel",
  },
  {
    id: "luxury-dark",
    label: "Luxury Dark",
    colors: ["#0a0a0a", "#1a1a2e", "#d4af37"],
    description: "Dark backgrounds, gold accents, premium feel",
  },
  {
    id: "clean-light",
    label: "Clean Light",
    colors: ["#f8f9fa", "#e9ecef", "#495057"],
    description: "Light palette, soft shadows, airy layout",
  },
];

const STEPS = ["Business Type", "Products", "Features", "Theme"];

export default function EcommerceGenerator({ onGenerate }: EcommerceGeneratorProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [businessType, setBusinessType] = useState("");
  const [customBusinessType, setCustomBusinessType] = useState("");
  const [products, setProducts] = useState<Product[]>([
    { name: "", price: 0, description: "" },
  ]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([
    "shopping-cart",
    "checkout",
  ]);
  const [selectedTheme, setSelectedTheme] = useState("modern-minimal");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCsvPaste, setShowCsvPaste] = useState(false);
  const [csvText, setCsvText] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const effectiveBusinessType =
    businessType === "Custom" ? customBusinessType : businessType;

  const addProduct = () => {
    setProducts([...products, { name: "", price: 0, description: "" }]);
  };

  const removeProduct = (index: number) => {
    if (products.length > 1) {
      setProducts(products.filter((_, i) => i !== index));
    }
  };

  const updateProduct = (index: number, field: keyof Product, value: string | number) => {
    const updated = [...products];
    updated[index] = { ...updated[index], [field]: value };
    setProducts(updated);
  };

  const parseCsv = () => {
    const lines = csvText.trim().split("\n");
    const parsed: Product[] = [];
    for (const line of lines) {
      const parts = line.split(",").map((s) => s.trim());
      if (parts.length >= 2) {
        parsed.push({
          name: parts[0],
          price: parseFloat(parts[1]) || 0,
          description: parts[2] || "",
        });
      }
    }
    if (parsed.length > 0) {
      setProducts(parsed);
      setShowCsvPaste(false);
      setCsvText("");
    }
  };

  const toggleFeature = (featureId: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(featureId)
        ? prev.filter((f) => f !== featureId)
        : [...prev, featureId]
    );
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 0:
        return businessType !== "" && (businessType !== "Custom" || customBusinessType.trim() !== "");
      case 1:
        return products.some((p) => p.name.trim() !== "" && p.price > 0);
      case 2:
        return selectedFeatures.length > 0;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setGeneratedHtml(null);

    const validProducts = products.filter((p) => p.name.trim() !== "" && p.price > 0);

    try {
      const res = await fetch("/api/ecommerce/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessType: effectiveBusinessType,
          products: validProducts.map((p) => ({
            name: p.name,
            price: p.price,
            ...(p.description ? { description: p.description } : {}),
          })),
          features: selectedFeatures,
          theme: THEMES.find((t) => t.id === selectedTheme)?.label,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate store");
      }

      setGeneratedHtml(data.html);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseStore = () => {
    if (generatedHtml) {
      onGenerate(generatedHtml);
    }
  };

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-12 h-12 text-stone-500 animate-spin mb-6" />
        <h2 className="text-2xl font-bold text-white mb-2">Building your store...</h2>
        <p className="text-zinc-400 text-center max-w-md">
          Generating a complete e-commerce storefront for your {effectiveBusinessType} business
          with {products.filter((p) => p.name.trim()).length} products and{" "}
          {selectedFeatures.length} features.
        </p>
      </div>
    );
  }

  if (generatedHtml) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div>
            <h2 className="text-lg font-bold text-white">Your Store Preview</h2>
            <p className="text-sm text-zinc-400">
              {effectiveBusinessType} store with {products.filter((p) => p.name.trim()).length}{" "}
              products
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setGeneratedHtml(null)}
              className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4 inline mr-1" />
              Back to Editor
            </button>
            <button
              onClick={handleUseStore}
              className="px-4 py-2 rounded-lg bg-stone-600 hover:bg-stone-500 text-white transition-colors text-sm font-medium"
            >
              Use This Store
              <ArrowRight className="w-4 h-4 inline ml-1" />
            </button>
          </div>
        </div>
        <div className="flex-1 bg-white">
          <iframe
            ref={iframeRef}
            srcDoc={generatedHtml}
            className="w-full h-full border-0"
            title="Store Preview"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          {STEPS.map((step, i) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  i <= currentStep
                    ? "bg-stone-600 text-white"
                    : "bg-zinc-800 text-zinc-500"
                }`}
              >
                {i + 1}
              </div>
              <span
                className={`ml-2 text-sm hidden sm:inline ${
                  i <= currentStep ? "text-white" : "text-zinc-500"
                }`}
              >
                {step}
              </span>
              {i < STEPS.length - 1 && (
                <div
                  className={`w-12 sm:w-20 h-0.5 mx-2 transition-colors ${
                    i < currentStep ? "bg-stone-600" : "bg-zinc-800"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-stone-500/10 border border-stone-500/30 text-stone-400 text-sm">
          {error}
        </div>
      )}

      {/* Step 1: Business Type */}
      {currentStep === 0 && (
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">What type of business?</h2>
          <p className="text-zinc-400 mb-6">
            Choose a category that best describes your store.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {BUSINESS_TYPES.map((type) => (
              <button
                key={type.label}
                onClick={() => setBusinessType(type.label)}
                className={`p-4 rounded-xl border text-center transition-all ${
                  businessType === type.label
                    ? "border-stone-500 bg-stone-500/10 text-white"
                    : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-600"
                }`}
              >
                <div className="text-2xl mb-2">{type.icon}</div>
                <div className="text-sm font-medium">{type.label}</div>
              </button>
            ))}
          </div>
          {businessType === "Custom" && (
            <input
              type="text"
              placeholder="Enter your business type..."
              value={customBusinessType}
              onChange={(e) => setCustomBusinessType(e.target.value)}
              className="mt-4 w-full p-3 rounded-lg bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-stone-500"
            />
          )}
        </div>
      )}

      {/* Step 2: Products */}
      {currentStep === 1 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-white">Add your products</h2>
            <button
              onClick={() => setShowCsvPaste(!showCsvPaste)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 transition-colors"
            >
              <Upload className="w-4 h-4" />
              CSV Paste
            </button>
          </div>
          <p className="text-zinc-400 mb-6">
            Add the products you want in your store. At least one product is required.
          </p>

          {showCsvPaste && (
            <div className="mb-6 p-4 rounded-lg bg-zinc-900 border border-zinc-700">
              <p className="text-sm text-zinc-400 mb-2">
                Paste CSV data (name, price, description per line):
              </p>
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder={"T-Shirt, 29.99, Premium cotton tee\nJeans, 59.99, Slim fit denim"}
                rows={5}
                className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-600 text-white placeholder-zinc-500 focus:outline-none focus:border-stone-500 text-sm font-mono"
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={parseCsv}
                  className="px-3 py-1.5 rounded-lg bg-stone-600 hover:bg-stone-500 text-white text-sm transition-colors"
                >
                  Import
                </button>
                <button
                  onClick={() => {
                    setShowCsvPaste(false);
                    setCsvText("");
                  }}
                  className="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {products.map((product, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-400">
                    Product {i + 1}
                  </span>
                  {products.length > 1 && (
                    <button
                      onClick={() => removeProduct(i)}
                      className="text-zinc-500 hover:text-stone-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Product name"
                    value={product.name}
                    onChange={(e) => updateProduct(i, "name", e.target.value)}
                    className="p-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-stone-500 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    min="0"
                    step="0.01"
                    value={product.price || ""}
                    onChange={(e) =>
                      updateProduct(i, "price", parseFloat(e.target.value) || 0)
                    }
                    className="p-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-stone-500 text-sm"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={product.description}
                  onChange={(e) => updateProduct(i, "description", e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-stone-500 text-sm"
                />
              </div>
            ))}
          </div>
          <button
            onClick={addProduct}
            className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors text-sm w-full justify-center"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      )}

      {/* Step 3: Features */}
      {currentStep === 2 && (
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Select features</h2>
          <p className="text-zinc-400 mb-6">
            Choose the functionality to include in your store.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              const isSelected = selectedFeatures.includes(feature.id);
              return (
                <button
                  key={feature.id}
                  onClick={() => toggleFeature(feature.id)}
                  className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                    isSelected
                      ? "border-stone-500 bg-stone-500/10 text-white"
                      : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isSelected ? "bg-stone-500/20" : "bg-zinc-800"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium">{feature.label}</span>
                  <div
                    className={`ml-auto w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      isSelected
                        ? "border-stone-500 bg-stone-500"
                        : "border-zinc-600"
                    }`}
                  >
                    {isSelected && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 4: Theme */}
      {currentStep === 3 && (
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Choose a theme</h2>
          <p className="text-zinc-400 mb-6">
            Select the visual style for your storefront.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => setSelectedTheme(theme.id)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  selectedTheme === theme.id
                    ? "border-stone-500 bg-stone-500/10"
                    : "border-zinc-800 bg-zinc-900 hover:border-zinc-600"
                }`}
              >
                <div className="flex gap-1.5 mb-3">
                  {theme.colors.map((color, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-lg border border-zinc-700"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="text-sm font-medium text-white">{theme.label}</div>
                <div className="text-xs text-zinc-500 mt-1">{theme.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-8">
        <button
          onClick={() => setCurrentStep((s) => s - 1)}
          disabled={currentStep === 0}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            currentStep === 0
              ? "text-zinc-600 cursor-not-allowed"
              : "text-zinc-300 hover:text-white border border-zinc-700 hover:border-zinc-500"
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {currentStep < STEPS.length - 1 ? (
          <button
            onClick={() => setCurrentStep((s) => s + 1)}
            disabled={!canProceed()}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              canProceed()
                ? "bg-stone-600 hover:bg-stone-500 text-white"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
            }`}
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleGenerate}
            disabled={!canProceed()}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              canProceed()
                ? "bg-gradient-to-r from-stone-600 to-stone-700 hover:from-stone-500 hover:to-stone-600 text-white"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            Generate Store
          </button>
        )}
      </div>
    </div>
  );
}
