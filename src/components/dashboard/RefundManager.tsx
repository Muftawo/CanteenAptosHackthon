"use client";
import React, { useState } from "react";
// In a real app, you'd use the wallet adapter here
// import { useWallet } from "@aptos-labs/wallet-adapter-react";

export default function RefundManager() {
    const [address, setAddress] = useState("");
    const [amount, setAmount] = useState("0.001");
    const [status, setStatus] = useState<"idle" | "processing" | "success">("idle");

    const handleRefund = async () => {
        setStatus("processing");
        // Mock delay for wallet interaction
        await new Promise(r => setTimeout(r, 2000));
        setStatus("success");
        setTimeout(() => setStatus("idle"), 3000);
    };

    return (
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 h-full">
            <h2 className="text-xl font-semibold mb-4 text-white">Refund Manager</h2>

            <div className="space-y-4">
                <div>
                    <label className="block text-xs uppercase text-gray-500 font-semibold mb-2">Recipient Address</label>
                    <input
                        className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-red-500"
                        placeholder="0x..."
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                    />
                </div>

                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block text-xs uppercase text-gray-500 font-semibold mb-2">Amount (USDC)</label>
                        <input
                            className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-red-500"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={handleRefund}
                            disabled={status === "processing" || !address}
                            className="h-[38px] px-4 bg-red-500/10 text-red-500 border border-red-500/50 rounded hover:bg-red-500/20 transition-colors text-sm font-medium whitespace-nowrap disabled:opacity-50"
                        >
                            {status === "processing" ? "Signing..." : status === "success" ? "Refund Sent!" : "Issue Refund"}
                        </button>
                    </div>
                </div>

                <div className="bg-blue-500/5 border border-blue-500/10 p-3 rounded text-xs text-blue-400">
                    ℹ️ Connects to your Petra wallet to sign the refund transaction.
                </div>
            </div>
        </div>
    );
}
