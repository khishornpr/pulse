import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { KPRIET_CAMPUS } from '../lib/constants';

function HeatLayerWrapper({ points }) {
  const map = useMap();
  const heatLayerRef = useRef(null);

  useEffect(() => {
    if (!map) return;

    // Format: [lat, lng, intensity]
    const heatData = points.map((p) => [
      p.lat || 11.0827,
      p.lng || 77.1420,
      p.intensity || (p.type === 'medical' || p.type === 'fire' ? 1.0 : 0.7),
    ]);

    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
    }

    if (heatData.length > 0 && typeof L.heatLayer === 'function') {
      try {
        heatLayerRef.current = L.heatLayer(heatData, {
          radius: 35,
          blur: 20,
          maxZoom: 18,
          max: 1.0,
          gradient: {
            0.2: '#3B82F6',
            0.4: '#10B981',
            0.6: '#F59E0B',
            0.8: '#EF4444',
            1.0: '#991B1B',
          },
        }).addTo(map);
      } catch (err) {
        console.warn('Leaflet heat layer initialization error:', err);
      }
    }

    return () => {
      if (heatLayerRef.current && map) {
        map.removeLayer(heatLayerRef.current);
      }
    };
  }, [map, points]);

  return null;
}

export default function HeatmapView({ incidents = [], height = '450px' }) {
  // If no incidents recorded, provide representative campus density points
  const heatPoints = incidents.length > 0
    ? incidents.filter((i) => i.lat && i.lng)
    : [
        { lat: 11.0827, lng: 77.1420, intensity: 0.9 },
        { lat: 11.0829, lng: 77.1418, intensity: 0.8 },
        { lat: 11.0825, lng: 77.1410, intensity: 0.7 },
        { lat: 11.0818, lng: 77.1425, intensity: 0.95 },
        { lat: 11.0834, lng: 77.1422, intensity: 0.6 },
        { lat: 11.0812, lng: 77.1419, intensity: 0.85 },
      ];

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-navy-700/80 shadow-2xl bg-navy-950" style={{ height }}>
      <MapContainer
        center={[KPRIET_CAMPUS.center.lat, KPRIET_CAMPUS.center.lng]}
        zoom={17}
        minZoom={15}
        maxZoom={19}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="filter brightness-90 contrast-110"
        />
        <HeatLayerWrapper points={heatPoints} />
      </MapContainer>

      {/* Heatmap intensity legend */}
      <div className="absolute top-3 right-3 z-[400] p-3 rounded-xl bg-navy-950/90 backdrop-blur-md border border-navy-700 text-xs text-slate-200 shadow-xl space-y-1.5">
        <p className="font-bold text-slate-100 flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-emergency-500 animate-pulse"></span>
          <span>Campus Incident Density</span>
        </p>
        <div className="w-36 h-2 rounded-full bg-gradient-to-r from-blue-500 via-emerald-400 via-amber-400 to-red-600"></div>
        <div className="flex justify-between text-[10px] text-slate-400 font-medium">
          <span>Low Risk</span>
          <span>Moderate</span>
          <span>High Risk</span>
        </div>
      </div>
    </div>
  );
}
