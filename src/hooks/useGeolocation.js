import { useState, useEffect, useRef } from 'react';
import { KPRIET_CAMPUS } from '../lib/constants.js';
import { rpcUpdateMyLocation } from '../lib/supabase.js';

export function useGeolocation(autoSyncVolunteer = false) {
  const [coords, setCoords] = useState(KPRIET_CAMPUS.center);
  const [accuracy, setAccuracy] = useState(null);
  const [isGpsActive, setIsGpsActive] = useState(false);
  const [error, setError] = useState(null);
  const lastSyncTime = useRef(0);

  useEffect(() => {
    let watchId = null;

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newCoords = {
            lat: Number(pos.coords.latitude.toFixed(6)),
            lng: Number(pos.coords.longitude.toFixed(6)),
          };
          setCoords(newCoords);
          setAccuracy(pos.coords.accuracy);
          setIsGpsActive(true);
        },
        (err) => {
          console.warn('Geolocation initial query error or denied, using KPRIET center:', err.message);
          setError(err.message);
          setIsGpsActive(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );

      // Throttled watchPosition (approx every 20 seconds for volunteer sync)
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const newCoords = {
            lat: Number(pos.coords.latitude.toFixed(6)),
            lng: Number(pos.coords.longitude.toFixed(6)),
          };
          setCoords(newCoords);
          setAccuracy(pos.coords.accuracy);
          setIsGpsActive(true);

          const now = Date.now();
          if (autoSyncVolunteer && now - lastSyncTime.current >= 20000) {
            lastSyncTime.current = now;
            rpcUpdateMyLocation(newCoords.lat, newCoords.lng);
          }
        },
        (err) => {
          console.warn('WatchPosition error:', err.message);
        },
        { enableHighAccuracy: true, maximumAge: 15000, timeout: 15000 }
      );
    } else {
      setError('Geolocation not supported on this browser');
    }

    return () => {
      if (watchId !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [autoSyncVolunteer]);

  return {
    coords,
    setCoords,
    accuracy,
    isGpsActive,
    error,
    refreshLocation: () => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition((pos) => {
          setCoords({
            lat: Number(pos.coords.latitude.toFixed(6)),
            lng: Number(pos.coords.longitude.toFixed(6)),
          });
          setIsGpsActive(true);
        });
      }
    },
  };
}

export function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}
