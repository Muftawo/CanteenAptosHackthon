# Pay402 Development Roadmap

> **Future features and improvements for x402 payment analytics on Aptos**

This document outlines planned enhancements to make Pay402 a complete, enterprise-grade observability solution for x402 micropayments.

---

## 🎯 Current Status

**Implemented Features:**
- ✅ Real-time payment event tracking
- ✅ Failure reason categorization
- ✅ Latency monitoring (per-transaction and per-endpoint)
- ✅ Revenue analytics with time-series visualization
- ✅ Live log streaming
- ✅ Geographic distribution visualization
- ✅ Wallet leaderboard
- ✅ Hourly activity analysis
- ✅ Basic webhook support for failures

**Coverage: ~70%** of core x402 observability problems

---

## 🚀 Phase 1: Production-Ready Foundations

**Priority: CRITICAL** | **Timeline: Weeks 1-2**

### 1.1 Persistent Database Migration
**Status:** 🔴 Blocking Production

**Problem:** Current in-memory storage loses all data on Vercel cold starts.

**Solution:**
- Migrate to **Vercel Postgres**, **Neon**, or **Supabase**
- Implement schema:
  ```sql
  CREATE TABLE payment_events (
    id UUID PRIMARY KEY,
    dashboard_id VARCHAR(255) NOT NULL,
    endpoint TEXT NOT NULL,
    status INT NOT NULL,
    amount_usdc DECIMAL(18, 6) NOT NULL,
    started_at TIMESTAMPTZ NOT NULL,
    duration_ms INT NOT NULL,
    tx_hash TEXT,
    payer TEXT,
    failure_reason TEXT,
    lifecycle JSONB,
    location JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  
  CREATE INDEX idx_dashboard_time ON payment_events(dashboard_id, started_at DESC);
  CREATE INDEX idx_payer ON payment_events(payer);
  CREATE INDEX idx_status ON payment_events(status);
  ```
- Add data retention policies (30-day default, configurable)
- Implement query optimization for dashboard aggregations

**Impact:** Enables production deployment, historical analysis, and scaling

---

### 1.2 Authentication & Multi-Tenancy
**Status:** 🟡 Required for Multi-User

**Features:**
- Add **NextAuth.js** with GitHub/Google OAuth
- Support multiple `dashboardId` projects per user
- Dashboard switcher in UI
- Per-dashboard access control (read-only vs admin)
- API key generation for programmatic access

**Files to modify:**
- `app/layout.tsx` - Add auth provider
- `app/api/auth/[...nextauth]/route.ts` - Auth configuration
- `lib/event-store.ts` - Add user/project scoping
- New: `app/api/dashboards/route.ts` - Dashboard management

---

### 1.3 Advanced Alerting System
**Status:** 🟡 High ROI

**Features:**
- **Alert Rules UI** in Settings Panel:
  - Latency threshold alerts (e.g., avg latency > 500ms)
  - Success rate drop alerts (e.g., success rate < 95%)
  - Revenue anomaly detection (30% drop vs 24h average)
  - Facilitator timeout alerts (consecutive failures)
  
- **Multi-Channel Notifications:**
  - Discord webhooks (already started)
  - Slack incoming webhooks
  - Email via SendGrid/Resend
  - PagerDuty integration for critical alerts

- **Alert Management:**
  - Alert history log
  - Acknowledgment workflow
  - Snooze/mute rules
  - Test alert button

**Implementation:**
```typescript
// New type
interface AlertRule {
  id: string;
  dashboardId: string;
  type: 'latency' | 'success_rate' | 'revenue' | 'facilitator';
  threshold: number;
  window: number; // time window in ms
  channels: ('discord' | 'slack' | 'email')[];
  enabled: boolean;
}
```

---

## 📊 Phase 2: Advanced Analytics

**Priority: HIGH** | **Timeline: Weeks 3-4**

### 2.1 Transaction Detail Pages
**Status:** 🟡 High User Value

**Features:**
- Click any event in dashboard → modal/page with full details
- **Visual Timeline:**
  - Request received → 402 issued → Payment signed → Facilitator verify → Facilitator settle → Settled → Response sent
  - Show exact timestamps and duration for each stage
