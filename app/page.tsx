"use client";
// app/page.tsx
//
// Landing page.  Two jobs:
//   1. A single "Go to Dashboard" CTA that routes to /dashboard.
//   2. A "Fire Test Payment" button that uses x402axios (the Aptos
//      x402 client from the cheatsheet) to hit /api/premium/weather
//      with the test wallet's private key.  The result appears in
//      the live dashboard within 2 seconds.

import { useState } from "react";
import { useRouter } from "next/navigation";

// x402axios is the client-side payment agent from the aptos-x402 package.
// It automatically: detects 402 → signs an Aptos tx → retries with payment.
// See: Technical Cheatsheet → "For Buyers: Zero-Config Client"
import { x402axios } from "aptos-x402";

export default function HomePage() {
  const router = useRouter();
  const [testStatus, setTestStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [testResult, setTestResult] = useState<string | null>(null);

  // ── Fire a real x402 payment using the test wallet ──
  // NEXT_PUBLIC_APTOS_PRIVATE_KEY is exposed to the client intentionally
  // for the demo.  In production, payments would be initiated by a
  // browser wallet (Petra) instead.
  const handleTestPayment = async () => {
    setTestStatus("loading");
    setTestResult(null);
    try {
      const privateKey = process.env.NEXT_PUBLIC_APTOS_PRIVATE_KEY;
      if (!privateKey) {
        throw new Error("NEXT_PUBLIC_APTOS_PRIVATE_KEY not set in .env.local");
      }

      const response = await x402axios.get("/api/premium/weather", {
        privateKey,
      });

      setTestResult(JSON.stringify(response.data, null, 2));
      setTestStatus("success");
    } catch (err: unknown) {
      setTestResult(
        err instanceof Error ? err.message : "Unknown error occurred"
      );
      setTestStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 py-16 gap-10">
      {/* ─── Hero ─── */}
      <div className="text-center max-w-2xl">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm font-medium px-3 py-1 rounded-full mb-4">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          Canteen × Aptos × x402 Hackathon
        </div>
        <h1 className="text-5xl font-bold text-white mb-3 leading-tight">
          Pay<span className="text-blue-400">402</span>
        </h1>
        <p className="text-gray-400 text-lg">
          Real-time payment analytics & developer dashboard for x402 on Aptos.
          Watch micropayments flow, debug failures, and track revenue — live.
        </p>
      </div>

      {/* ─── Action cards ─── */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-2xl">
        {/* Dashboard CTA */}
        <button
          onClick={() => router.push("/dashboard")}
          className="flex-1 card-glass p-6 text-left hover:border-blue-500/50 transition-colors cursor-pointer group"
        >
          <div className="text-2xl mb-2">📊</div>
          <h2 className="text-white font-semibold text-lg group-hover:text-blue-400 transition-colors">
            Open Dashboard
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Live transaction feed, revenue charts, and failure diagnosis.
          </p>
        </button>

        {/* Test payment CTA */}
        <button
          onClick={handleTestPayment}
          disabled={testStatus === "loading"}
          className="flex-1 card-glass p-6 text-left hover:border-emerald-500/50 transition-colors cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="text-2xl mb-2">
            {testStatus === "loading" ? "⏳" : "⚡"}
          </div>
          <h2 className="text-white font-semibold text-lg group-hover:text-emerald-400 transition-colors">
            {testStatus === "loading" ? "Paying…" : "Fire Test Payment"}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Sends 0.001 USDC to /weather via x402axios. Watch it appear live.
          </p>
        </button>
      </div>

      {/* ─── Test result panel ─── */}
      {testResult && (
        <div
          className={`w-full max-w-2xl card-glass p-4 ${
            testStatus === "success" ? "border-emerald-500/40" : "border-red-500/40"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`text-xs font-mono px-2 py-0.5 rounded ${
                testStatus === "success" ? "badge-success" : "badge-error"
              }`}
            >
              {testStatus === "success" ? "200 OK" : "ERROR"}
            </span>
            <span className="text-gray-500 text-xs font-mono">
              /api/premium/weather
            </span>
          </div>
          <pre className="code-block whitespace-pre-wrap">{testResult}</pre>
        </div>
      )}

      {/* ─── Endpoint reference ─── */}
      <div className="w-full max-w-2xl">
        <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">
          Available Endpoints
        </h3>
        <div className="card-glass rounded-lg overflow-hidden">
          {[
            { path: "/api/premium/weather", price: "0.001 USDC", desc: "Weather data (pay-gated)" },
            { path: "/api/premium/quotes",  price: "0.0005 USDC", desc: "Quotes (pay-gated)" },
            { path: "/api/premium/preview", price: "Free",        desc: "Preview (no payment)" },
          ].map((ep, i) => (
            <div
              key={ep.path}
              className={`flex items-center justify-between px-4 py-3 ${
                i !== 2 ? "border-b border-gray-800" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                  GET
                </span>
                <span className="font-mono text-sm text-gray-300">{ep.path}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-500 text-xs">{ep.desc}</span>
                <span
                  className={`text-xs font-mono px-2 py-0.5 rounded ${
                    ep.price === "Free" ? "badge-success" : "badge-warning"
                  }`}
                >
                  {ep.price}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
