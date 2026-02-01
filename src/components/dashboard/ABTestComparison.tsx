"use client";
import type { DashboardSummary } from "@/types/pay402";

export default function ABTestComparison({ data }: { data: DashboardSummary }) {
    // Sort endpoints by revenue to find the winner
    const sorted = [...data.endpoints].sort((a, b) => b.totalRevenueUSDC - a.totalRevenueUSDC);
    const winner = sorted[0];

    return (
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 h-full">
            <h2 className="text-xl font-semibold mb-4 text-white">A/B Performance</h2>

            {data.endpoints.length < 2 ? (
                <div className="text-gray-500 text-sm py-4 text-center border border-dashed border-gray-800 rounded">
                    Need at least 2 active endpoints to compare.
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Winner Banner */}
                    <div className="bg-gradient-to-r from-emerald-900/40 to-emerald-900/10 border border-emerald-500/20 rounded p-3 flex items-center gap-3">
                        <div className="text-2xl">🏆</div>
                        <div>
                            <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Top Performer</div>
                            <div className="text-white font-mono text-sm">{winner.endpoint}</div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {sorted.slice(0, 3).map((ep) => {
                            const successRate = ep.totalRequests > 0 ? (ep.successfulPayments / ep.totalRequests) * 100 : 0;
                            const rps = ep.totalRequests > 0 ? ep.totalRevenueUSDC / ep.totalRequests : 0;

                            return (
                                <div key={ep.endpoint} className="bg-gray-950 p-3 rounded border border-gray-800 flex justify-between items-center group hover:border-gray-700 transition-colors">
                                    <div>
                                        <div className="text-xs text-blue-400 font-mono mb-1">{ep.endpoint}</div>
                                        <div className="flex gap-3 text-xs text-gray-500">
                                            <span>SR: <span className={successRate > 80 ? "text-green-400" : "text-yellow-400"}>{successRate.toFixed(1)}%</span></span>
                                            <span>Rev/Req: <span className="text-gray-300">${rps.toFixed(5)}</span></span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-white">${ep.totalRevenueUSDC.toFixed(4)}</div>
                                        <div className="text-xs text-gray-600">{ep.successfulPayments} paid</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
