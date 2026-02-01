"use client";
import React, { useEffect, useRef } from "react";
import type { PaymentEvent } from "@/types/pay402";

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    size: number;
    life: number;
}

export default function ParticleVisualizer({ events }: { events: PaymentEvent[] }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particles = useRef<Particle[]>([]);
    const lastEventId = useRef<string | null>(null);

    useEffect(() => {
        // Check for NEW events to spawn particles
        if (events.length > 0) {
            const latest = events[0]; // Newest is first
            if (latest.id !== lastEventId.current) {
                lastEventId.current = latest.id;
                // Spawn particles based on amount
                const count = Math.min(20, Math.max(5, latest.amountUSDC * 1000));
                const color = latest.status === 200 ? "#34d399" : "#ef4444"; // Green vs Red
                spawnExplosion(count, color);
            }
        }
    }, [events]);

    const spawnExplosion = (count: number, color: string) => {
        if (!canvasRef.current) return;
        const { width, height } = canvasRef.current;

        for (let i = 0; i < count; i++) {
            particles.current.push({
                x: width / 2,
                y: height / 2,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                color: color,
                size: Math.random() * 4 + 1,
                life: 1.0,
            });
        }
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationId: number;

        const render = () => {
            // Resize handling (naive)
            if (canvas.width !== canvas.offsetWidth) {
                canvas.width = canvas.offsetWidth;
                canvas.height = canvas.offsetHeight;
            }

            // Clear with trail effect
            ctx.fillStyle = "rgba(17, 24, 39, 0.2)"; // gray-900 with opacity
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Update and draw particles
            particles.current.forEach((p, i) => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.1; // Gravity (visual)
                p.life -= 0.02;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = Math.max(0, p.life);
                ctx.fill();
                ctx.globalAlpha = 1.0;

                // Bounce off walls
                if (p.x < 0 || p.x > canvas.width) p.vx *= -0.8;
                if (p.y > canvas.height) {
                    p.y = canvas.height;
                    p.vy *= -0.6;
                }
            });

            // Cleanup dead particles
            particles.current = particles.current.filter((p) => p.life > 0);

            animationId = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animationId);
    }, []);

    return (
        <div className="relative w-full h-full bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
            <div className="absolute top-4 left-4 text-xs font-mono text-gray-500 uppercase z-10">Revenue Flow</div>
            <canvas ref={canvasRef} className="w-full h-full block" />
        </div>
    );
}
