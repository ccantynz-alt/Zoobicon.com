"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Loader2,
} from "lucide-react";

export default function OAuthCallbackPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const userData = searchParams.get("user");
    if (userData) {
      try {
        const user = JSON.parse(decodeURIComponent(userData));
        localStorage.setItem("zoobicon_user", JSON.stringify(user));
        window.location.href = "/dashboard";
        return;
      } catch {
        window.location.href = "/auth/login?error=invalid_callback";
      }
    } else {
      window.location.href = "/auth/login?error=no_user_data";
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-white/50 mx-auto mb-4" />
        <p className="text-white/60 text-sm">Signing you in...</p>
      </div>
    </div>
  );
}
