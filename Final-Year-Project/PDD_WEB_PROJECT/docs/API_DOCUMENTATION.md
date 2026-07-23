# API Documentation
The application relies primarily on the Supabase JS Client for database interactions.

## Supabase Client (`src/lib/supabase.js`)
Provides the singleton `supabase` client utilized across all hooks and components.

## AI Service (`src/lib/ai.js`)
- `invokeLLM(systemPrompt, prompt)`: Automatically handles external LLM API calls with built-in fallback simulation for demo/offline modes.
