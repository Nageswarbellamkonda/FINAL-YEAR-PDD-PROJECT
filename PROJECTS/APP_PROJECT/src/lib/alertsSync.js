import { supabase } from '@/lib/supabase';

// Channel name used across the application for Realtime synchronization
export const ALERTS_REALTIME_CHANNEL = 'station_alerts_sync';

// Global shared subscriber registry to allow multiple components (NoticeBoard, ScrollingTicker, Navbar, etc.)
// to listen to real-time events on the single underlying Supabase Realtime channel without collisions.
const subscribers = new Set();
let sharedChannel = null;

// Native browser BroadcastChannel for zero-latency cross-tab communication on the same origin
const crossTabBus = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('nyayamitra_alerts_sync_bus')
  : null;

function notifySubscribers(event) {
  subscribers.forEach((callback) => {
    try {
      callback(event);
    } catch (err) {
      console.error('[alertsSync] Error in alert subscriber callback:', err);
    }
  });
}

if (crossTabBus) {
  crossTabBus.onmessage = (event) => {
    try {
      console.log('[alertsSync] Cross-tab broadcast received:', event.data);
      notifySubscribers({ source: 'crosstab_broadcast', payload: event.data });
    } catch (err) {
      console.warn('[alertsSync] Error handling cross-tab message:', err);
    }
  };
}

// Auto-refresh when tab gains focus or becomes visible
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      notifySubscribers({ source: 'visibility_change', payload: { action: 'FOCUS_REFRESH' } });
    }
  });
}

function getOrCreateSharedChannel() {
  if (sharedChannel) {
    return sharedChannel;
  }

  // Check if Supabase client already holds this channel in memory
  const existingChannels = typeof supabase.getChannels === 'function' ? supabase.getChannels() : [];
  const existing = existingChannels.find(
    (c) => c.topic === `realtime:${ALERTS_REALTIME_CHANNEL}` || c.topic === ALERTS_REALTIME_CHANNEL
  );

  if (existing) {
    sharedChannel = existing;
    return sharedChannel;
  }

  try {
    const channel = supabase.channel(ALERTS_REALTIME_CHANNEL, {
      config: {
        broadcast: { ack: false, self: true }
      }
    });

    // 1. MUST register ALL postgres_changes callbacks FIRST BEFORE subscribe()
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'station_alerts' },
      (payload) => {
        console.log('[alertsSync] Realtime postgres_changes event:', payload?.eventType);
        notifySubscribers({ source: 'postgres_changes', payload });
      }
    );

    // 2. MUST register broadcast callbacks BEFORE subscribe()
    channel.on(
      'broadcast',
      { event: 'ALERT_CHANGED' },
      (payload) => {
        console.log('[alertsSync] Realtime broadcast event received:', payload);
        notifySubscribers({ source: 'broadcast', payload: payload?.payload });
      }
    );

    // 3. MUST call subscribe() LAST
    channel.subscribe((status, err) => {
      if (err) {
        console.warn('[alertsSync] Realtime subscription status error:', status, err);
      } else {
        console.log('[alertsSync] Realtime channel subscription status:', status);
      }
    });

    sharedChannel = channel;
    return sharedChannel;
  } catch (err) {
    console.error('[alertsSync] Failed to initialize Realtime channel:', err);
    sharedChannel = null;
    return null;
  }
}

/**
 * Normalizes destination from alert record
 */
export function getAlertDestination(alert) {
  if (!alert) return 'BOTH';

  // Handle case where destination string itself or target_audience was passed
  if (typeof alert === 'string') {
    const upper = alert.trim().toUpperCase();
    if (upper === 'PUBLIC_NOTICE' || upper === 'NOTICE_BOARD') return 'PUBLIC_NOTICE';
    if (upper === 'SMART_CRIME_ALERT' || upper === 'HEADER_TICKER' || upper === 'CRIME_ALERT') return 'SMART_CRIME_ALERT';
    if (upper === 'BOTH' || upper === 'ALL' || upper === 'PUBLIC') return 'BOTH';
    try {
      const parsed = JSON.parse(alert);
      return getAlertDestination(parsed);
    } catch {
      return 'BOTH';
    }
  }

  // Extract audience whether on alert.target_audience or directly on alert
  let audience = alert.target_audience || alert;
  if (typeof audience === 'string') {
    try {
      audience = JSON.parse(audience);
    } catch {
      const upper = audience.trim().toUpperCase();
      if (upper === 'PUBLIC_NOTICE' || upper === 'SMART_CRIME_ALERT' || upper === 'BOTH') {
        return upper;
      }
      audience = {};
    }
  }

  if (audience && typeof audience === 'object') {
    if (audience.destination) {
      const dest = String(audience.destination).toUpperCase();
      if (['PUBLIC_NOTICE', 'SMART_CRIME_ALERT', 'BOTH'].includes(dest)) {
        return dest;
      }
    }
    if (audience.show_in_notice_board && !audience.show_in_ticker) {
      return 'PUBLIC_NOTICE';
    }
    if (!audience.show_in_notice_board && audience.show_in_ticker) {
      return 'SMART_CRIME_ALERT';
    }
    if (audience.show_in_notice_board && audience.show_in_ticker) {
      return 'BOTH';
    }
  }

  // Heuristic based on alert_type
  const type = (alert.alert_type || '').toLowerCase();
  if (['missing', 'reward', 'public_notice', 'naxal', 'forest'].includes(type)) {
    return 'PUBLIC_NOTICE';
  }
  if (['crime_alert', 'emergency', 'cyber_crime'].includes(type)) {
    return 'SMART_CRIME_ALERT';
  }

  // Default to BOTH for all other general advisories
  return 'BOTH';
}

