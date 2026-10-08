import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function useRealtimeIncidents() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connected' | 'reconnecting' | 'disconnected'

  const fetchIncidents = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('incidents_with_coords')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setIncidents(data);
      }
    } catch (err) {
      console.warn('Error fetching incidents:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchIncidentsRef = useRef(fetchIncidents);
  useEffect(() => {
    fetchIncidentsRef.current = fetchIncidents;
  }, [fetchIncidents]);

  useEffect(() => {
    fetchIncidentsRef.current();

    // 1. Each channel gets a UNIQUE name per mount
    const channelName = `incidents-${user?.id || 'anon'}-${Math.random().toString(36).slice(2)}`;

    // 2. All .on('postgres_changes', ...) calls are chained BEFORE .subscribe()
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'incidents' },
        (payload) => {
          console.log('[Realtime Incident Update]:', payload.eventType, payload.new);
          fetchIncidentsRef.current();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setConnectionStatus('reconnecting');
        } else if (status === 'CLOSED') {
          setConnectionStatus('disconnected');
        }
      });

    // 3. The useEffect cleanup calls supabase.removeChannel(channel)
    return () => {
      try {
        if (channel) {
          supabase.removeChannel(channel);
        }
      } catch (err) {
        console.warn('Error removing channel:', err);
      }
    };
  }, [user?.id]); // 4. Stable dependencies (only resubscribe if user identity changes)

  const openIncidents = incidents.filter((i) => i.status === 'open');
  const activeIncidents = incidents.filter((i) => i.status === 'accepted');
  const resolvedIncidents = incidents.filter((i) => i.status === 'resolved');

  // If the logged in user has an active emergency (either reported or accepted)
  const myActiveIncident = incidents.find(
    (i) =>
      (i.reporter_id === user?.id || i.accepted_by === user?.id) &&
      (i.status === 'open' || i.status === 'accepted')
  );

  return {
    incidents,
    openIncidents,
    activeIncidents,
    resolvedIncidents,
    myActiveIncident,
    loading,
    connectionStatus,
    refreshIncidents: fetchIncidents,
  };
}
