import { useEffect, useState } from 'react';
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

  useEffect(() => {
    if (!tables || tables.length === 0) return;

    const channels = tables.map((table) => {
      return supabase
        .channel(`public:${table}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: table },
          (payload) => {
            console.log(`Realtime update on ${table}:`, payload);
            setLastUpdate(Date.now());
            if (onUpdate) {
              onUpdate(payload);
            }
          }
        )
        .subscribe();
    });

    return () => {
      channels.forEach((channel) => supabase.removeChannel(channel));
    };
  }, [tables.join(','), onUpdate]);

  return lastUpdate;
}
