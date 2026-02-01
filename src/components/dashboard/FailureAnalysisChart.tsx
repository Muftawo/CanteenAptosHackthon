"use client";
import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { DashboardSummary } from "@/types/pay402";

const COLORS = ["#ef4444", "#fbbf24", "#f87171", "#9ca3af"];

export default function FailureAnalysisChart({ data }: { data: DashboardSummary['failureBreakdown'] }) {
    if (data.length === 0) {
        return (
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 h-full flex flex-col justify-center items-center">
                <h2 className="text-xl font-semibold mb-4 text-white w-full">⚠️ Failures</h2>
                <div className="text-emerald-500 text-sm font-medium bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20">
                    All Systems Operational
                </div>
                <p className="text-xs text-gray-500 mt-2">No payment failures recorded.</p>
            </div>
        );
    }

    return (
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 h-full flex flex-col">
            <h2 className="text-xl font-semibold mb-4 text-white">⚠️ Failure Reasons</h2>
            <div className="flex-1 min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            dataKey="count"
                            nameKey="reason"
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={70}
                            paddingAngle={5}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ backgroundColor: "#111827", borderColor: "#374151" }}
                            itemStyle={{ color: "#ef4444" }}
                        />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            iconSize={8}
                            formatter={(value) => <span className="text-gray-400 text-xs">{value}</span>}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
