"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { DashboardSummary } from "@/types/pay402";

export default function DashboardPage() {
    const router = useRouter();
    const [data, setData] = useState<DashboardSummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch("/api/dashboard");
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        const interval = setInterval(fetchData, 2000);
        return () => clearInterval(interval);
    }, []);

    if (loading && !data) return <div className="p-10 text-white">Loading dashboard...</div>;
    if (!data) return <div className="p-10 text-white">Failed to load data</div>;

    return (
        <div className="min-h-screen bg-gray-950 text-white p-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">Live Dashboard</h1>
                <button
                    onClick={() => router.push("/")}
                    className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors text-sm font-medium border border-gray-700"
                >
                    ← Back to Home
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Card title="Total Events" value={data.totalEvents} />
                <Card title="Revenue (USDC)" value={`$${data.totalRevenueUSDC.toFixed(4)}`} />
                <Card title="Success Rate" value={`${(data.successRate * 100).toFixed(1)}%`} />
                <Card title="Avg Latency" value={`${Math.round(data.avgLatencyMs)} ms`} />
            </div>

            <div className="bg-gray-900 rounded-lg p-6 mb-8 border border-gray-800">
                <h2 className="text-xl font-semibold mb-4">Endpoints</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-800 text-gray-400">
                                <th className="pb-2">Endpoint</th>
                                <th className="pb-2">Requests</th>
                                <th className="pb-2">Success</th>
                                <th className="pb-2">Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.endpoints.map((ep) => (
                                <tr key={ep.endpoint} className="border-b border-gray-800/50">
                                    <td className="py-2 text-blue-400 font-mono">{ep.endpoint}</td>
                                    <td className="py-2">{ep.totalRequests}</td>
                                    <td className="py-2 text-green-400">{ep.successfulPayments}</td>
                                    <td className="py-2 text-yellow-400">${ep.totalRevenueUSDC.toFixed(4)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function Card({ title, value }: { title: string; value: string | number }) {
    return (
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
            <h3 className="text-gray-500 text-sm mb-1">{title}</h3>
            <div className="text-2xl font-bold font-mono">{value}</div>
        </div>
    );
}