/**
 * Fetches all active published alerts from station_alerts
 */
export async function fetchPublishedAlerts() {
  try {
    const { data, error } = await supabase
      .from('station_alerts')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.warn('[alertsSync] Failed to fetch published alerts:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('[alertsSync] Exception fetching alerts:', err);
    return [];
  }
}

/**
 * Fetches active notices for the Public Notice Board
 * Filters for destination: PUBLIC_NOTICE or BOTH
 */
export async function fetchPublicNotices() {
  const allAlerts = await fetchPublishedAlerts();
  return allAlerts.filter(a => {
    const dest = getAlertDestination(a);
    return dest === 'PUBLIC_NOTICE' || dest === 'BOTH';
  });
}

/**
 * Fetches active alerts for Smart Crime Alerts / Home Header Ticker
 * Filters for destination: SMART_CRIME_ALERT or BOTH
 */
export async function fetchSmartCrimeAlerts() {
  const allAlerts = await fetchPublishedAlerts();
  return allAlerts.filter(a => {
    const dest = getAlertDestination(a);
    return dest === 'SMART_CRIME_ALERT' || dest === 'BOTH';
  });
}

/**
 * Subscribes a component to Realtime updates on station_alerts.
 * Safely shares the single underlying Realtime channel across multiple components.
 *
 * @param {Function} onChange Callback triggered when any alert is inserted, updated, or deleted
 * @returns {Function} Unsubscribe cleanup function
 */
export function subscribeAlertsRealtime(onChange) {
  if (typeof onChange !== 'function') return () => {};

  subscribers.add(onChange);

  // Safely ensure channel is created and subscribed without crashing
  try {
    getOrCreateSharedChannel();
  } catch (err) {
    console.warn('[alertsSync] Failed to ensure shared Realtime channel:', err);
  }

  return () => {
    subscribers.delete(onChange);

    // When the last listener unmounts, remove channel from Supabase
    if (subscribers.size === 0 && sharedChannel) {
      const channelToClean = sharedChannel;
      sharedChannel = null;
      try {
        supabase.removeChannel(channelToClean);
      } catch (err) {
        console.warn('[alertsSync] Error removing Realtime channel:', err);
      }
    }
  };
}

/**
 * Dispatches a Realtime broadcast to immediately inform all connected listeners
 * (notifies local listeners in the current tab immediately, and remote tabs via Realtime)
 */
export async function broadcastAlertChange(action, alertData) {
  // 1. Immediately notify local subscribers in the current tab/window
  try {
    notifySubscribers({
      source: 'local_broadcast',
      payload: { action, alert: alertData, timestamp: Date.now() }
    });
  } catch (e) {
    console.warn('[alertsSync] Local broadcast error:', e);
  }

  // 2. Broadcast across other tabs on the same origin via BroadcastChannel
  if (crossTabBus) {
    try {
      crossTabBus.postMessage({
        action,
        alert: alertData,
        timestamp: Date.now()
      });
    } catch (err) {
      console.warn('[alertsSync] Cross-tab bus postMessage error:', err);
    }
  }

  // 3. Broadcast across other tabs/browsers via Supabase Realtime channel
  try {
    const channel = getOrCreateSharedChannel();
    if (channel) {
      await channel.send({
        type: 'broadcast',
        event: 'ALERT_CHANGED',
        payload: {
          action,
          alert: alertData,
          timestamp: Date.now()
        }
      });
    }
  } catch (err) {
    console.warn('[alertsSync] Realtime broadcast send failed (non-critical):', err);
  }
}

