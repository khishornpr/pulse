import React, { useState } from 'react';
import {
  Radio,
  ShieldCheck,
  CheckCircle2,
  Droplets,
  MapPin,
  ExternalLink,
  Phone,
  CheckCircle,
  Loader2,
  AlertCircle,
  Clock,
  Navigation,
  SlidersHorizontal,
  Volume2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGeolocation } from '../hooks/useGeolocation';
import { useMyAlerts } from '../hooks/useMyAlerts';
import IncomingAlertModal from '../components/IncomingAlertModal';
import CampusMap from '../components/CampusMap';
import { VOLUNTEER_SKILLS, BLOOD_GROUPS, INCIDENT_TYPES } from '../lib/constants';
import { rpcResolveIncident } from '../lib/supabase';
import { playSuccessChime } from '../lib/audio';

export default function VolunteerPage() {
  const { user, profile, isAvailable, toggleAvailability, updateProfile } = useAuth();
  // Automatically sync GPS location every 20s if available on grid
  const { coords, isGpsActive } = useGeolocation(isAvailable);
  const {
    alerts,
    incomingAlert,
    acceptedIncident,
    actionError,
    accepting,
    acceptAlert,
    declineAlert,
    dismissAlertModal,
    refreshAlerts,
  } = useMyAlerts();

  const [skills, setSkills] = useState(profile?.skills || ['first_aid', 'cpr']);
  const [bloodGroup, setBloodGroup] = useState(profile?.blood_group || 'O+');
  const [saveLoading, setSaveLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [resolving, setResolving] = useState(false);

  const toggleSkill = (skillId) => {
    setSkills((prev) =>
      prev.includes(skillId) ? prev.filter((s) => s !== skillId) : [...prev, skillId]
    );
  };

  const handleSaveProfile = async () => {
    setSaveLoading(true);
    setSavedSuccess(false);
    try {
      await updateProfile({
        skills,
        blood_group: bloodGroup,
        role: 'volunteer',
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.warn('Profile save failed:', err);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleResolveIncident = async (incidentId) => {
    setResolving(true);
    try {
      await rpcResolveIncident(incidentId);
      playSuccessChime();
      await refreshAlerts();
    } catch (err) {
      console.warn('Resolve error:', err);
    } finally {
      setResolving(false);
    }
  };

  const activeIncidentType = acceptedIncident
    ? INCIDENT_TYPES.find((t) => t.id === acceptedIncident.type) || INCIDENT_TYPES[0]
    : null;

  const gmapsUrl = acceptedIncident?.lat && acceptedIncident?.lng
    ? `https://www.google.com/maps/dir/?api=1&destination=${acceptedIncident.lat},${acceptedIncident.lng}`
    : '#';

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 animate-in fade-in">
      {/* 1. Header & Availability Toggle */}
      <div className="p-6 rounded-3xl bg-navy-900 border border-navy-800 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                First Responder Command
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Verified Volunteer
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {profile?.full_name} &bull; {profile?.department}
            </p>
          </div>
        </div>

        {/* Available On-Duty Toggle */}
        <div className="flex items-center space-x-3 self-stretch sm:self-auto p-3 rounded-2xl bg-navy-950 border border-navy-800">
          <div className="text-right">
            <span className="text-xs font-bold text-white block">
              {isAvailable ? 'On Campus Duty' : 'Off Duty'}
            </span>
            <span className="text-[10px] text-slate-400">
              {isAvailable ? '20s GPS Sync Active' : 'Standby Mode'}
            </span>
          </div>
          <button
            onClick={() => toggleAvailability(!isAvailable)}
            className={`w-14 h-8 rounded-full p-1 transition-colors duration-200 ease-in-out focus:outline-none ${
              isAvailable ? 'bg-emerald-500' : 'bg-navy-800 border border-slate-700'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                isAvailable ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 2. Active Accepted Incident View (If currently responding) */}
      {acceptedIncident && (
        <div className="p-6 rounded-3xl bg-emerald-950/40 border-2 border-emerald-500 shadow-2xl space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-500/30">
            <div className="flex items-center space-x-2 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
              <h2 className="font-extrabold text-base text-white">Active Emergency Assignment</h2>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider border border-emerald-500/40 animate-pulse">
              En Route
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Victim Details */}
            <div className="space-y-3 p-4 rounded-2xl bg-navy-950/80 border border-navy-800 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold">Incident Type:</span>
                <span className={`px-2 py-0.5 rounded font-bold uppercase ${activeIncidentType?.badgeClass}`}>
                  {activeIncidentType?.label}
                </span>
              </div>

              <div className="flex items-start justify-between">
                <span className="text-slate-400 font-semibold">Location:</span>
                <span className="font-bold text-white text-right max-w-[180px]">
                  {acceptedIncident.location_label}
                </span>
              </div>

              {acceptedIncident.description && (
                <div className="pt-1">
                  <span className="text-slate-400 font-semibold block mb-0.5">Victim Note:</span>
                  <p className="text-slate-200 italic">{acceptedIncident.description}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-navy-800">
                <div>
                  <p className="font-bold text-slate-100">{acceptedIncident.reporter_name || 'Campus Student'}</p>
                  <p className="text-[11px] text-slate-400">{acceptedIncident.reporter_department}</p>
                </div>
                {acceptedIncident.reporter_phone && (
                  <a
                    href={`tel:${acceptedIncident.reporter_phone}`}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Victim</span>
                  </a>
                )}
              </div>
            </div>

            {/* Navigation & Resolution Actions */}
            <div className="flex flex-col justify-between space-y-3">
              <a
                href={gmapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 transition-colors"
              >
                <Navigation className="w-4 h-4" />
                <span>Open in Google Maps Navigation</span>
                <ExternalLink className="w-3.5 h-3.5 ml-1" />
              </a>

              <button
                onClick={() => handleResolveIncident(acceptedIncident.id)}
                disabled={resolving}
                className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-xl shadow-emerald-600/40 flex items-center justify-center space-x-2 transition-all transform active:scale-98 disabled:opacity-50"
              >
                {resolving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle className="w-5 h-5" />
                )}
                <span>Mark Emergency Resolved</span>
              </button>
            </div>
          </div>

          {/* Incident Mini Map */}
          <div className="rounded-2xl overflow-hidden border border-navy-800">
            <CampusMap
              incidents={[acceptedIncident]}
              centerCoords={{ lat: acceptedIncident.lat, lng: acceptedIncident.lng }}
              height="200px"
              zoom={18}
            />
          </div>
        </div>
      )}

      {/* 3. Responder Profile & Skill Setup */}
      <div className="p-6 rounded-3xl bg-navy-900 border border-navy-800 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-slate-100">
            <SlidersHorizontal className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base text-white">Skills & Blood Registry</h3>
          </div>
          {savedSuccess && (
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>Preferences Updated</span>
            </span>
          )}
        </div>

        {/* Skills Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Certified Skills & Capabilities
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {VOLUNTEER_SKILLS.map((sk) => {
              const isSelected = skills.includes(sk.id);
              return (
                <button
                  key={sk.id}
                  type="button"
                  onClick={() => toggleSkill(sk.id)}
                  className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-emerald-600/15 border-emerald-500 text-white'
                      : 'bg-navy-950 border-navy-800 text-slate-400 hover:bg-navy-800'
                  }`}
                >
                  <div>
                    <p className="font-bold text-xs">{sk.label}</p>
                    <p className="text-[10px] text-slate-400">{sk.description}</p>
                  </div>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Blood Group */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
            My Blood Group
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {BLOOD_GROUPS.map((bg) => (
              <button
                key={bg}
                type="button"
                onClick={() => setBloodGroup(bg)}
                className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                  bloodGroup === bg
                    ? 'bg-rose-600 border-rose-400 text-white shadow-md'
                    : 'bg-navy-950 border-navy-700 text-slate-300 hover:bg-navy-800'
                }`}
              >
                {bg}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={saveLoading}
          className="py-3 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
        >
          {saveLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>Save Capabilities</span>
        </button>
      </div>

      {/* 4. Alert History List */}
      <div className="p-6 rounded-3xl bg-navy-900 border border-navy-800 shadow-xl space-y-4">
        <h3 className="font-bold text-sm text-white">Dispatched Alerts History</h3>
        {alerts.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">No recent emergency alerts.</p>
        ) : (
          <div className="space-y-2">
            {alerts.map((alt) => {
              const inc = alt.incident;
              const typeConfig = INCIDENT_TYPES.find((t) => t.id === inc?.type) || INCIDENT_TYPES[0];
              return (
                <div
                  key={alt.id}
                  className="p-3.5 rounded-2xl bg-navy-950 border border-navy-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${typeConfig.badgeClass}`}>
                      {typeConfig.shortLabel}
                    </span>
                    <div>
                      <p className="font-bold text-white">{inc?.location_label || 'Campus Spot'}</p>
                      <p className="text-[10px] text-slate-400">
                        {alt.distance_m ? `${Math.round(alt.distance_m)}m away` : 'Campus'} &bull; Status: {alt.status}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(alt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Full-Screen Urgent Modal Popup */}
      <IncomingAlertModal
        alert={incomingAlert}
        onAccept={acceptAlert}
        onDecline={declineAlert}
        accepting={accepting}
        errorMsg={actionError}
        onDismiss={dismissAlertModal}
      />
    </div>
  );
}
