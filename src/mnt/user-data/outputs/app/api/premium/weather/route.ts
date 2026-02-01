// app/api/premium/weather/route.ts
//
// Pay-gated endpoint: /api/premium/weather
// Price: 0.001 USDC (1 000 atomic units) — configured in middleware.ts
//
// This route handler only executes AFTER the x402 middleware has
// verified and settled a valid payment.  The middleware short-circuits
// with a 402 or 403 before this code runs if payment is missing/invalid.
//
// The response is intentionally simple — the value proposition of
// the hackathon demo is the payment flow + analytics, not the data.

import { NextResponse } from "next/server";

// Mock weather data — rotates on each call to keep the demo lively
const WEATHER_DATA = [
  { city: "San Francisco", temp: 18, condition: "Partly Cloudy", humidity: 72 },
  { city: "New York", temp: 5, condition: "Overcast", humidity: 88 },
  { city: "London", temp: 9, condition: "Light Rain", humidity: 91 },
  { city: "Tokyo", temp: 12, condition: "Clear", humidity: 55 },
  { city: "Sydney", temp: 25, condition: "Sunny", humidity: 45 },
  { city: "Accra", temp: 30, condition: "Humid", humidity: 78 },
];

let callCount = 0;

export async function GET(): Promise<NextResponse> {
  const weather = WEATHER_DATA[callCount % WEATHER_DATA.length];
  callCount++;

  return NextResponse.json({
    data: weather,
    fetchedAt: new Date().toISOString(),
    source: "pay402 Demo Weather API",
    note: "This response was unlocked by an x402 payment on Aptos testnet.",
  });
}
