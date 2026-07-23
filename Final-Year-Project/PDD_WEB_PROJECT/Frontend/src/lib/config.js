/**
 * Central application configuration — all values from Vite env (no hardcoded secrets).
 */
export const config = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  },
  app: {
    name: import.meta.env.VITE_APP_NAME || 'NyayaMitra',
    url: import.meta.env.VITE_APP_URL || (typeof window !== 'undefined' ? window.location.origin : ''),
    authCallbackPath: '/auth/callback',
  },
  ai: {
    proxyUrl: import.meta.env.VITE_AI_PROXY_URL || '',
    openaiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
    anthropicKey: import.meta.env.VITE_ANTHROPIC_API_KEY || '',
    googleKey: import.meta.env.VITE_GOOGLE_AI_API_KEY || '',
  },
  maps: {
    mapboxToken: import.meta.env.VITE_MAPBOX_TOKEN || '',
    googleMapsKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  },
  storage: {
    buckets: {
      profilePhotos: 'profile-photos',
      evidenceFiles: 'evidence-files',
      documents: 'documents',
      images: 'images',
      audio: 'audio',
      video: 'video',
      caseAttachments: 'case-attachments',
    },
  },
};

export function getAuthCallbackUrl() {
  const base = config.app.url || window.location.origin;
  return `${base.replace(/\/$/, '')}${config.app.authCallbackPath}`;
}

export function assertSupabaseConfig() {
  if (!config.supabase.url || !config.supabase.anonKey) {
    console.error(
      'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env and fill values.'
    );
  }
}
