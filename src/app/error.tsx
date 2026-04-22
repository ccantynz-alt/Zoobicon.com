"use client";

import { useEffect, useState } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [retryCount, setRetryCount] = useState(0);
  const [autoRetrying, setAutoRetrying] = useState(true);
  const maxAutoRetries = 3;

  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  // Auto-retry up to 3 times with exponential backoff
  useEffect(() => {
    if (retryCount >= maxAutoRetries) {
      setAutoRetrying(false);
      return;
    }

    const delay = Math.pow(2, retryCount) * 500; // 500ms, 1s, 2s
    const timer = setTimeout(() => {
      setRetryCount((c) => c + 1);
      reset();
    }, delay);

    return () => clearTimeout(timer);
  }, [retryCount, reset]);

  // If still auto-retrying, show minimal loading state
  if (autoRetrying && retryCount < maxAutoRetries) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a1628",
          color: "#e0e0e0",
          fontFamily: '"Inter", system-ui, sans-serif',
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "3px solid rgba(37, 99, 235, 0.2)",
              borderTopColor: "#2563eb",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)" }}>
            Recovering... (attempt {retryCount + 1}/{maxAutoRetries})
          </p>
          <style dangerouslySetInnerHTML={{ __html: `@keyframes spin{to{transform:rotate(360deg)}}` }} />
        </div>
      </div>
    );
  }

  // After auto-retries exhausted, show manual retry UI
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a1628",
        color: "#e0e0e0",
        fontFamily: '"Inter", system-ui, sans-serif',
        padding: "24px",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: "480px" }}>
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "16px",
            background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
            fontSize: "28px",
          }}
        >
          ⚡
        </div>
        <h2
          style={{
            fontSize: "24px",
            fontWeight: 800,
            marginBottom: "12px",
          }}
        >
          Something went wrong
        </h2>
        <p
          style={{
            fontSize: "14px",
            color: "rgba(255,255,255,0.4)",
            lineHeight: 1.6,
            marginBottom: "24px",
          }}
        >
          We tried to recover automatically but couldn&apos;t. Please try again or refresh the page.
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <button
            onClick={() => {
              setRetryCount(0);
              setAutoRetrying(true);
              reset();
            }}
            style={{
              padding: "12px 32px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              color: "white",
              border: "none",
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
          <button
            onClick={() => {
              if (typeof window !== "undefined") window.location.href = "/";
            }}
            style={{
              padding: "12px 32px",
              borderRadius: "12px",
              background: "rgba(255,255,255,0.06)",
              color: "white",
              border: "1px solid rgba(255,255,255,0.1)",
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}
