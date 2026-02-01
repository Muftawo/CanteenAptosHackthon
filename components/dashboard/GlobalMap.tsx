"use client";
import React, { useMemo } from "react";
import type { PaymentEvent } from "@/types/pay402";

// Simple World Map SVG paths (simplified)
const WorldMapSVG = () => (
    <svg viewBox="0 0 1000 500" className="w-full h-full fill-gray-800 stroke-gray-700 stroke-[0.5]">
        <path d="M 500 250 ..." />
        {/* Using a placeholder rect for now, in a real app use a geojson path or library */}
        <rect x="0" y="0" width="1000" height="500" fill="none" />
        {/* Rough continent blobs */}
        <path d="M 200 150 Q 300 100 400 150 T 450 200" fill="none" stroke="currentColor" />
        <text x="500" y="250" textAnchor="middle" className="text-[10px] fill-gray-700">Global Activity</text>
    </svg>
);

export default function GlobalMap({ events }: { events: PaymentEvent[] }) {
    // Determine active locations from events
    const activeLocations = useMemo(() => {
        // Group by country/city to avoid stacking too much
        return events.filter(e => e.location && e.status === 200).map(e => e.location!);
    }, [events]);

    return (
        <div className="relative w-full h-full bg-gray-900 rounded-lg border border-gray-800 overflow-hidden flex items-center justify-center">
            {/* 
                Since fully implementing D3/Leaflet is heavy, we'll use a 
                styled "Radar" view for this demo instead which looks techy/cool.
            */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-gray-900 to-gray-900" />

            {/* Radar circles */}
            <div className="absolute w-[300px] h-[300px] border border-blue-500/10 rounded-full animate-[spin_10s_linear_infinite]" />
            <div className="absolute w-[200px] h-[200px] border border-blue-500/20 rounded-full" />
            <div className="absolute w-[400px] h-[400px] border border-blue-500/5 rounded-full" />

            {/* Blips */}
            {activeLocations.map((loc, i) => (
                <div
                    key={i}
                    className="absolute w-2 h-2 bg-blue-400 rounded-full animate-ping"
                    style={{
                        // Mock projection: map lat/lng to %
                        left: `${(loc.lng + 180) * (100 / 360)}%`,
                        top: `${(90 - loc.lat) * (100 / 180)}%`,
                    }}
                />
            ))}

            {/* Overlay Text */}
            <div className="absolute bottom-4 left-4">
                <div className="text-xs uppercase text-blue-400 font-bold tracking-widest mb-1">Active Nodes</div>
                <div className="text-2xl font-mono text-white">{activeLocations.length}</div>
            </div>
        </div>
    );
}
