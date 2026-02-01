import { NextResponse } from "next/server";
import { getDashboardSummary } from "@/lib/event-store";

export async function GET() {
    const dashboardId = process.env.pay402_DASHBOARD_ID ?? "pay402_demo_001";
    const summary = getDashboardSummary(dashboardId);
    return NextResponse.json(summary);
}
