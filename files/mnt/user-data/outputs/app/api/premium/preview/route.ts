// app/api/premium/preview/route.ts
//
// FREE endpoint: /api/premium/preview
//
// This path is NOT listed in the ROUTES config in middleware.ts,
// so the x402 middleware passes it through without gating.
// It exists purely to populate the dashboard with 200 events at $0.00,
// making the analytics contrast (paid vs free) immediately visible.

import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    data: {
      message: "This is a free preview. No payment required.",
      availableEndpoints: [
        { path: "/api/premium/weather", price: "0.001 USDC", description: "Live weather data" },
        { path: "/api/premium/quotes", price: "0.0005 USDC", description: "Inspirational quotes" },
      ],
    },
    fetchedAt: new Date().toISOString(),
    source: "pay402 Demo Preview API",
  });
}
