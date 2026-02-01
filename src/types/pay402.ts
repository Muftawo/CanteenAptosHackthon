// types/pay402.ts
// ──────────────────────────────────────────────────────────────────
// All types are derived directly from the x402 protocol as described
// in the Technical Cheatsheet:
//   • Status codes: 200 (settled), 402 (no payment), 403 (bad sig)
//   • Lifecycle stages mirror the facilitator's /verify → /settle flow
//   • txHash comes from the PAYMENT-RESPONSE header after settlement
//   • Network is always "aptos:2" (testnet) per cheatsheet config
// ──────────────────────────────────────────────────────────────────

/** Every status the x402 middleware can return */
export type PaymentStatus = 200 | 402 | 403;

/** Stages in a single x402 transaction lifecycle */
export type LifecycleStage =
  | "request_received"       // client hits the protected endpoint
  | "402_issued"             // server returns 402 + PAYMENT-REQUIRED header
  | "payment_signed"         // client signs the Aptos tx locally
  | "facilitator_verify"     // server POSTs to facilitator /verify
  | "facilitator_settle"     // server POSTs to facilitator /settle
  | "settled"                // on-chain confirmation received
  | "response_sent";         // 200 + PAYMENT-RESPONSE returned to client

/** Why a payment failed — derived from the three failure modes in the cheatsheet */
export type FailureReason =
  | "no_payment_provided"    // 402 — client didn't attach PAYMENT-SIGNATURE
  | "invalid_signature"      // 403 — signature malformed or insufficient funds
  | "facilitator_timeout"    // facilitator /verify or /settle did not respond
  | "insufficient_balance"   // on-chain: payer balance < price
  | "unknown";

/** A single instrumented payment event */
export interface PaymentEvent {
  id: string;                          // uuid
  dashboardId: string;                 // scopes to a deployment
  endpoint: string;                    // e.g. "/api/premium/weather"
  status: PaymentStatus;
  amountUSDC: number;                  // human-readable (price / 1e6)
  startedAt: number;                   // epoch ms — request arrived
  durationMs: number;                  // total round-trip time
  txHash: string | null;               // Aptos tx hash after settlement (null on failure)
  payer: string | null;                // buyer wallet address (extracted from tx)
  failureReason: FailureReason | null; // populated only when status !== 200
  lifecycle: LifecycleEvent[];         // ordered stage timestamps
}

/** One timestamped stage inside a transaction */
export interface LifecycleEvent {
  stage: LifecycleStage;
  timestampMs: number;                 // epoch ms
  durationMs: number;                  // time spent in this stage
  meta?: Record<string, unknown>;      // optional extra data (e.g. facilitator response)
}

// ─── Dashboard aggregation types ────────────────────────────────

export interface EndpointSummary {
  endpoint: string;
  totalRequests: number;
  successfulPayments: number;        // status === 200
  failedPayments: number;            // status === 402 | 403
  totalRevenueUSDC: number;
  avgDurationMs: number;
  uniquePayers: number;
}

export interface RevenueDataPoint {
  timestamp: number;                 // bucket start (epoch ms)
  label: string;                     // human-readable time label
  revenueUSDC: number;
  transactionCount: number;
}

export interface DashboardSummary {
  totalEvents: number;
  totalRevenueUSDC: number;
  successRate: number;               // 0–1
  avgLatencyMs: number;
  endpoints: EndpointSummary[];
  revenueTimeSeries: RevenueDataPoint[];
}
