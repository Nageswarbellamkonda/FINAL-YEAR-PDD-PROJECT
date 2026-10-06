import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * useRealtimeSync
 * Subscribes to postgres changes for specified tables and triggers a callback when data changes.
 * 
 * @param {string[]} tables Array of table names to watch (e.g., ['complaints', 'station_alerts'])
 * @param {Function} onUpdate Callback function triggered when an insert/update/delete happens
 */
export function useRealtimeSync(tables = [], onUpdate) {
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const callbackRef = useRef(onUpdate);

  useEffect(() => {
    callbackRef.current = onUpdate;
  }, [onUpdate]);

  const tablesKey = (tables || []).slice().sort().join(',');

  useEffect(() => {
    if (!tables || tables.length === 0) return;

    const channels = tables.map((table) => {
      const channelId = `realtime:${table}:${Math.random().toString(36).slice(2, 9)}`;
      return supabase
        .channel(channelId)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: table },
          (payload) => {
            console.log(`Realtime update on ${table}:`, payload);
            setLastUpdate(Date.now());
            if (callbackRef.current) {
              callbackRef.current(payload);
            }
          }
        )
        .subscribe();
    });

    return () => {
      channels.forEach((channel) => {
        try {
          supabase.removeChannel(channel);
        } catch (e) {
          // ignore cleanup errors
        }
      });
    };
  }, [tablesKey]);

  return lastUpdate;
}

