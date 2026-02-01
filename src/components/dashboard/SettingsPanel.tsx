"use client";
import { useState, useEffect } from "react";
import { Bell, Check, AlertCircle } from "lucide-react";

export default function SettingsPanel() {
    const [webhookUrl, setWebhookUrl] = useState("");
    const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

    useEffect(() => {
        fetch("/api/settings")
            .then((res) => res.json())
            .then((data) => {
                if (data.webhookUrl) setWebhookUrl(data.webhookUrl);
            });
    }, []);

    const handleSave = async () => {
        setStatus("saving");
        try {
            const res = await fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ webhookUrl }),
            });
            if (!res.ok) throw new Error("Failed");
            setStatus("saved");
            setTimeout(() => setStatus("idle"), 2000);
        } catch {
            setStatus("error");
        }
    };

    return (
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 h-full">
            <div className="flex items-center gap-2 mb-4">
                <Bell size={20} className="text-yellow-500" />
                <h2 className="text-xl font-semibold text-white">Alerts</h2>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-xs uppercase text-gray-500 font-semibold mb-2">Discord Webhook URL</label>
                    <input
                        type="text"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        placeholder="https://discord.com/api/webhooks/..."
                        className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-yellow-500"
                    />
                </div>

                <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-500 leading-relaxed max-w-[70%]">
                        Receive instant notifications when payments fail (403 invalid signature, timeouts, etc).
                    </p>
                    <button
                        onClick={handleSave}
                        disabled={status === "saving"}
                        className="px-4 py-2 bg-yellow-600/20 text-yellow-500 border border-yellow-600/50 rounded hover:bg-yellow-600/30 transition-colors text-sm font-medium flex items-center gap-2"
                    >
                        {status === "saved" && <Check size={16} />}
                        {status === "error" && <AlertCircle size={16} />}
                        {status === "saving" ? "Saving..." : "Save Config"}
                    </button>
                </div>
            </div>
        </div>
    );
}
