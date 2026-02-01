// lib/pay402-middleware.ts
//
// This module wraps the aptos-x402 paymentMiddleware (the same one used
// in the Canteen workshop repo) and records timing + outcome for every
// request that passes through it.
//
// Usage in middleware.ts:
//   import { paymentMiddleware } from "aptos-x402";
//   import { withpay402Tracking } from "@/lib/pay402-middleware";
//
//   const x402 = paymentMiddleware(RECIPIENT, ROUTES, { url: FACILITATOR });
//   export const middleware = withpay402Tracking(x402, { dashboardId: "..." });
//
// Design decisions:
//   • The wrapper returns the ORIGINAL NextResponse unmodified — judges
//     and end-users see zero difference in behaviour.
//   • emitEvent() is fire-and-forget (no await) so it can never add
//     latency to the critical payment path.
//   • txHash is read from the PAYMENT-RESPONSE header that the
//     facilitator attaches on successful settlement (see cheatsheet).
//   • REAL-TIME LIFECYCLE: We monkey-patch globalThis.fetch during the
//     execution of the x402 middleware to capture the exact timing of
//     calls to the facilitator (/verify and /settle).

import { type NextRequest, type NextResponse } from "next/server";
import type { LifecycleEvent, LifecycleStage } from "@/types/pay402";

interface pay402TrackingConfig {
  dashboardId: string;
  /** Override for unit-testing; defaults to the same origin */
  ingestUrl?: string;
}

type X402Middleware = (req: NextRequest) => Promise<NextResponse>;

export function withpay402Tracking(
  x402Middleware: X402Middleware,
  config: pay402TrackingConfig
): X402Middleware {
  return async (req: NextRequest): Promise<NextResponse> => {
    const startedAt = Date.now();
    const lifecycle: LifecycleEvent[] = [];

    // 1. Initial event: request arrives at server
    lifecycle.push({
      stage: "request_received",
      timestampMs: startedAt,
      durationMs: 0,
    });

    // 2. Monkey-patch fetch to intercept facilitator calls
    // This allows us to measure "facilitator_verify" and "facilitator_settle"
    // perfectly without modifying the underlying SDK.
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input, init) => {
      const startMs = Date.now();
      const url = String(input);
      let stage: LifecycleStage | null = null;

      if (url.includes("/verify")) stage = "facilitator_verify";
      else if (url.includes("/settle")) stage = "facilitator_settle";

      try {
        const res = await originalFetch(input, init);
        if (stage) {
          const durationMs = Date.now() - startMs;
          lifecycle.push({
            stage,
            timestampMs: startMs,
            durationMs,
            meta: { status: res.status }
          });
        }
        return res;
      } catch (err) {
        if (stage) {
          const durationMs = Date.now() - startMs;
          lifecycle.push({
            stage,
            timestampMs: startMs,
            durationMs,
            meta: { error: String(err) }
          });
        }
        throw err;
      }
    };

    // 3. Run the real middleware (now instrumented via fetch)
    let response: NextResponse;
    try {
      response = await x402Middleware(req);
    } finally {
      // ALWAYS restore fetch, even if middleware crashes
      globalThis.fetch = originalFetch;
    }

    const completedAt = Date.now();
    const durationMs = completedAt - startedAt;
    const status = response.status as 200 | 402 | 403;

    // 4. Extract settlement info if successful
    let txHash: string | null = null;
    let payer: string | null = null;

    if (status === 200) {
      const paymentResponseRaw = response.headers.get("PAYMENT-RESPONSE");
      if (paymentResponseRaw) {
        try {
          const decoded = JSON.parse(
            Buffer.from(paymentResponseRaw, "base64").toString("utf-8")
          );
          txHash = decoded.txHash ?? decoded.transaction?.hash ?? null;
          payer = decoded.payer ?? decoded.sender ?? null;
        } catch {
          // Silently ignore malformed headers
        }
      }
    }

    // 5. Fill in the gaps in the lifecycle
    if (status === 402) {
      // Immediate rejection (no payment provided)
      lifecycle.push({
        stage: "402_issued",
        timestampMs: completedAt,
        durationMs: 0
      });
    } else {
      // Status 200 or 403 means we attempted verification.
      // Therefore, a payment was provided (signed by client).
      // We record "payment_signed" as having happened just before/at the start.
      lifecycle.push({
        stage: "payment_signed",
        timestampMs: startedAt,
        durationMs: 0
      });

      // If successful, we consider it "settled" now
      if (status === 200) {
        lifecycle.push({
          stage: "settled",
          timestampMs: completedAt,
          durationMs: 0
        });
      }

      lifecycle.push({
        stage: "response_sent",
        timestampMs: completedAt,
        durationMs: 0
      });
    }

    // Sort events chronologically to be sure
    lifecycle.sort((a, b) => a.timestampMs - b.timestampMs);

    // 6. Fire-and-forget: POST to our ingest endpoint
    const origin = req.nextUrl.origin;
    const ingestUrl = config.ingestUrl ?? `${origin}/api/events`;

    emitEvent(ingestUrl, {
      dashboardId: config.dashboardId,
      endpoint: req.nextUrl.pathname,
      status,
      durationMs,
      txHash,
      payer,
      lifecycle,
    }).catch(() => {
      // Swallow errors — analytics must never break payments
    });

    return response;
  };
}

// ─── Internal helpers ──────────────────────────────────────────

async function emitEvent(url: string, body: unknown): Promise<void> {
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
