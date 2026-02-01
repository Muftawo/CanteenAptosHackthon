import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({
        location: "San Francisco, CA",
        temperature: 72,
        condition: "Sunny",
        timestamp: new Date().toISOString(),
        isPremium: true
    });
}
