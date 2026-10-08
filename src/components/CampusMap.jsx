import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { KPRIET_CAMPUS, CAMPUS_BLOCKS, INCIDENT_TYPES } from '../lib/constants';
import {
  HeartPulse,
  AlertCircle,
  Flame,
  ShieldAlert,
  Droplets,
  AlertTriangle,
  User,
  Shield,
  MapPin,
  Radio
} from 'lucide-react';

// Custom Leaflet DivIcons using SVGs to eliminate asset path issues
function createSvgIcon(type, status = 'open', label = '') {
  let bgColor = '#EF4444';
  let pulseHtml = '<div class="absolute -inset-2 rounded-full bg-red-500/40 animate-ping"></div>';

  if (type === 'volunteer') {
    bgColor = '#10B981';
    pulseHtml = '<div class="absolute -inset-1.5 rounded-full bg-emerald-500/30 animate-pulse"></div>';
    return L.divIcon({
      className: 'custom-leaflet-icon',
      html: `
        <div class="relative flex items-center justify-center w-8 h-8 rounded-full shadow-lg border-2 border-white cursor-pointer" style="background: ${bgColor};">
          ${pulseHtml}
          <svg class="w-4 h-4 text-white z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  }

  if (type === 'user_location') {
    return L.divIcon({
      className: 'custom-leaflet-icon',
      html: `
        <div class="relative flex items-center justify-center w-7 h-7 rounded-full shadow-lg border-2 border-white" style="background: #3B82F6;">
          <div class="absolute -inset-2 rounded-full bg-blue-500/40 animate-ping"></div>
          <div class="w-2.5 h-2.5 rounded-full bg-white z-10"></div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
  }

  if (type === 'draggable_pin') {
    return L.divIcon({
      className: 'custom-leaflet-icon',
      html: `
        <div class="relative flex items-center justify-center w-10 h-10 -mt-5 -ml-5 drop-shadow-2xl cursor-grab">
          <div class="absolute -inset-2 rounded-full bg-red-500/50 animate-ping"></div>
          <svg class="w-10 h-10 text-red-500 fill-current filter drop-shadow-md" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
    });
  }

  const incType = INCIDENT_TYPES.find((t) => t.id === type);
  bgColor = incType?.color || '#EF4444';

  if (status === 'resolved') {
    pulseHtml = '';
    bgColor = '#64748B';
  } else if (status === 'accepted') {
    bgColor = '#F59E0B';
    pulseHtml = '<div class="absolute -inset-2 rounded-full bg-amber-500/40 animate-ping"></div>';
  }

  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `
      <div class="relative flex items-center justify-center w-9 h-9 rounded-full shadow-2xl border-2 border-white cursor-pointer" style="background: ${bgColor};">
        ${pulseHtml}
        <div class="w-4 h-4 text-white z-10 flex items-center justify-center font-bold text-xs">
          !
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

// Draggable marker handler for SOS coordinate picking
function DraggableMarker({ position, onPositionChange }) {
  const markerRef = React.useRef(null);
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const newPos = marker.getLatLng();
          onPositionChange({
            lat: Number(newPos.lat.toFixed(6)),
            lng: Number(newPos.lng.toFixed(6)),
          });
        }
      },
    }),
    [onPositionChange]
  );

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={[position.lat, position.lng]}
      ref={markerRef}
      icon={createSvgIcon('draggable_pin')}
    >
      <Popup>
        <div className="text-xs">
          <p className="font-bold text-slate-100">Selected Incident Spot</p>
          <p className="text-slate-400">Drag this pin to exact campus location</p>
        </div>
      </Popup>
    </Marker>
  );
}

// Map center synchronizer
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center.lat && center.lng) {
      map.setView([center.lat, center.lng], zoom || map.getZoom());
    }
  }, [center, zoom, map]);
  return null;
}

