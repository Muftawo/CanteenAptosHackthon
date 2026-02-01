"use client";
import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function IntegrationGenerator() {
    const [endpoint, setEndpoint] = useState("/api/premium/weather");
    const [copied, setCopied] = useState(false);

    const snippet = `import { x402axios } from "aptos-x402";

// Make a payment-gated request
// The library handles 402 negotiation & signing automatically
const response = await x402axios.get("${endpoint}", {
  privateKey: process.env.APTOS_PRIVATE_KEY
});

console.log(response.data);`;

    const handleCopy = () => {
        navigator.clipboard.writeText(snippet);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 h-full">
            <h2 className="text-xl font-semibold mb-4 text-white">Integration</h2>
            <div className="flex flex-col gap-4">
                <div>
                    <label className="block text-xs uppercase text-gray-500 font-semibold mb-2">Target Endpoint</label>
                    <select
                        value={endpoint}
                        onChange={(e) => setEndpoint(e.target.value)}
                        className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500"
                    >
                        <option value="/api/premium/weather">/api/premium/weather (0.001 USDC)</option>
                        <option value="/api/premium/quotes">/api/premium/quotes (0.0005 USDC)</option>
                    </select>
                </div>

                <div className="relative group">
                    <pre className="bg-gray-950 p-4 rounded-lg text-sm font-mono text-gray-400 overflow-x-auto border border-gray-800">
                        {snippet}
                    </pre>
                    <button
                        onClick={handleCopy}
                        className="absolute top-3 right-3 p-2 bg-gray-800 rounded hover:bg-gray-700 transition-colors text-white"
                    >
                        {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                    </button>
                </div>

                <p className="text-xs text-gray-500">
                    Requires <code className="text-blue-400">aptos-x402</code> package.
                </p>
            </div>
        </div>
    );
}
