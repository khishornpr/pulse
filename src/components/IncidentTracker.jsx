import React, { useState, useEffect } from 'react';
import {
  Clock,
  Phone,
  CheckCircle,
  XCircle,
  ExternalLink,
  ShieldCheck,
  User,
  Radio,
  MapPin,
  Loader2,
  Navigation
} from 'lucide-react';
import CampusMap from './CampusMap';
import { rpcResolveIncident, rpcCancelIncident } from '../lib/supabase';
import { playSuccessChime } from '../lib/audio';
import { INCIDENT_TYPES } from '../lib/constants';

export default function IncidentTracker({
  incident,
  onResolved,
  onCancelled,
}) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Live timer counting up since incident was created
  useEffect(() => {
    if (!incident?.created_at) return;

    const startMs = new Date(incident.created_at).getTime();
    const updateTimer = () => {
      const diff = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
      setElapsedSeconds(diff);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [incident?.created_at]);

  const formatTimer = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  };

  const handleResolve = async () => {
    if (!incident?.id) return;
    setActionLoading(true);
    setErrorMsg(null);
    try {
      const { data, error } = await rpcResolveIncident(incident.id);
      if (error) throw error;
      playSuccessChime();
      if (onResolved) onResolved(incident.id);
    } catch (err) {
      console.error('Failed to resolve incident:', err);
      setErrorMsg(err.message || 'Failed to resolve incident');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!incident?.id) return;
    if (!window.confirm('Are you sure you want to cancel this emergency alert?')) return;

    setActionLoading(true);
    setErrorMsg(null);
    try {
      const { data, error } = await rpcCancelIncident(incident.id);
      if (error) throw error;
      if (onCancelled) onCancelled(incident.id);
    } catch (err) {
      console.error('Failed to cancel incident:', err);
      setErrorMsg(err.message || 'Failed to cancel alert');
    } finally {
      setActionLoading(false);
    }
  };

  if (!incident) return null;

  const typeConfig = INCIDENT_TYPES.find((t) => t.id === incident.type) || INCIDENT_TYPES[0];
  const isAccepted = incident.status === 'accepted';
  const isResolved = incident.status === 'resolved';

  const gmapsUrl = incident.lat && incident.lng
    ? `https://www.google.com/maps/dir/?api=1&destination=${incident.lat},${incident.lng}`
    : '#';

  return (
    <div className="w-full rounded-3xl bg-navy-900/90 border border-navy-700/80 shadow-2xl p-5 sm:p-6 text-slate-100 space-y-5 animate-in fade-in">
      {/* Header with Live Status & Timer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-navy-800">
        <div className="flex items-center space-x-3">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
              isAccepted
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                : 'bg-emergency-600/20 border border-emergency-500/40 text-emergency-400'
            }`}
          >
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg text-white">
                {isAccepted ? 'Responder Dispatched' : 'Broadcasting SOS...'}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                  isAccepted
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse'
                }`}
              >
                {incident.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{incident.location_label}</p>
          </div>
        </div>

        {/* Live Elapsed Stopwatch */}
        <div className="flex items-center space-x-2 self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-navy-950 border border-navy-800">
          <Clock className="w-4 h-4 text-emergency-400 animate-spin" style={{ animationDuration: '4s' }} />
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-medium uppercase block leading-none">
              Elapsed
            </span>
            <span className="font-mono font-bold text-sm text-slate-100">
              {formatTimer(elapsedSeconds)}
            </span>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-xs text-red-300">
          {errorMsg}
        </div>
      )}

      {/* Responder Card (if accepted) */}
      {isAccepted ? (
        <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 font-bold text-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="font-bold text-sm text-white">{incident.volunteer_name || 'Assigned Volunteer'}</p>
                <p className="text-xs text-emerald-300">{incident.volunteer_department || 'Safety Team'}</p>
              </div>
            </div>

            {incident.volunteer_phone && (
              <a
                href={`tel:${incident.volunteer_phone}`}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call</span>
              </a>
            )}
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-emerald-500/20 text-slate-300">
            <span className="flex items-center gap-1">
              <Navigation className="w-3.5 h-3.5 text-emerald-400" />
              <span>Approaching incident location</span>
            </span>
            <a
              href={gmapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <span>Directions</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      ) : (
        /* Waiting / Matching Responders Card */
        <div className="p-4 rounded-2xl bg-navy-950 border border-navy-800 text-center space-y-2">
          <div className="flex items-center justify-center space-x-2 text-xs text-amber-400 font-semibold">
            <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            <span>Alerting nearest available volunteers in KPRIET...</span>
          </div>
          <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
            Your emergency has been pushed to active volunteers with matching skills. Stand by for live responder acceptance.
          </p>
        </div>
      )}

      {/* Mini Tracking Map */}
      <div className="rounded-2xl overflow-hidden border border-navy-800">
        <CampusMap
          incidents={[incident]}
          centerCoords={{ lat: incident.lat || 11.0827, lng: incident.lng || 77.1420 }}
          height="180px"
          zoom={18}
          interactive={false}
        />
      </div>

      {/* Action Buttons: Mark Resolved & Cancel */}
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={handleResolve}
          disabled={actionLoading}
          className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-1.5 transition-all transform active:scale-98 disabled:opacity-50"
        >
          {actionLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle className="w-4 h-4" />
          )}
          <span>Mark Resolved</span>
        </button>

        <button
          onClick={handleCancel}
          disabled={actionLoading}
          className="py-3 px-4 rounded-xl bg-navy-950 hover:bg-navy-800 border border-navy-700 text-slate-300 hover:text-white font-semibold text-xs flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-50"
        >
          <XCircle className="w-4 h-4 text-rose-400" />
          <span>Cancel</span>
        </button>
      </div>
    </div>
  );
}
