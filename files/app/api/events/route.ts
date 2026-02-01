// app/api/events/route.ts
//
// Ingest endpoint for pay402 instrumentation events.
// The middleware wrapper POSTs here after every x402 transaction.
// This is a server-side-only route — no client bundle impact.

import { NextResponse } from "next/server";
import { recordEvent } from "@/lib/event-store";
import type { PaymentStatus } from "@/types/pay402";

// ─── POST /api/events ───────────────────────────────────────────

export async function POST(req: Request): Promise<NextResponse> {
  let body: Record<string, unknown>;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // ── Validate required fields ──
  const { dashboardId, endpoint, status, durationMs } = body;

  if (
    typeof dashboardId !== "string" ||
    typeof endpoint !== "string" ||
    typeof status !== "number" ||
    typeof durationMs !== "number"
  ) {
    return NextResponse.json(
      { error: "Missing or invalid required fields: dashboardId, endpoint, status, durationMs" },
      { status: 400 }
    );
  }

  // ── Whitelist valid status codes ──
  const validStatuses: PaymentStatus[] = [200, 402, 403];
  if (!validStatuses.includes(status as PaymentStatus)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
      { status: 400 }
    );
  }

  // ── Derive amountUSDC from the endpoint's configured price ──
  // In production you'd store this in a DB keyed by endpoint.
  // Here we read the same ROUTES config the middleware uses.
  const PRICE_MAP: Record<string, number> = {
    "/api/premium/weather": 1000 / 1_000_000, // 0.001 USDC
    "/api/premium/quotes": 500 / 1_000_000, // 0.0005 USDC
  };
  const amountUSDC =
    status === 200
      ? PRICE_MAP[endpoint as string] ?? 0
      : 0; // failed payments don't generate revenue

  // ── Write to store ──
  const event = recordEvent({
    dashboardId: dashboardId as string,
    endpoint: endpoint as string,
    status: status as PaymentStatus,
    amountUSDC,
    durationMs: durationMs as number,
    txHash: (body.txHash as string) ?? null,
    payer: (body.payer as string) ?? null,
    lifecycle: Array.isArray(body.lifecycle) ? body.lifecycle : [],
  });

  return NextResponse.json({ ok: true, id: event.id }, { status: 201 });
}