- **Metadata Display:**
  - Full request headers
  - Payment signature details
  - Facilitator response payloads
  - On-chain transaction link
- **Lifecycle Waterfall Chart** (similar to browser DevTools Network tab)

**Files to create:**
- `app/transaction/[id]/page.tsx` - Detail view
- `components/dashboard/LifecycleWaterfall.tsx` - Visual timeline
- `app/api/events/[id]/route.ts` - Single event fetch endpoint

---

### 2.2 Facilitator Health Monitoring
**Status:** 🟡 Critical Insight

**Features:**
- **Separate Dashboard Section** for facilitator metrics:
  - Verify endpoint uptime & latency
  - Settle endpoint uptime & latency
  - Error rate over time
  - Historical availability (SLA tracking)
  
- **Visual Indicators:**
  - Status badge (🟢 Healthy / 🟡 Degraded / 🔴 Down)
  - Response time distribution histogram
  - Timeout frequency chart

**Implementation:**
- Store facilitator-specific metrics from lifecycle events
- Add `facilitator_metrics` aggregation to dashboard summary

---

### 2.3 Pricing Experiments & Optimization
**Status:** 🟡 UNIQUE DIFFERENTIATOR

**Features:**
- **A/B Test Management:**
  - Create price variants (e.g., 0.001 vs 0.0015 USDC)
  - Route % of traffic to each variant
  - Track conversion rates (402 issued → successful payment)
  - Statistical significance calculator
  
- **Conversion Funnel Analytics:**
  - Requests → 402 Issued → Payment Attempted → Successful
  - Drop-off analysis at each stage
  
- **Revenue Optimization Suggestions:**
  - "Increasing price by 25% may increase revenue by 15% with only 8% conversion drop"
  - Price elasticity curves
  
- **Dynamic Pricing (Future):**
  - Time-based pricing (peak/off-peak)
  - User-based pricing (new vs returning)

**New Component:**
- `components/dashboard/PricingExperiments.tsx`
- `app/api/experiments/route.ts`

**Schema Addition:**
```sql
CREATE TABLE price_experiments (
  id UUID PRIMARY KEY,
  dashboard_id VARCHAR(255),
  endpoint TEXT,
  variants JSONB, -- [{ price: 0.001, weight: 0.5 }, ...]
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  status TEXT -- 'active' | 'paused' | 'completed'
);
```

---

### 2.4 Data Export & API Access
**Status:** 🟡 Developer Essential

**Features:**
- **Export Functionality:**
  - Download events as CSV/JSON
  - Date range filtering
  - Endpoint filtering
  - Status filtering (success/failure only)
  
- **API Endpoints:**
  - `GET /api/events?from=<timestamp>&to=<timestamp>` - Paginated raw events
  - `GET /api/analytics/summary?period=7d` - Aggregated stats
  - `GET /api/analytics/endpoints` - Per-endpoint breakdown
  
- **Scheduled Reports:**
  - Daily/weekly email summaries
  - PDF report generation
  - Automated Slack digest

**Authentication:** Require API key (from Phase 1.2)

---

## 🏢 Phase 3: Enterprise Features

**Priority: MEDIUM** | **Timeline: Month 2**

### 3.1 Subscription Analytics
**Status:** 🟡 Partial (stub exists)

**Features:**
- **Subscriber Dashboard:**
  - Active subscriptions count
  - New subscribers (this week/month)
  - Churned subscribers
  - Renewal rate
  
- **Cohort Analysis:**
  - Retention curves (% active after 1 week, 1 month, etc.)
  - Revenue by signup cohort
  
- **Lifetime Value (LTV):**
  - Average revenue per payer
  - LTV projections based on current retention
  
- **Churn Prediction:**
  - Identify at-risk subscribers (declining usage patterns)

**Implementation:**
- Enhance `checkSubscription()` in `event-store.ts`
- Add subscription status to `topWallets` data

---

### 3.2 Multi-Environment Support
**Status:** 🟡 Team Collaboration

**Features:**
- **Environment Separation:**
  - Development / Staging / Production dashboards
  - Environment-specific API keys
  - Cross-environment comparison view
  
