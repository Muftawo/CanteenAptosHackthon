import { NextRequest, NextResponse } from "next/server";
import { checkSubscription } from "@/lib/event-store";

// 5 Minutes Subscription Window
const SUBSCRIPTION_WINDOW_MS = 5 * 60 * 1000;

export async function GET(req: NextRequest) {
    const payer = req.nextUrl.searchParams.get("payer");

    if (!payer) {
        // If the client doesn't provide their address, we can't check subscription.
        // We demand a nominal payment to "start" the subscription.
        return NextResponse.json(
            { error: "No active subscription found." },
            {
                status: 402,
                headers: {
                    // Ask for 0.01 USDC to start a 5-minute session
                    "PAYMENT-REQUIRED": "true",
                    "PAYMENT-PRICE": "10000"
                }
            }
        );
    }

    const hasAccess = checkSubscription(payer, SUBSCRIPTION_WINDOW_MS);

    if (hasAccess) {
        return NextResponse.json({
            status: "active",
            message: "Subscription valid! You have access.",
            expiresIn: "unknown (rolling window)"
        });
    } else {
        return NextResponse.json(
            { error: "Subscription expired or not found." },
            {
                status: 402,
                headers: {
                    "PAYMENT-REQUIRED": "true",
                    "PAYMENT-PRICE": "10000"
                }
            }
        );
    }
}
