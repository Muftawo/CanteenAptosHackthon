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

// ─── Settings ───────────────────────────────────────────────────
// In-memory storage for settings (webhook URL, etc.)
let webhookUrl: string | null = null;

export function setWebhookUrl(url: string | null) {
  webhookUrl = url;
}

export function getWebhookUrl() {
  return webhookUrl;
}

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
    location: mockLocation(),
  };

  events.push(event);

  // ─── Trigger Webhook ──────────────────────────────────────────
  // If this is a failure (not 200) and a webhook URL is configured, fire it.
  if (event.status !== 200 && webhookUrl) {
    fireWebhook(webhookUrl, event).catch((err) => {
      console.error("Webhook failed:", err);
    });
  }

  return event;
}

// ─── New Helpers ────────────────────────────────────────────────

export function getRecentEvents(limit = 100): PaymentEvent[] {
  return events.slice(-limit).reverse();
}

export function checkSubscription(payer: string, windowMs: number): boolean {
  const cutoff = Date.now() - windowMs;
  // Check if this payer has any SUCCESSFUL payment in the window
  return events.some(
    (e) =>
      e.status === 200 &&
      e.payer === payer &&
      e.startedAt > cutoff
  );
}

function mockLocation() {
  // Randomly distribute across tech hubs
  const locations = [
    { lat: 37.7749, lng: -122.4194, country: "US" }, // SF
    { lat: 40.7128, lng: -74.0060, country: "US" },  // NYC
    { lat: 51.5074, lng: -0.1278, country: "UK" },   // London
    { lat: 35.6762, lng: 139.6503, country: "JP" },  // Tokyo
    { lat: 1.3521, lng: 103.8198, country: "SG" },   // Singapore
    { lat: 52.5200, lng: 13.4050, country: "DE" },   // Berlin
    { lat: 43.6532, lng: -79.3832, country: "CA" },  // Toronto
    { lat: -33.8688, lng: 151.2093, country: "AU" }, // Sydney
  ];
  return locations[Math.floor(Math.random() * locations.length)];
}

async function fireWebhook(url: string, event: PaymentEvent) {
  const payload = {
    username: "Pay402 Alert",
    avatar_url: "https://aptos.dev/img/aptos_logo_transparent.png",
    embeds: [
      {
        title: "❌ Payment Failed",
        color: 15158332, // Red
        fields: [
          { name: "Endpoint", value: `\`${event.endpoint}\``, inline: true },
          { name: "Reason", value: `\`${event.failureReason}\``, inline: true },
          { name: "Status", value: `${event.status}`, inline: true },
          { name: "Payer", value: event.payer ? `\`${event.payer.slice(0, 8)}...\`` : "Unknown" },
        ],
        timestamp: new Date(event.startedAt).toISOString(),
      },
    ],
  };

  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
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
      recentEvents: [],
      topWallets: [],
      hourlyInsights: [],
      failureBreakdown: [],
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
    recentEvents: getRecentEvents(50),
    topWallets: computeTopWallets(successful),
    hourlyInsights: computeHourlyInsights(scoped),
    failureBreakdown: computeFailureBreakdown(scoped),
  };
}

// ─── Analytics Helpers ──────────────────────────────────────────

function computeTopWallets(events: PaymentEvent[]) {
  const map = new Map<string, { totalSpent: number; txCount: number; lastSeen: number }>();

  for (const e of events) {
    if (!e.payer) continue;
    const existing = map.get(e.payer) ?? { totalSpent: 0, txCount: 0, lastSeen: 0 };
    existing.totalSpent += e.amountUSDC;
    existing.txCount++;
    existing.lastSeen = Math.max(existing.lastSeen, e.startedAt);
    map.set(e.payer, existing);
  }

  return Array.from(map.entries())
    .map(([address, data]) => ({ address, ...data }))
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 10);
}

function computeHourlyInsights(events: PaymentEvent[]) {
  const map = new Map<number, { success: number; total: number }>();

  for (const e of events) {
    const hour = new Date(e.startedAt).getHours();
    const existing = map.get(hour) ?? { success: 0, total: 0 };
    existing.total++;
    if (e.status === 200) existing.success++;
    map.set(hour, existing);
  }

  // Ensure all 24 hours are present? Maybe just active ones for now.
  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([hour, data]) => ({
      hour: `${hour}:00`,
      successRate: data.total > 0 ? data.success / data.total : 0,
      transactionCount: data.total
    }));
}

function computeFailureBreakdown(events: PaymentEvent[]) {
  const failed = events.filter(e => e.status !== 200);
  const map = new Map<string, number>();

  for (const e of failed) {
    const reason = e.failureReason || "unknown";
    map.set(reason, (map.get(reason) ?? 0) + 1);
  }

  return Array.from(map.entries())
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);
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