export default function CampusMap({
  incidents = [],
  volunteers = [],
  userCoords = null,
  selectedCoords = null,
  onCoordsChange = null,
  isDraggable = false,
  showBlocks = true,
  height = '400px',
  interactive = true,
  centerCoords = null,
  zoom = 17,
  activeRoute = null, // { from: [lat, lng], to: [lat, lng] }
}) {
  const center = centerCoords || userCoords || KPRIET_CAMPUS.center;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-navy-700/80 shadow-2xl bg-navy-950" style={{ height }}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        minZoom={15}
        maxZoom={19}
        scrollWheelZoom={interactive}
        dragging={interactive}
        zoomControl={interactive}
        className="w-full h-full"
      >
        <ChangeView center={center} zoom={zoom} />

        {/* Clean OpenStreetMap CartoDB Dark Matter or OSM Standard */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="filter brightness-90 contrast-110"
        />

        {/* Campus Boundary Circle */}
        <Circle
          center={[KPRIET_CAMPUS.center.lat, KPRIET_CAMPUS.center.lng]}
          radius={500}
          pathOptions={{
            color: '#3A506B',
            fillColor: '#0B132B',
            fillOpacity: 0.1,
            weight: 1.5,
            dashArray: '6, 6',
          }}
        />

        {/* Draggable Reporting Marker */}
        {isDraggable && selectedCoords && onCoordsChange && (
          <DraggableMarker position={selectedCoords} onPositionChange={onCoordsChange} />
        )}

        {/* User Current Location Marker */}
        {userCoords && !isDraggable && (
          <Marker position={[userCoords.lat, userCoords.lng]} icon={createSvgIcon('user_location')}>
            <Popup>
              <div className="text-xs">
                <p className="font-bold text-blue-400">Your Current GPS Spot</p>
                <p className="text-slate-300">Lat: {userCoords.lat}, Lng: {userCoords.lng}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Incidents Markers */}
        {incidents.map((inc) => {
          if (!inc.lat || !inc.lng) return null;
          return (
            <Marker
              key={inc.id}
              position={[inc.lat, inc.lng]}
              icon={createSvgIcon(inc.type, inc.status)}
            >
              <Popup>
                <div className="text-xs space-y-1 max-w-[200px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-100 uppercase tracking-wide">
                      {inc.type}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        inc.status === 'open'
                          ? 'bg-red-500/20 text-red-400'
                          : inc.status === 'accepted'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-slate-500/20 text-slate-400'
                      }`}
                    >
                      {inc.status}
                    </span>
                  </div>
                  <p className="font-semibold text-slate-200">{inc.location_label}</p>
                  {inc.description && <p className="text-slate-300 text-[11px]">{inc.description}</p>}
                  {inc.blood_group_needed && (
                    <p className="text-rose-400 font-bold">Blood Needed: {inc.blood_group_needed}</p>
                  )}
                  {inc.volunteer_name && (
                    <p className="text-emerald-400 font-medium">
                      Responder: {inc.volunteer_name}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Available Volunteers Markers */}
        {volunteers.map((vol) => {
          if (!vol.lat || !vol.lng || !vol.is_available) return null;
          return (
            <Marker
              key={vol.id}
              position={[vol.lat, vol.lng]}
              icon={createSvgIcon('volunteer')}
            >
              <Popup>
                <div className="text-xs space-y-1">
                  <div className="flex items-center space-x-1 text-emerald-400 font-bold">
                    <Radio className="w-3.5 h-3.5" />
                    <span>Active First Responder</span>
                  </div>
                  <p className="font-semibold text-slate-100">{vol.full_name}</p>
                  <p className="text-slate-400">{vol.department}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {vol.skills?.map((s) => (
                      <span key={s} className="text-[9px] px-1.5 py-0.5 rounded bg-navy-800 text-emerald-300 border border-emerald-500/20">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Active Route between Responder and Victim */}
        {activeRoute && activeRoute.from && activeRoute.to && (
          <Polyline
            positions={[activeRoute.from, activeRoute.to]}
            pathOptions={{
              color: '#10B981',
              weight: 4,
              dashArray: '8, 8',
              opacity: 0.9,
            }}
          />
        )}
      </MapContainer>

      {/* Map Legend & Overlay */}
      <div className="absolute bottom-3 left-3 z-[400] px-3 py-2 rounded-xl bg-navy-950/90 backdrop-blur-md border border-navy-700 text-[11px] text-slate-300 shadow-xl space-y-1 pointer-events-none">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
          <span>Emergency Incident</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>Active First Responder</span>
        </div>
      </div>
    </div>
  );
}
