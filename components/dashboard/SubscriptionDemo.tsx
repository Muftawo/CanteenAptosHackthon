"use client";
import React, { useState } from "react";
import { x402axios } from "aptos-x402";

export default function SubscriptionDemo() {
    const [status, setStatus] = useState<"idle" | "checking" | "active" | "expired">("idle");
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => setLogs(p => [msg, ...p].slice(0, 3));

    const checkAccess = async () => {
        setStatus("checking");
        addLog("Checking subscription...");

        try {
            const privateKey = process.env.NEXT_PUBLIC_APTOS_PRIVATE_KEY!;
            // We pass a dummy 'payer' param just to identify ourselves in the simple backend logic
            // In a real app, the wallet signature proves identity.
            const walletAddress = "0xaaefee8ba1e5f24ef88a74a3f445e0d2b810b90c1996466dae5ea9a0b85d42a0"; // Demo wallet

            // x402axios will handle the 402 if payment is required
            const res = await x402axios.get(`/api/premium/subscription?payer=${walletAddress}`, {
                privateKey
            });

            addLog("✅ Access Granted: " + res.data.message);
            setStatus("active");
        } catch (e: any) {
            addLog("❌ Access Denied: " + (e.response?.data?.error || e.message));
            setStatus("expired");
        }
    };

    return (
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 h-full">
            <h2 className="text-xl font-semibold mb-2 text-white">Subscription Demo</h2>
            <p className="text-xs text-gray-500 mb-4">
                Simulates time-gated access. Paying once grants 5 minutes of access.
            </p>

            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between bg-gray-950 p-4 rounded border border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${status === "active" ? "bg-green-500 shadow-[0_0_10px_#22c55e]" :
                                status === "expired" ? "bg-red-500" : "bg-gray-500"
                            }`} />
                        <span className="font-mono text-sm text-gray-300">
                            {status === "active" ? "SUBSCRIPTION ACTIVE" : "NO ACTIVE SUBSCRIPTION"}
                        </span>
                    </div>
                    <button
                        onClick={checkAccess}
                        disabled={status === "checking"}
                        className="px-3 py-1 bg-blue-600/20 text-blue-400 border border-blue-600/50 rounded text-xs hover:bg-blue-600/30 transition-colors"
                    >
                        {status === "checking" ? "Verifying..." : "Access Content"}
                    </button>
                </div>

                <div className="space-y-1">
                    {logs.map((L, i) => (
                        <div key={i} className="text-[10px] font-mono text-gray-500 truncate">
                            {L}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
