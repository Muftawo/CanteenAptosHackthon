// middleware.ts
//
// Next.js root middleware — the single entry point for all x402 payment
// gating in this app.
//
// References from the Technical Cheatsheet:
//   • Facilitator: https://x402-navy.vercel.app/facilitator
//   • Network:     aptos:2  (testnet)
//   • USDC asset:  0x69091f…  (testnet fungible asset)
//   • Price unit:  atomic USDC (1 USDC = 1_000_000)
//
// The aptos-x402 paymentMiddleware signature (from the workshop repo):
//   paymentMiddleware(recipientAddress, routeConfig, facilitatorConfig)
//
// We wrap the result with withpay402Tracking so every request that
// passes through is recorded for the analytics dashboard.

import { paymentMiddleware } from "aptos-x402";
import { withpay402Tracking } from "@/lib/pay402-middleware";

// ─── Environment ────────────────────────────────────────────────
// ─── Environment ────────────────────────────────────────────────
const RECIPIENT = process.env.PAYMENT_RECIPIENT_ADDRESS!;
const FACILITATOR_URL = process.env.FACILITATOR_URL ?? "https://x402-navy.vercel.app/facilitator";
const DASHBOARD_ID = process.env.pay402_DASHBOARD_ID ?? "pay402_demo_001";
const USDC_ASSET = process.env.USDC_ASSET_ADDRESS!;

console.log("Middleware Init:", {
  RECIPIENT: RECIPIENT ? "Defined" : "Missing",
  // FACILITATOR_URL,
  // USDC_ASSET,
  // DASHBOARD_ID
});

const ROUTES: Record<string, { price: string; network: string; asset: string; recipient?: string }> = {
  "/api/premium/weather": {
    price: "1000",
    network: "aptos:2",
    asset: USDC_ASSET,
    recipient: RECIPIENT,
  },
  "/api/premium/quotes": {
    price: "500",
    network: "aptos:2",
    asset: USDC_ASSET,
    recipient: RECIPIENT,
  },
};

// ─── Build the x402 middleware ──────────────────────────────────
const x402 = paymentMiddleware(RECIPIENT, ROUTES, { url: FACILITATOR_URL });
export const middleware = withpay402Tracking(x402 as any, {
  dashboardId: DASHBOARD_ID,
});

// ─── Matcher: only intercept the API routes we care about ───────
// Next.js only invokes this middleware for paths matching the config.
// We include ALL /api/* paths so that:
//   • /api/premium/*  → hits x402 → gets gated (or instrumented as free)
//   • /api/events     → passes through (not in ROUTES, so x402 is a no-op)
//   • /api/dashboard  → same pass-through
export const config = {
  matcher: ["/api/premium/:path*"],
};