- **Deployment Tracking:**
  - Mark deployments with tags/versions
  - Compare metrics before/after deployments
  - Automatic anomaly detection on new deploys

---

### 3.3 On-Chain Verification
**Status:** 🟡 Trustless Proof

**Features:**
- **Aptos Indexer Integration:**
  - Fetch transaction details from indexer
  - Cross-reference payment amounts
  - Verify sender/receiver addresses
  - Detect failed on-chain transactions
  
- **Visual Transaction Explorer:**
  - Link to Aptos Explorer from dashboard
  - Embedded transaction view in detail page
  - Gas fee tracking
  
- **Discrepancy Alerts:**
  - Alert when middleware reports success but on-chain shows failure
  - Detect underpayment/overpayment

**API Integration:**
```typescript
// Use Aptos SDK indexer
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

const config = new AptosConfig({ network: Network.TESTNET });
const aptos = new Aptos(config);

const txn = await aptos.getTransactionByHash(txHash);
```

---

### 3.4 Anomaly Detection & ML
**Status:** 🟡 Advanced

**Features:**
- **Automated Anomaly Detection:**
  - Rolling average + standard deviation alerts
  - Seasonal pattern recognition (e.g., weekday vs weekend)
  - Outlier transaction detection
  
- **Predictive Analytics:**
  - Revenue forecasting (next 7/30 days)
  - Traffic prediction
  - Capacity planning recommendations

**Tech Stack:**
- Simple statistics (mean, std dev) in TypeScript
- Future: Integrate TensorFlow.js for advanced ML

---

## 🛠️ Technical Debt

### TD-1: Replace Mock Location Data
**Current:** Hardcoded city locations in `event-store.ts`  
**Solution:** Integrate `@maxmind/geoip2-node` for real GeoIP lookups  
**Priority:** Low

### TD-2: Improve Global Map Visualization
**Current:** Radar-style placeholder  
**Solution:** Use Mapbox GL JS or React Simple Maps for actual geographic plotting  
**Priority:** Medium

### TD-3: Settings Persistence
**Current:** Webhook URL stored in-memory only  
**Solution:** Store settings in database per `dashboardId`  
**Priority:** High (part of Phase 1.1)

### TD-4: Refund Manager Implementation
**Current:** Component exists but non-functional  
**Solution:** Implement refund API if x402 facilitator supports it, or create manual refund workflow  
**Priority:** Low

### TD-5: Type Safety Improvements
**Current:** Mostly solid, minor improvements possible  
**Solution:** Stricter types for API responses, lifecycle metadata  
**Priority:** Low

---

## 📝 Implementation Notes

### Database Migration Strategy
1. Create new Postgres tables alongside in-memory store
2. Dual-write to both for testing period
3. Migrate read queries to database
4. Remove in-memory store

### Backward Compatibility
- Maintain existing API contracts during migrations
- Use feature flags for gradual rollout
- Version API endpoints if breaking changes needed

### Performance Considerations
- Add Redis caching for dashboard aggregations
- Implement row-level security (RLS) for multi-tenancy
- Use database connection pooling (PgBouncer)
- Consider read replicas for analytics queries

---

## 🎓 Learning Resources

- [Aptos Indexer API](https://aptos.dev/indexer/api/)
- [NextAuth.js Docs](https://next-auth.js.org/)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [x402 Protocol Spec](https://github.com/aashidham/x402-minimal-facilitator-aptos)

---

## 📊 Success Metrics

**Phase 1 Complete When:**
- ✅ Data persists across deployments
- ✅ Multiple users can manage separate dashboards
- ✅ Alerts fire reliably via 2+ channels

**Phase 2 Complete When:**
- ✅ Developers can drill into individual transactions
- ✅ Facilitator health is separately monitored
- ✅ First pricing experiment runs successfully

**Phase 3 Complete When:**
- ✅ Subscription cohort analysis available
- ✅ On-chain verification cross-checks all payments
- ✅ Anomaly detection catches real production issues

---

## 🤝 Contributing

See `CONTRIBUTING.md` for development setup and contribution guidelines (to be created).

---

**Last Updated:** 2026-02-01  
**Maintainer:** @muftawoomar
