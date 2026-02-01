"use client";
// app/dashboard/page.tsx
//
// The core pay402 analytics dashboard.
// Polls /api/dashboard every 2 s and renders everything live.

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type {
  PaymentEvent,
  DashboardSummary,
  LifecycleEvent,
} from "@/types/pay402";

// ─── Sub-components ─────────────────────────────────────────────

function KPICard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="card-glass rounded-xl p-4 flex flex-col gap-1">
      <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
        {label}
      </span>
      <span className={`text-2xl font-bold ${accent ?? "text-white"}`}>
        {value}
      </span>
      {sub && <span className="text-gray-600 text-xs">{sub}</span>}
    </div>
  );
}

function StatusBadge({ status }: { status: number }) {
  if (status === 200)
    return <span className="badge-success text-xs font-mono px-2 py-0.5 rounded">200 OK</span>;
  if (status === 402)
    return <span className="badge-warning text-xs font-mono px-2 py-0.5 rounded">402 Pay</span>;
  return <span className="badge-error text-xs font-mono px-2 py-0.5 rounded">403 Err</span>;
}

function LifecycleInspector({ event }: { event: PaymentEvent }) {
  return (
    <div className="card-glass rounded-xl p-4 mt-3 border-blue-500/30">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white text-sm font-semibold">Transaction Inspector</h3>
        <span className="text-gray-600 text-xs font-mono">{event.id.slice(0, 8)}…</span>
      </div>

      {/* Lifecycle timeline */}
      <div className="flex flex-col gap-1.5">
        {event.lifecycle.length > 0 ? (
          event.lifecycle.map((stage: LifecycleEvent, i: number) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-0.5 shrink-0" />
                {i < event.lifecycle.length - 1 && (
                  <div className="w-px h-5 bg-gray-700" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-xs font-mono">
                    {stage.stage}
                  </span>
                  <span className="text-gray-600 text-xs">
                    {stage.durationMs > 0 ? `${stage.durationMs} ms` : "—"}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-600 text-xs italic">No lifecycle data recorded.</p>
        )}
      </div>

      {/* txHash link */}
      {event.txHash && (
        <div className="mt-3 pt-3 border-t border-gray-800">
          <span className="text-gray-500 text-xs">Tx Hash → </span>
          <a
            href={`https://explorer.aptoslabs.com/txn/${event.txHash}?network=testnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 text-xs font-mono hover:text-blue-300 transition-colors"
          >
            {event.txHash.slice(0, 12)}…{event.txHash.slice(-6)}
          </a>
        </div>
      )}

      {/* Failure reason */}
      {event.failureReason && (
        <div className="mt-2 pt-2 border-t border-gray-800">
          <span className="text-gray-500 text-xs">Failure → </span>
          <span className="text-red-400 text-xs font-mono">{event.failureReason}</span>
        </div>
      )}
    </div>
  );
}

// ─── Main dashboard ─────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [events, setEvents] = useState<PaymentEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<PaymentEvent | null>(null);
  const [filter, setFilter] = useState<"all" | "200" | "402" | "403">("all");
  const [lastFetch, setLastFetch] = useState<number>(0);

  // ── Poll every 2 seconds ──
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (!res.ok) return;
      const data = await res.json();
      setSummary(data.summary);
      setEvents(data.recentEvents);
      setLastFetch(data.fetchedAt);
    } catch {
      // Silently retry next tick
    }
  }, []);

  useEffect(() => {
    fetchData(); // immediate first fetch
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // ── Filtered event list ──
  const filteredEvents =
    filter === "all" ? events : events.filter((e) => String(e.status) === filter);

  // ── Revenue chart data ──
  const chartData = summary?.revenueTimeSeries ?? [];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* ─── Top bar ─── */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-gray-800 bg-gray-950 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/")} className="text-gray-500 hover:text-white transition-colors text-sm">
            ← Home
          </button>
          <span className="text-gray-800">|</span>
          <h1 className="text-white font-bold">
            Pay<span className="text-blue-400">Flow</span>
          </h1>
          <span className="text-gray-600 text-xs">Dashboard</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-gray-600 text-xs">
            Live · {lastFetch ? new Date(lastFetch).toLocaleTimeString() : "—"}
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-6">
        {/* ─── KPI row ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KPICard
            label="Total Revenue"
            value={`$${(summary?.totalRevenueUSDC ?? 0).toFixed(4)}`}
            sub="USDC on Aptos testnet"
            accent="text-emerald-400"
          />
          <KPICard
            label="Transactions"
            value={String(summary?.totalEvents ?? 0)}
            sub="total requests"
          />
          <KPICard
            label="Success Rate"
            value={`${((summary?.successRate ?? 0) * 100).toFixed(0)}%`}
            sub="paid / total"
            accent={
              (summary?.successRate ?? 0) > 0.8
                ? "text-emerald-400"
                : "text-amber-400"
            }
          />
          <KPICard
            label="Avg Latency"
            value={`${Math.round(summary?.avgLatencyMs ?? 0)} ms`}
            sub="end-to-end"
          />
        </div>

        {/* ─── Revenue chart ─── */}
        <div className="card-glass rounded-xl p-4">
          <h2 className="text-white text-sm font-semibold mb-3">Revenue Over Time</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                  axisLine={{ stroke: "#374151" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `$${v.toFixed(3)}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: 8,
                    color: "#f3f4f6",
                    fontSize: 12,
                  }}
                  formatter={(value: number) => [`$${value.toFixed(4)}`, "Revenue"]}
                />
                <Area
                  type="monotone"
                  dataKey="revenueUSDC"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-44 flex items-center justify-center text-gray-600 text-sm">
              No revenue data yet. Fire a test payment to populate this chart.
            </div>
          )}
        </div>

        {/* ─── Endpoint breakdown ─── */}
        {summary?.endpoints && summary.endpoints.length > 0 && (
          <div className="card-glass rounded-xl p-4">
            <h2 className="text-white text-sm font-semibold mb-3">Endpoints</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-gray-500 text-xs uppercase tracking-wider border-b border-gray-800">
                    <th className="pb-2 font-semibold">Endpoint</th>
                    <th className="pb-2 font-semibold text-right">Requests</th>
                    <th className="pb-2 font-semibold text-right">Success</th>
                    <th className="pb-2 font-semibold text-right">Revenue</th>
                    <th className="pb-2 font-semibold text-right">Avg ms</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.endpoints.map((ep) => (
                    <tr key={ep.endpoint} className="border-b border-gray-800/50">
                      <td className="py-2 font-mono text-blue-400 text-xs">{ep.endpoint}</td>
                      <td className="py-2 text-right text-gray-300">{ep.totalRequests}</td>
                      <td className="py-2 text-right text-emerald-400">{ep.successfulPayments}</td>
                      <td className="py-2 text-right text-emerald-400">${ep.totalRevenueUSDC.toFixed(4)}</td>
                      <td className="py-2 text-right text-gray-500">{Math.round(ep.avgDurationMs)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── Live transaction feed ─── */}
        <div className="card-glass rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white text-sm font-semibold">Live Feed</h2>
            <div className="flex gap-1.5">
              {(["all", "200", "402", "403"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`text-xs px-2.5 py-0.5 rounded transition-colors ${filter === f
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/40"
                      : "text-gray-500 hover:text-gray-300"
                    }`}
                >
                  {f === "all" ? "All" : f}
                </button>
              ))}
            </div>
          </div>

          {filteredEvents.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-8">
              No events yet. Go back to the home page and fire a test payment!
            </p>
          ) : (
            <div className="flex flex-col gap-1.5 max-h-80 overflow-y-auto pr-1">
              {filteredEvents.map((event) => (
                <div key={event.id}>
                  <button
                    onClick={() =>
                      setSelectedEvent(selectedEvent?.id === event.id ? null : event)
                    }
                    className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${selectedEvent?.id === event.id
                        ? "bg-blue-500/10 border border-blue-500/30"
                        : "hover:bg-gray-800/60"
                      }`}
                  >
                    <StatusBadge status={event.status} />
                    <span className="font-mono text-xs text-gray-400 flex-1 truncate">
                      {event.endpoint}
                    </span>
                    <span className="text-gray-600 text-xs">
                      {event.status === 200
                        ? `$${event.amountUSDC.toFixed(4)}`
                        : "—"}
                    </span>
                    <span className="text-gray-700 text-xs">
                      {event.durationMs} ms
                    </span>
                  </button>
                  {selectedEvent?.id === event.id && (
                    <LifecycleInspector event={event} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
