import React, { useState } from 'react';
import {
  Activity,
  HeartPulse,
  Radio,
  MapPin,
  Shield,
  Clock,
  Users,
  AlertTriangle,
  Compass
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGeolocation } from '../hooks/useGeolocation';
import { useRealtimeIncidents } from '../hooks/useRealtimeIncidents';
import SosButton from '../components/SosButton';
import EmergencyModal from '../components/EmergencyModal';
import IncidentTracker from '../components/IncidentTracker';
import CampusMap from '../components/CampusMap';

export default function HomePage() {
  const { user, profile, role } = useAuth();
  const { coords, isGpsActive, accuracy } = useGeolocation(false);
  const {
    incidents,
    myActiveIncident,
    refreshIncidents,
  } = useRealtimeIncidents();

  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 animate-in fade-in">
      {/* Active Incident Tracker Banner (if user has active emergency) */}
      {myActiveIncident && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-emergency-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emergency-500 animate-ping"></span>
            <span>Active Campus Emergency</span>
          </div>
          <IncidentTracker
            incident={myActiveIncident}
            onResolved={refreshIncidents}
            onCancelled={refreshIncidents}
          />
        </div>
      )}

      {/* Main SOS Trigger Hero Card */}
      {!myActiveIncident && (
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-navy-900 via-navy-900 to-navy-950 border border-navy-800 shadow-2xl flex flex-col items-center justify-center text-center relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emergency-600/10 rounded-full blur-3xl pointer-events-none"></div>

          {/* User Welcome */}
          <div className="mb-2 space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Campus Emergency Grid
            </h1>
            <p className="text-xs text-slate-300">
              Welcome, <span className="font-bold text-white">{profile?.full_name || user?.email}</span> ({profile?.department || 'Student'})
            </p>
          </div>

          {/* Giant Pulsing SOS Button */}
          <SosButton
            onClick={() => setIsModalOpen(true)}
            isEmergencyActive={Boolean(myActiveIncident)}
          />

          {/* Live Campus Telemetry Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-lg mt-4">
            <div className="p-3 rounded-2xl bg-navy-950/80 border border-navy-800 text-center">
              <div className="flex items-center justify-center space-x-1 text-emerald-400 mb-1">
                <Users className="w-3.5 h-3.5" />
                <span className="font-extrabold text-sm">12 Active</span>
              </div>
              <p className="text-[10px] text-slate-400">Responders on Duty</p>
            </div>

            <div className="p-3 rounded-2xl bg-navy-950/80 border border-navy-800 text-center">
              <div className="flex items-center justify-center space-x-1 text-emergency-400 mb-1">
                <Clock className="w-3.5 h-3.5" />
                <span className="font-extrabold text-sm">&lt; 45s</span>
              </div>
              <p className="text-[10px] text-slate-400">Average Response</p>
            </div>

            <div className="col-span-2 sm:col-span-1 p-3 rounded-2xl bg-navy-950/80 border border-navy-800 text-center">
              <div className="flex items-center justify-center space-x-1 text-blue-400 mb-1">
                <Compass className="w-3.5 h-3.5" />
                <span className="font-extrabold text-sm">1.5 km</span>
              </div>
              <p className="text-[10px] text-slate-400">GPS Match Radius</p>
            </div>
          </div>
        </div>
      )}

      {/* Live Campus Radar Map */}
      <div className="p-5 rounded-3xl bg-navy-900 border border-navy-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-emergency-400" />
            <h3 className="font-bold text-sm text-white">Live KPRIET Campus Map</h3>
          </div>
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isGpsActive ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
            <span>{isGpsActive ? 'GPS Locked' : 'Campus Center'}</span>
          </span>
        </div>

        <div className="rounded-2xl overflow-hidden border border-navy-800">
          <CampusMap
            userCoords={coords}
            incidents={incidents.filter((i) => i.status === 'open' || i.status === 'accepted')}
            height="320px"
            zoom={17}
          />
        </div>
      </div>

      {/* Emergency Bottom Sheet / Modal */}
      <EmergencyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userCoords={coords}
        onIncidentCreated={async () => {
          await refreshIncidents();
        }}
      />
    </div>
  );
}
