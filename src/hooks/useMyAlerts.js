import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, rpcAcceptIncident } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { playEmergencyAlarm, stopEmergencyAlarm, playSuccessChime } from '../lib/audio';

export function useMyAlerts() {
  const { user, isAvailable } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [incomingAlert, setIncomingAlert] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [accepting, setAccepting] = useState(false);

  const fetchAlerts = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('incident_alerts')
        .select(`
          *,
          incident:incidents_with_coords(*)
        `)
        .eq('volunteer_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setAlerts(data);

        // Check if there is an unhandled 'sent' alert for an 'open' incident
        const pending = data.find(
          (a) => a.status === 'sent' && a.incident && a.incident.status === 'open'
        );

        if (pending && isAvailable) {
          setIncomingAlert(pending);
          playEmergencyAlarm();
        } else if (!pending) {
          setIncomingAlert(null);
          stopEmergencyAlarm();
        }
      }
    } catch (err) {
      console.warn('Error fetching alerts:', err);
    }
  }, [user, isAvailable]);

  const fetchAlertsRef = useRef(fetchAlerts);
  useEffect(() => {
    fetchAlertsRef.current = fetchAlerts;
  }, [fetchAlerts]);

  useEffect(() => {
    if (!user) {
      setAlerts([]);
      setIncomingAlert(null);
      return;
    }

    fetchAlertsRef.current();

    // 1. Each channel gets a UNIQUE name per mount
    const channelName = `alerts-${user.id}-${Math.random().toString(36).slice(2)}`;

    // 2. All .on('postgres_changes', ...) calls are chained BEFORE .subscribe()
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'incident_alerts', filter: `volunteer_id=eq.${user.id}` },
        (payload) => {
          console.log('[Realtime Alert for Volunteer]:', payload);
          fetchAlertsRef.current();
        }
      )
      .subscribe();

    // 3. The useEffect cleanup calls supabase.removeChannel(channel)
    return () => {
      stopEmergencyAlarm();
      try {
        if (channel) {
          supabase.removeChannel(channel);
        }
      } catch (err) {
        console.warn('Error removing channel:', err);
      }
    };
  }, [user?.id]); // 4. Stable dependencies (only resubscribe if user identity changes)

  // Handle Accept
  const acceptAlert = async (incidentId) => {
    setAccepting(true);
    setActionError(null);
    stopEmergencyAlarm();
    try {
      const { data, error } = await rpcAcceptIncident(incidentId);
      if (error) throw error;

      if (data?.success) {
        playSuccessChime();
        setIncomingAlert(null);
        await fetchAlerts();
        return { success: true };
      } else {
        setActionError(data?.message || 'Already taken by another volunteer!');
        return { success: false, message: data?.message };
      }
    } catch (err) {
      setActionError(err.message || 'Failed to accept incident');
      return { success: false, message: err.message };
    } finally {
      setAccepting(false);
    }
  };

  // Handle Decline
  const declineAlert = async (alertId) => {
    stopEmergencyAlarm();
    setIncomingAlert(null);
    try {
      await supabase
        .from('incident_alerts')
        .update({ status: 'declined' })
        .eq('id', alertId);
      fetchAlerts();
    } catch (err) {
      console.warn('Error declining alert:', err);
    }
  };

  // Currently accepted incident for this volunteer
  const acceptedIncident = alerts.find(
    (a) => a.status === 'accepted' && a.incident && (a.incident.status === 'accepted' || a.incident.status === 'open')
  )?.incident;

  return {
    alerts,
    incomingAlert,
    acceptedIncident,
    actionError,
    accepting,
    acceptAlert,
    declineAlert,
    dismissAlertModal: () => {
      stopEmergencyAlarm();
      setIncomingAlert(null);
    },
    refreshAlerts: fetchAlerts,
  };
}
