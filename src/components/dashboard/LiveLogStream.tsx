"use client";
import React, { useEffect, useRef } from "react";
import type { PaymentEvent } from "@/types/pay402";

export default function LiveLogStream({ events }: { events: PaymentEvent[] }) {
    const bottomRef = useRef<HTMLDivElement>(null);

    // Auto-scroll logic could go here, but usually users prefer manual control
    // or just sticking to top/bottom. For a "tail -f" feel, new items appear at top usually in web UIs.

    return (
        <div className="bg-gray-950 rounded-lg p-4 border border-gray-800 font-mono text-xs h-full flex flex-col">
            <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-800">
                <span className="text-gray-400 font-bold uppercase">Live Logs</span>
                <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-green-500">Connected</span>
                </span>
            </div>

            <div className="overflow-y-auto flex-1 space-y-2 pr-2 custom-scrollbar">
                {events.length === 0 && (
                    <div className="text-gray-600 italic text-center py-10">Waiting for payments...</div>
                )}
                {events.map((e) => (
                    <div key={e.id} className="group hover:bg-gray-900 p-2 rounded transition-colors">
                        <div className="flex gap-2 text-gray-500 mb-1">
                            <span>{new Date(e.startedAt).toLocaleTimeString()}</span>
                            <span>[{e.status}]</span>
                            <span className={e.status === 200 ? "text-blue-400" : "text-red-400"}>
                                {e.endpoint}
                            </span>
                        </div>
                        <div className="text-gray-300 pl-4 border-l-2 border-gray-800 group-hover:border-blue-500/50">
                            {e.status === 200 ? (
                                <>
                                    <div className="text-emerald-500">
                                        Settled ${e.amountUSDC} in {e.durationMs}ms
                                    </div>
                                    <div className="text-[10px] text-gray-600 truncate">{e.txHash}</div>
                                </>
                            ) : (
                                <div className="text-red-500">
                                    Error: {e.failureReason} ({e.durationMs}ms)
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>
        </div>
    );
}
