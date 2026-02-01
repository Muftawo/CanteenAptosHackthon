# pay402 — x402 Payment Analytics & Developer Dashboard

> Real-time analytics for x402 micropayments on Aptos. Watch payments flow, debug failures, and track revenue — live.

Built for the **Canteen × Aptos × x402 Hackathon** (Feb 1, 2026).

---

## Quick Start

```bash
git clone https://github.com/your-handle/pay402-x402-aptos.git
cd pay402-x402-aptos

npm install
cp env.example .env.local   # edit with your keys (see below)
npm run dev                  # → http://localhost:3000
```

Open the app, click **Fire Test Payment**, then watch the event appear on the **Dashboard** in real time.

---

## Environment Variables

Copy `env.example` → `.env.local`. The file is pre-filled with testnet defaults from the hackathon cheatsheet. You only need to change the keys if you're using your own wallets.

| Variable | Default | What it does |
|---|---|---|
| `PAYMENT_RECIPIENT_ADDRESS` | Wallet 1 address | Aptos address that **receives** USDC payments |
| `NEXT_PUBLIC_APTOS_PRIVATE_KEY` | Wallet 1 private key | Signs payments in the browser test client |
| `FACILITATOR_URL` | `https://x402-navy.vercel.app/facilitator` | Public facilitator (verify + settle + gas sponsorship) |
| `APTOS_NETWORK` | `aptos:2` | Network ID (testnet) |
| `USDC_ASSET_ADDRESS` | `0x69091f…` | USDC fungible asset on Aptos testnet |
| `pay402_DASHBOARD_ID` | `pay402_demo_001` | Scopes analytics data per deployment |

### Test Wallets (from the cheatsheet)

These wallets are pre-funded with ~20 USDC + 1 APT on testnet. Use them for development. Replenish via:

- **APT faucet:** https://aptos.dev/network/faucet
- **USDC faucet:** https://faucet.circle.com/

> ⚠️ These are shared community wallets. Don't abuse them. For production, generate your own with `aptos account create`.

---

## Running a Local Facilitator (Optional)

The public facilitator at `x402-navy.vercel.app` works out of the box. If you want a local one:

```bash
# Terminal 1 — facilitator
git clone https://github.com/aashidham/x402-minimal-facilitator-aptos.git
cd x402-minimal-facilitator-aptos
cp env.example .env.local   # add a wallet private key for gas sponsorship
npm install && npm start     # → http://localhost:4022

# Terminal 2 — pay402 (point at local facilitator)
export FACILITATOR_URL=http://localhost:4022
npm run dev
```

---

## Project Structure

```
pay402-x402-aptos/
│
├── middleware.ts                     ← x402 payment gating + pay402 instrumentation
│
├── app/
│   ├── layout.tsx                   ← Root layout (fonts, Tailwind, dark mode)
│   ├── globals.css                  ← Tailwind + custom utility classes
│   ├── page.tsx                     ← Landing page + test payment button
│   │
│   ├── dashboard/
│   │   └── page.tsx                 ← Live analytics dashboard (KPIs, chart, feed)
│   │
│   └── api/
│       ├── events/
│       │   └── route.ts             ← POST — receives instrumentation events
│       ├── dashboard/
│       │   └── route.ts             ← GET  — serves aggregated analytics
│       └── premium/
│           ├── weather/
│           │   └── route.ts         ← GET  — pay-gated: 0.001 USDC
│           ├── quotes/
│           │   └── route.ts         ← GET  — pay-gated: 0.0005 USDC
│           └── preview/
│               └── route.ts         ← GET  — free (not in x402 route config)
│
├── lib/
│   ├── event-store.ts               ← In-memory event store + aggregation
│   └── pay402-middleware.ts         ← Transparent wrapper around aptos-x402
│
├── types/
│   └── pay402.ts                   ← All TypeScript types
│
├── env.example                      ← Template for .env.local
├── package.json
├── next.config.ts
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.mjs
└── .gitignore                       ← Includes .env.local !
```

---

## How the x402 Flow Works Here

```
Browser (page.tsx)                  Next.js Server                    Aptos Testnet
      │                                   │                                 │
      │  x402axios.get("/api/weather")    │                                 │
      │ ─────────────────────────────────>│                                 │
      │                                   │  middleware.ts intercepts       │
      │                                   │  → no PAYMENT-SIGNATURE header  │
      │  ← 402 + PAYMENT-REQUIRED ────────│                                 │
      │                                   │                                 │
      │  x402axios signs Aptos tx locally │                                 │
      │  (withFeePayer: true — gas free)  │                                 │
      │                                   │                                 │
      │  retry with PAYMENT-SIGNATURE ───>│                                 │
      │                                   │  → facilitator /verify ────────>│
      │                                   │  ← { isValid: true } <─────────│
      │                                   │  → facilitator /settle ────────>│
      │                                   │  ← { txHash: "0x…" } <─────────│
      │                                   │                                 │
      │  ← 200 + data ────────────────────│                                 │
      │      + PAYMENT-RESPONSE header    │                                 │
      │                                   │  pay402 wrapper fires POST     │
      │                                   │  to /api/events (fire & forget) │
      │                                   │                                 │
      │                                   │  Dashboard polls /api/dashboard │
      │                                   │  every 2s → event appears live  │
```

---

## Key Technical Details

| Detail | Value | Source |
|---|---|---|
| Network | `aptos:2` (testnet) | Cheatsheet |
| Facilitator | `https://x402-navy.vercel.app/facilitator` | Cheatsheet |
| USDC asset | `0x69091fbab5f7d635ee7ac5098cf0c1efbe31d68fec0f2cd565e8d168daf52832` | minimal-server repo |
| Gas model | Sponsored (facilitator pays) | `withFeePayer: true` |
| Payment scheme | `exact` | x402 protocol spec |
| Client package | `aptos-x402` → `x402axios` | Workshop repo |
| Server package | `aptos-x402` → `paymentMiddleware` | Workshop repo |
| Explorer | `https://explorer.aptoslabs.com/txn/{hash}?network=testnet` | Cheatsheet |

---

## Deploying to Vercel

```bash
vercel deploy
```

Set the env vars in the Vercel dashboard (Settings → Environment Variables). The `FACILITATOR_URL` default works as-is. Everything else is the same as `.env.local`.

---

## License

MIT
