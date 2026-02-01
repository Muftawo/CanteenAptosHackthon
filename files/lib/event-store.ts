// lib/event-store.ts
import { v4 as uuidv4 } from "uuid";
import type {
  PaymentEvent,
  PaymentStatus,
  FailureReason,
  LifecycleEvent,
  DashboardSummary,
  EndpointSummary,
  RevenueDataPoint,
} from "@/types/pay402";

// ─── Singleton store ────────────────────────────────────────────
// Next.js API routes on Vercel share this module-level array within
// a single serverless instance.  For production, replace with a DB.
const events: PaymentEvent[] = [];

// ─── Write ──────────────────────────────────────────────────────

export function recordEvent(raw: {
  dashboardId: string;
  endpoint: string;
  status: PaymentStatus;
  amountUSDC: number;
  durationMs: number;
  txHash?: string | null;
  payer?: string | null;
  lifecycle?: LifecycleEvent[];
}): PaymentEvent {
  const failureReason = deriveFailureReason(raw.status, raw.lifecycle);

  const event: PaymentEvent = {
    id: uuidv4(),
    dashboardId: raw.dashboardId,
    endpoint: raw.endpoint,
    status: raw.status,
    amountUSDC: raw.amountUSDC,
    startedAt: Date.now() - raw.durationMs,
    durationMs: raw.durationMs,
    txHash: raw.txHash ?? null,
    payer: raw.payer ?? null,
    failureReason,
    lifecycle: raw.lifecycle ?? [],
  };

  events.push(event);
  return event;
}

// ─── Read ───────────────────────────────────────────────────────

/** Latest N events for a dashboard, newest first */
export function getEvents(dashboardId: string, limit = 50): PaymentEvent[] {
  return events
    .filter((e) => e.dashboardId === dashboardId)
    .slice(-limit)
    .reverse();
}

/** Full lifecycle detail for a single event */
export function getEvent(id: string): PaymentEvent | undefined {
  return events.find((e) => e.id === id);
}

// ─── Aggregation ────────────────────────────────────────────────

export function getDashboardSummary(dashboardId: string): DashboardSummary {
  const scoped = events.filter((e) => e.dashboardId === dashboardId);

  if (scoped.length === 0) {
    return {
      totalEvents: 0,
      totalRevenueUSDC: 0,
      successRate: 0,
      avgLatencyMs: 0,
      endpoints: [],
      revenueTimeSeries: [],
    };
  }

  const successful = scoped.filter((e) => e.status === 200);
  const totalRevenue = successful.reduce((s, e) => s + e.amountUSDC, 0);
  const avgLatency =
    scoped.reduce((s, e) => s + e.durationMs, 0) / scoped.length;

  // Per-endpoint rollup
  const endpointMap = new Map<string, EndpointSummary>();
  for (const e of scoped) {
    let summary = endpointMap.get(e.endpoint);
    if (!summary) {
      summary = {
        endpoint: e.endpoint,
        totalRequests: 0,
        successfulPayments: 0,
        failedPayments: 0,
        totalRevenueUSDC: 0,
        avgDurationMs: 0,
        uniquePayers: 0,
      };
      endpointMap.set(e.endpoint, summary);
    }
    summary.totalRequests++;
    if (e.status === 200) {
      summary.successfulPayments++;
      summary.totalRevenueUSDC += e.amountUSDC;
    } else {
      summary.failedPayments++;
    }
  }

  // Compute avgDuration and uniquePayers per endpoint
  for (const [ep, summary] of endpointMap) {
    const epEvents = scoped.filter((e) => e.endpoint === ep);
    summary.avgDurationMs =
      epEvents.reduce((s, e) => s + e.durationMs, 0) / epEvents.length;
    summary.uniquePayers = new Set(
      epEvents.map((e) => e.payer).filter(Boolean)
    ).size;
  }

  // Time-series: bucket by minute
  const revenueTimeSeries = buildTimeSeries(successful);

  return {
    totalEvents: scoped.length,
    totalRevenueUSDC: totalRevenue,
    successRate: successful.length / scoped.length,
    avgLatencyMs: avgLatency,
    endpoints: Array.from(endpointMap.values()),
    revenueTimeSeries,
  };
}

// ─── Helpers ────────────────────────────────────────────────────

function deriveFailureReason(
  status: PaymentStatus,
  lifecycle?: LifecycleEvent[]
): FailureReason | null {
  if (status === 200) return null;
  if (status === 402) return "no_payment_provided";
  if (status === 403) {
    // Check lifecycle for specifics
    const settleStage = lifecycle?.find((l) => l.stage === "facilitator_settle");
    if (settleStage?.meta?.error === "insufficient_balance") {
      return "insufficient_balance";
    }
    return "invalid_signature";
  }
  return "unknown";
}

function buildTimeSeries(events: PaymentEvent[]): RevenueDataPoint[] {
  if (events.length === 0) return [];

  const BUCKET_MS = 60_000; // 1-minute buckets
  const buckets = new Map<number, { revenue: number; count: number }>();

  for (const e of events) {
    const bucket = Math.floor(e.startedAt / BUCKET_MS) * BUCKET_MS;
    const existing = buckets.get(bucket) ?? { revenue: 0, count: 0 };
    existing.revenue += e.amountUSDC;
    existing.count++;
    buckets.set(bucket, existing);
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a - b)
    .map(([timestamp, data]) => ({
      timestamp,
      label: new Date(timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      revenueUSDC: parseFloat(data.revenue.toFixed(6)),
      transactionCount: data.count,
    }));
}
