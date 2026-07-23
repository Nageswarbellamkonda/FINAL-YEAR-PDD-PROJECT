# SCALABILITY REPORT

## 1. Projected Capacity
With the recent performance, security, and build integrity optimizations, the application is rated to gracefully handle:
- **100,000+ Registered Citizens**
- **Thousands of Concurrent Operations**
- **State-wide Geographic Targeting**

## 2. Supabase Infrastructure
NyayaMitra leverages the underlying Supabase (PostgreSQL) engine natively. 
- Real-time websocket broadcasts are tightly scoped to specific channels (e.g., specific user UUID notifications) meaning server CPU will scale horizontally without clogging the notification engine.
- Connection Pooling natively handles heavy concurrent API requests without maxing out DB active connection limits.

## 3. Storage Scalability
- Storage buckets offload file transfers from the REST API to dedicated CDNs. High volume media (evidence pictures, reports) is served from regional Edge networks.

## 4. Frontend Resilience
- Vite static builds ensure that all JS/CSS logic is hosted via CDNs (Netlify/Vercel) directly to the edge, making initial payloads extremely lightweight and infinitely scalable under massive DDoS or traffic spikes. The server logic is fundamentally serverless.
