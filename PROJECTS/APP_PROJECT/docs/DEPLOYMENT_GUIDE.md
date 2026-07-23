# DEPLOYMENT GUIDE (Vercel / Netlify / Cloudflare)

## 1. Prerequisites
- A GitHub/GitLab repository hosting the codebase.
- A live Supabase project instance with Authentication and Postgres initialized.
- Open AI API Key (or equivalent LLM key mapped via `invokeLLM` interface).

## 2. Environment Variables
You must inject the following exact keys into your deployment provider's Environment settings:
```
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_AI_API_KEY=<your-llm-provider-key>
VITE_AI_MODEL=gpt-4o (optional)
```

## 3. Database Initialization
Before routing live traffic, run all SQL migrations sequentially in the Supabase SQL Editor:
1. `001_initial_schema.sql` through `006_seed_default_data.sql` to establish table definitions and baseline schemas.
2. `007_production_indexes.sql` to finalize DB lookup optimizations.

## 4. Build Configuration
The native build setup requires zero custom overrides. The system is ready for:
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Node Version**: 18.x or 20.x

## 5. Caching & CDNs
If deploying through Cloudflare, ensure you enforce `HTTPS-Only` mode, and leave standard caching headers as configured natively by Vite. 

**NyayaMitra is officially cleared for deployment execution.**
