import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({
        quote: "The only way to do great work is to love what you do.",
        author: "Steve Jobs",
        isPremium: true
    });
}
