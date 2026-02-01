"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { DashboardSummary } from "@/types/pay402";
import IntegrationGenerator from "@/components/dashboard/IntegrationGenerator";
import SettingsPanel from "@/components/dashboard/SettingsPanel";
import ABTestComparison from "@/components/dashboard/ABTestComparison";
import ParticleVisualizer from "@/components/dashboard/ParticleVisualizer";
import GlobalMap from "@/components/dashboard/GlobalMap";
import LiveLogStream from "@/components/dashboard/LiveLogStream";
import SubscriptionDemo from "@/components/dashboard/SubscriptionDemo";
import RefundManager from "@/components/dashboard/RefundManager";
import WalletLeaderboard from "@/components/dashboard/WalletLeaderboard";
import HourlyActivityChart from "@/components/dashboard/HourlyActivityChart";
import FailureAnalysisChart from "@/components/dashboard/FailureAnalysisChart";

export default function DashboardPage() {
    const router = useRouter();
    const [data, setData] = useState<DashboardSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"overview" | "analytics">("overview");

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
    if (!data) {
        return (
            <div className="p-10 text-white">
                <h2 className="text-2xl font-bold text-red-500 mb-4">Error Loading Dashboard</h2>
                <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-lg mb-4">
                    <p className="font-mono text-sm text-red-200">Failed to fetch data from /api/dashboard</p>
                    <p className="text-xs text-red-400 mt-2">Check console for details.</p>
                </div>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors border border-gray-700"
                >
                    Reload Page
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white p-8 relative">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                        Pay402 Analytics
                    </h1>
                    <div className="flex gap-4 mt-2">
                        <button
                            onClick={() => setActiveTab("overview")}
                            className={`text-sm font-medium border-b-2 transition-colors pb-1 ${activeTab === "overview" ? "text-white border-blue-500" : "text-gray-500 border-transparent hover:text-gray-300"}`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab("analytics")}
                            className={`text-sm font-medium border-b-2 transition-colors pb-1 ${activeTab === "analytics" ? "text-white border-blue-500" : "text-gray-500 border-transparent hover:text-gray-300"}`}
                        >
                            Deep Dive
                        </button>
                    </div>
                </div>
                <button
                    onClick={() => router.push("/")}
                    className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors text-sm font-medium border border-gray-700"
                >
                    ← Back to Home
                </button>
            </div>

            {activeTab === "overview" ? (
                <>
                    {/* Top Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <Card title="Total Events" value={data.totalEvents} />
                        <Card title="Revenue (USDC)" value={`$${data.totalRevenueUSDC.toFixed(4)}`} />
                        <Card title="Success Rate" value={`${(data.successRate * 100).toFixed(1)}%`} />
                        <Card title="Avg Latency" value={`${Math.round(data.avgLatencyMs)} ms`} />
                    </div>

                    {/* Main Visuals Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 h-[500px]">
                        <div className="lg:col-span-1 h-full"><ParticleVisualizer events={data.recentEvents} /></div>
                        <div className="lg:col-span-1 h-full"><GlobalMap events={data.recentEvents} /></div>
                        <div className="lg:col-span-1 h-full"><LiveLogStream events={data.recentEvents} /></div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                        <div className="lg:col-span-2 bg-gray-900 rounded-lg p-6 border border-gray-800">
                            <h2 className="text-xl font-semibold mb-4">Endpoints</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-gray-800 text-gray-400 text-sm uppercase tracking-wider">
                                            <th className="pb-3 text-xs font-semibold">Endpoint</th>
                                            <th className="pb-3 text-xs font-semibold">Requests</th>
                                            <th className="pb-3 text-xs font-semibold">Success</th>
                                            <th className="pb-3 text-xs font-semibold">Revenue</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.endpoints.map((ep) => (
                                            <tr key={ep.endpoint} className="border-b border-gray-800/50 hover:bg-gray-800/50 transition-colors">
                                                <td className="py-3 text-blue-400 font-mono text-sm">{ep.endpoint}</td>
                                                <td className="py-3 text-gray-300 font-mono text-sm">{ep.totalRequests}</td>
                                                <td className="py-3 text-emerald-400 font-mono text-sm">{ep.successfulPayments}</td>
                                                <td className="py-3 text-yellow-500 font-mono text-sm font-medium">${ep.totalRevenueUSDC.toFixed(4)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="lg:col-span-1"><ABTestComparison data={data} /></div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        <div className="lg:col-span-1"><SubscriptionDemo /></div>
                        <div className="lg:col-span-1"><RefundManager /></div>
                        <div className="lg:col-span-1"><IntegrationGenerator /></div>
                        <div className="lg:col-span-1"><SettingsPanel /></div>
                    </div>
                </>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
                    <div className="lg:col-span-1 h-full">
                        <WalletLeaderboard wallets={data.topWallets} />
                    </div>
                    <div className="lg:col-span-1 h-full">
                        <HourlyActivityChart data={data.hourlyInsights} />
                    </div>
                    <div className="lg:col-span-1 h-full">
                        <FailureAnalysisChart data={data.failureBreakdown} />
                    </div>
                </div>
            )}
        </div>
    );
}

function Card({ title, value }: { title: string; value: string | number }) {
    return (
        <div className="bg-gray-900 p-5 rounded-lg border border-gray-800 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
            <h3 className="text-gray-500 text-xs uppercase font-semibold tracking-wider mb-1 relative z-10">{title}</h3>
            <div className="text-2xl font-bold font-mono text-white relative z-10">{value}</div>
        </div>
    );
}
