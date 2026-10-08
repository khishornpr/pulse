import React from 'react';
import {
  Activity,
  HeartPulse,
  AlertCircle,
  Flame,
  ShieldAlert,
  Droplets,
  AlertTriangle,
  MapPin,
  CheckCircle,
  XCircle,
  Loader2,
  Navigation,
  ExternalLink,
  Volume2
} from 'lucide-react';
import CampusMap from './CampusMap';
import { INCIDENT_TYPES } from '../lib/constants';

export default function IncomingAlertModal({
  alert,
  onAccept,
  onDecline,
  accepting = false,
  errorMsg = null,
  onDismiss = null,
}) {
  if (!alert) return null;

  const incident = alert.incident || {};
  const typeConfig = INCIDENT_TYPES.find((t) => t.id === incident.type) || INCIDENT_TYPES[0];
  const distanceStr = alert.distance_m ? `${Math.round(alert.distance_m)}m away` : 'Nearby on campus';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/90 backdrop-blur-lg animate-in fade-in zoom-in-95 duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-navy-900 border-2 border-emergency-500 shadow-2xl shadow-emergency-600/40 overflow-hidden text-slate-100 flex flex-col">
        {/* Pulsing Alert Banner */}
        <div className="p-4 bg-gradient-to-r from-emergency-700 via-emergency-600 to-rose-600 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center animate-bounce">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-widest font-black text-white/90">
                Incoming Emergency Dispatch
              </p>
              <h3 className="font-extrabold text-lg leading-tight">First Responder Alert</h3>
            </div>
          </div>
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-white/20 text-xs font-bold animate-pulse">
            <Volume2 className="w-3.5 h-3.5" />
            <span>Siren Active</span>
          </div>
        </div>

        {/* Error message / Race condition notice */}
        {errorMsg && (
          <div className="mx-5 mt-4 p-3.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-bold">{errorMsg}</span>
            </div>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="px-2 py-1 rounded-lg bg-navy-900 text-[11px] font-bold text-slate-200 hover:bg-navy-800"
              >
                Dismiss
              </button>
            )}
          </div>
        )}

        {/* Incident Summary Body */}
        <div className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3 p-3.5 rounded-2xl bg-navy-950 border border-navy-800">
            <div>
              <span
                className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wide border mb-1.5 ${typeConfig.badgeClass}`}
              >
                {typeConfig.label}
              </span>
              <h4 className="font-bold text-base text-white flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emergency-400 shrink-0" />
                <span>{incident.location_label || 'KPRIET Campus'}</span>
              </h4>
              {incident.description && (
                <p className="text-xs text-slate-300 mt-1 italic leading-relaxed">
                  "{incident.description}"
                </p>
              )}
              {incident.blood_group_needed && (
                <p className="text-xs text-rose-400 font-bold mt-1">
                  Required Blood Group: {incident.blood_group_needed}
                </p>
              )}
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                Distance
              </span>
              <span className="font-extrabold text-sm text-emerald-400 font-mono">
                {distanceStr}
              </span>
            </div>
          </div>

          {/* Incident Mini Map */}
          {incident.lat && incident.lng && (
            <div className="rounded-2xl overflow-hidden border border-navy-800">
              <CampusMap
                incidents={[incident]}
                centerCoords={{ lat: incident.lat, lng: incident.lng }}
                height="160px"
                zoom={18}
                interactive={false}
              />
            </div>
          )}

          {/* Action Buttons: Accept (Atomic) & Decline */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => onAccept(incident.id || alert.incident_id)}
              disabled={accepting || Boolean(errorMsg)}
              className="flex-1 py-4 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:brightness-110 text-white font-black text-base shadow-xl shadow-emerald-600/40 flex items-center justify-center space-x-2 transition-all transform active:scale-98 disabled:opacity-50"
            >
              {accepting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Claiming Incident...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>ACCEPT & RESPOND</span>
                </>
              )}
            </button>

            <button
              onClick={() => onDecline(alert.id)}
              disabled={accepting}
              className="py-3 sm:py-4 px-5 rounded-2xl bg-navy-950 hover:bg-navy-800 border border-navy-700 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors"
            >
              <XCircle className="w-4 h-4 text-rose-400" />
              <span>Decline</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
