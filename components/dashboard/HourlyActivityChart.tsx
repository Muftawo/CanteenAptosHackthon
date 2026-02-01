"use client";
import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { DashboardSummary } from "@/types/pay402";

export default function HourlyActivityChart({ data }: { data: DashboardSummary['hourlyInsights'] }) {
    return (
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 h-full flex flex-col">
            <h2 className="text-xl font-semibold mb-1 text-white">🕒 Recent Activity</h2>
            <p className="text-xs text-gray-500 mb-4">Transaction volume by hour</p>

            <div className="flex-1 min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <XAxis
                            dataKey="hour"
                            stroke="#6b7280"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: "#111827", borderColor: "#374151" }}
                            itemStyle={{ color: "#d1d5db" }}
                            cursor={{ fill: "rgba(59, 130, 246, 0.1)" }}
                        />
                        <Bar dataKey="transactionCount" name="Txns" radius={[4, 4, 0, 0]}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.successRate > 0.9 ? "#34d399" : "#facc15"} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2 text-[10px] text-gray-500">
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Healthy ({">"}90%)</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-yellow-400" />
                    <span>Degraded</span>
                </div>
            </div>
        </div>
    );
}
