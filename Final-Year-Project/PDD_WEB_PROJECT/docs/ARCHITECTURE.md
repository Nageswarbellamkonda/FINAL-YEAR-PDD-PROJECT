# Architecture
NyayaMitra utilizes a modern Serverless edge architecture:
- **Frontend**: React 18 + Vite, TailwindCSS, Framer Motion for micro-animations.
- **Backend / Database**: Supabase (PostgreSQL) with Row Level Security (RLS).
- **Authentication**: Supabase Auth (JWT based session management).
- **AI Processing**: Integration via `src/lib/ai.js` connecting to LLMs for FIR summarization and tactical advisories.
- **Hosting**: Edge-ready (Vercel/Netlify).
