import { NextResponse } from "next/server";
import { getWebhookUrl, setWebhookUrl } from "@/lib/event-store";

export async function GET() {
    return NextResponse.json({
        webhookUrl: getWebhookUrl(),
    });
}

export async function POST(req: Request) {
    try {
        const { webhookUrl } = await req.json();
        setWebhookUrl(webhookUrl || null);
        return NextResponse.json({ success: true, webhookUrl });
    } catch {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
}
