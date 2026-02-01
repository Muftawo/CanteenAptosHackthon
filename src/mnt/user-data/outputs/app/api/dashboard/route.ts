// app/api/dashboard/route.ts
//
// Read endpoint for the pay402 dashboard.
// Returns the full DashboardSummary + the 50 most recent events
// in a single response — the frontend polls this every 2 seconds.

import { NextResponse } from "next/server";
import { getDashboardSummary, getEvents } from "@/lib/event-store";

// ─── GET /api/dashboard?id=<dashboardId> ────────────────────────

export async function GET(req: Request): Promise<NextResponse> {
  const url = new URL(req.url);
  const dashboardId =
    url.searchParams.get("id") ??
    process.env.pay402_DASHBOARD_ID ??
    "pay402_demo_001";

  const summary = getDashboardSummary(dashboardId);
  const recentEvents = getEvents(dashboardId, 50);

  return NextResponse.json({
    summary,
    recentEvents,
    fetchedAt: Date.now(),
  });
}
