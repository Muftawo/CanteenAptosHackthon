// app/api/premium/quotes/route.ts
//
// Pay-gated endpoint: /api/premium/quotes
// Price: 0.0005 USDC (500 atomic units) — configured in middleware.ts
//
// A cheaper endpoint than /weather, so the dashboard can show
// distinct per-endpoint revenue and pricing comparisons.

import { NextResponse } from "next/server";

const QUOTES = [
  { quote: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { quote: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { quote: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein" },
  { quote: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { quote: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
  { quote: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
  { quote: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { quote: "Not all those who wander are lost.", author: "J.R.R. Tolkien" },
];

let callCount = 0;

export async function GET(): Promise<NextResponse> {
  const item = QUOTES[callCount % QUOTES.length];
  callCount++;

  return NextResponse.json({
    data: item,
    fetchedAt: new Date().toISOString(),
    source: "pay402 Demo Quotes API",
    note: "This response was unlocked by an x402 payment on Aptos testnet.",
  });
}
