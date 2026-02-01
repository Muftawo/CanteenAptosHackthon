"use client";
import React from "react";
import type { DashboardSummary } from "@/types/pay402";

export default function WalletLeaderboard({ wallets }: { wallets: DashboardSummary['topWallets'] }) {
    if (wallets.length === 0) {
        return (
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 h-full flex items-center justify-center text-gray-500">
                No active wallets yet.
            </div>
        );
    }

    return (
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 h-full">
            <h2 className="text-xl font-semibold mb-4 text-white">💰 Top Spenders</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                            <th className="pb-3 text-xs font-semibold">Wallet</th>
                            <th className="pb-3 text-xs font-semibold text-right">Volume</th>
                            <th className="pb-3 text-xs font-semibold text-right">Txns</th>
                        </tr>
                    </thead>
                    <tbody>
                        {wallets.map((w, i) => (
                            <tr key={w.address} className="border-b border-gray-800/50 group hover:bg-gray-800/20">
                                <td className="py-3 font-mono text-sm text-blue-400">
                                    <span className="text-gray-600 mr-2">#{i + 1}</span>
                                    {w.address.slice(0, 6)}...{w.address.slice(-4)}
                                </td>
                                <td className="py-3 font-mono text-sm text-white text-right font-bold">
                                    ${w.totalSpent.toFixed(4)}
                                </td>
                                <td className="py-3 font-mono text-sm text-gray-400 text-right">
                                    {w.txCount}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
