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

import { type NextRequest, type NextResponse } from "next/server";

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

    // ── Call the real x402 middleware (unmodified) ──
    const response = await x402Middleware(req);

    const durationMs = Date.now() - startedAt;
    const status = response.status as 200 | 402 | 403;

    // ── Extract settlement info from response headers ──
    // On 200, the facilitator attaches PAYMENT-RESPONSE (base64 JSON).
    // We only need the txHash from it; everything else stays opaque.
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
          // Silently ignore malformed headers — never crash the payment flow
        }
      }
    }

    // ── Build lifecycle stages we can infer from timing ──
    // We know the total duration and the status.  Fine-grained stage
    // timings (verify vs settle) require hooking into the facilitator
    // calls themselves — out of scope for the wrapper.  We approximate
    // the dominant stages here for the inspector view.
    const lifecycle = buildApproximateLifecycle(status, startedAt, durationMs);

    // ── Fire-and-forget: POST to our own ingest endpoint ──
    // Uses the request's origin so it works on localhost AND Vercel.
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

    // ── Return the original response completely untouched ──
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

function buildApproximateLifecycle(
  status: 200 | 402 | 403,
  startedAt: number,
  totalMs: number
) {
  const stages: Array<{ stage: string; timestampMs: number; durationMs: number }> = [];

  // Every request starts with the initial hit
  stages.push({ stage: "request_received", timestampMs: startedAt, durationMs: 1 });

  if (status === 402) {
    // No payment was provided — the middleware returned 402 immediately.
    // The only meaningful latency is the middleware's own check (~1 ms).
    stages.push({ stage: "402_issued", timestampMs: startedAt + 1, durationMs: totalMs - 1 });
    return stages;
  }

  // For 200 or 403, the client DID send a payment signature.
  // Approximate the breakdown: verify ~40%, settle ~40%, overhead ~20%
  const verifyMs = Math.round(totalMs * 0.4);
  const settleMs = Math.round(totalMs * 0.4);
  const overheadMs = totalMs - verifyMs - settleMs;

  stages.push({ stage: "payment_signed", timestampMs: startedAt + overheadMs, durationMs: overheadMs });
  stages.push({ stage: "facilitator_verify", timestampMs: startedAt + overheadMs, durationMs: verifyMs });

  if (status === 403) {
    // Verification failed — no settlement attempted
    return stages;
  }

  // status === 200: verify passed, then settle
  stages.push({ stage: "facilitator_settle", timestampMs: startedAt + overheadMs + verifyMs, durationMs: settleMs });
  stages.push({ stage: "settled", timestampMs: startedAt + overheadMs + verifyMs + settleMs, durationMs: 0 });
  stages.push({ stage: "response_sent", timestampMs: startedAt + totalMs, durationMs: 0 });

  return stages;
}
