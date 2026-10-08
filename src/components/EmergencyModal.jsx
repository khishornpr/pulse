import React, { useState, useEffect } from 'react';
import {
  X,
  HeartPulse,
  AlertCircle,
  Flame,
  ShieldAlert,
  Droplets,
  AlertTriangle,
  MapPin,
  Navigation,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  Loader2,
  Radio
} from 'lucide-react';
import { INCIDENT_TYPES, CAMPUS_BLOCKS, BLOOD_GROUPS, KPRIET_CAMPUS } from '../lib/constants';
import CampusMap from './CampusMap';
import { rpcCreateIncident } from '../lib/supabase';
import { playDispatchSound } from '../lib/audio';

export default function EmergencyModal({
  isOpen,
  onClose,
  userCoords,
  onIncidentCreated,
}) {
  const [step, setStep] = useState(1); // 1: Details & Location, 2: Confirmation
  const [selectedType, setSelectedType] = useState('medical');
  const [description, setDescription] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [selectedBlockId, setSelectedBlockId] = useState('main_admin');
  const [coords, setCoords] = useState(userCoords || KPRIET_CAMPUS.center);
  const [locationLabel, setLocationLabel] = useState('Main Admin Block & Reception');
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (userCoords) {
      setCoords(userCoords);
    }
  }, [userCoords]);

  // When block dropdown changes, update coords and label
  const handleBlockChange = (blockId) => {
    setSelectedBlockId(blockId);
    const block = CAMPUS_BLOCKS.find((b) => b.id === blockId);
    if (block) {
      setCoords({ lat: block.lat, lng: block.lng });
      setLocationLabel(block.name);
    }
  };

  // When GPS button is pressed, revert to GPS coords
  const handleUseGps = () => {
    if (userCoords) {
      setCoords(userCoords);
      setLocationLabel('Current GPS Location (KPRIET)');
      setSelectedBlockId('custom');
    }
  };

  // When map pin is dragged
  const handleCoordsChange = (newCoords) => {
    setCoords(newCoords);
    setLocationLabel(`Custom Spot (${newCoords.lat.toFixed(4)}, ${newCoords.lng.toFixed(4)})`);
    setSelectedBlockId('custom');
  };

  const handleProceedToConfirm = (e) => {
    e.preventDefault();
    setStep(2);
  };

  const handleBroadcastEmergency = async () => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      playDispatchSound();
      const { data, error } = await rpcCreateIncident({
        type: selectedType,
        description,
        lat: coords.lat,
        lng: coords.lng,
        label: locationLabel,
        bloodGroup: selectedType === 'blood_needed' ? bloodGroup : null,
      });

      if (error) throw error;

      if (onIncidentCreated) {
        onIncidentCreated(data);
      }
      onClose();
    } catch (err) {
      console.error('Failed to broadcast emergency:', err);
      setErrorMsg(err.message || 'Failed to dispatch alert. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentTypeObj = INCIDENT_TYPES.find((t) => t.id === selectedType) || INCIDENT_TYPES[0];

  const renderIcon = (typeId) => {
    switch (typeId) {
      case 'medical':
        return <HeartPulse className="w-5 h-5 text-red-400" />;
      case 'accident':
        return <AlertCircle className="w-5 h-5 text-amber-400" />;
      case 'fire':
        return <Flame className="w-5 h-5 text-orange-400" />;
      case 'safety':
        return <ShieldAlert className="w-5 h-5 text-purple-400" />;
      case 'blood_needed':
        return <Droplets className="w-5 h-5 text-rose-400" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-navy-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full sm:max-w-xl max-h-[92vh] flex flex-col bg-navy-900 border border-navy-700/80 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-navy-800 bg-navy-950/60">
          <div className="flex items-center space-x-2.5">
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="p-1.5 -ml-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="w-8 h-8 rounded-xl bg-emergency-600/20 border border-emergency-500/30 flex items-center justify-center">
              <Radio className="w-4 h-4 text-emergency-400 animate-pulse" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">
                {step === 1 ? 'Report Campus Emergency' : 'Confirm Emergency Broadcast'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {step === 1 ? 'Step 1 of 2: Emergency Details' : 'Step 2 of 2: Final Verification'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-navy-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleProceedToConfirm} className="space-y-5">
              {/* 1. Incident Type Cards */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Emergency Category <span className="text-emergency-400">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {INCIDENT_TYPES.map((t) => {
                    const isSelected = selectedType === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedType(t.id)}
                        className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-navy-800 border-emergency-500 ring-2 ring-emergency-500/30 shadow-lg'
                            : 'bg-navy-950/60 border-navy-800 hover:border-navy-700 hover:bg-navy-800/40 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          {renderIcon(t.id)}
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-emergency-400" />}
                        </div>
                        <div>
                          <p className="font-semibold text-xs text-white leading-tight">{t.label}</p>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">{t.shortLabel}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Blood Group Selector (Conditional) */}
              {selectedType === 'blood_needed' && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2 animate-in fade-in">
                  <label className="block text-xs font-bold text-rose-300 uppercase tracking-wider">
                    Required Blood Group
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {BLOOD_GROUPS.map((bg) => (
                      <button
                        key={bg}
                        type="button"
                        onClick={() => setBloodGroup(bg)}
                        className={`py-2 rounded-lg font-bold text-xs transition-colors border ${
                          bloodGroup === bg
                            ? 'bg-rose-600 border-rose-400 text-white shadow-md'
                            : 'bg-navy-900 border-navy-700 text-slate-300 hover:bg-navy-800'
                        }`}
                      >
                        {bg}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Location Selection */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Incident Location <span className="text-emergency-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleUseGps}
                    className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Use Auto-GPS</span>
                  </button>
                </div>

                {/* Campus Block Dropdown */}
                <select
                  value={selectedBlockId}
                  onChange={(e) => handleBlockChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-navy-950 border border-navy-700 text-sm text-slate-100 font-medium focus:outline-none focus:border-emergency-500"
                >
                  <option value="custom">📍 Selected Pin on Map / GPS</option>
                  {CAMPUS_BLOCKS.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>

                {/* Interactive Mini Map Pin Picker */}
                <div className="rounded-xl overflow-hidden border border-navy-800">
                  <div className="flex items-center justify-between px-3 py-2 bg-navy-950/80 text-xs border-b border-navy-800">
                    <span className="text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emergency-400" />
                      <span>{locationLabel}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsMapExpanded(!isMapExpanded)}
                      className="text-emergency-400 font-semibold text-[11px]"
                    >
                      {isMapExpanded ? 'Collapse Map' : 'Adjust Pin on Map'}
                    </button>
                  </div>
                  {isMapExpanded && (
                    <div className="p-1">
                      <CampusMap
                        selectedCoords={coords}
                        onCoordsChange={handleCoordsChange}
                        isDraggable={true}
                        height="200px"
                        zoom={17}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Optional Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Situation Details <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Student collapsed near Lab 4, breathing heavily..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-navy-950 border border-navy-700 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emergency-500 resize-none"
                />
              </div>

              {/* Next Step Button */}
              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emergency-600 to-emergency-500 hover:from-emergency-500 hover:to-emergency-400 text-white font-bold text-sm shadow-xl shadow-emergency-600/30 flex items-center justify-center space-x-2 transition-transform transform active:scale-98"
              >
                <span>Review & Confirm Broadcast</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* Step 2: Verification Safeguard */
            <div className="space-y-5 animate-in fade-in">
              <div className="p-4 rounded-2xl bg-navy-950 border border-emergency-500/30 text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-emergency-600/20 border border-emergency-500/40 flex items-center justify-center text-emergency-400">
                  {renderIcon(selectedType)}
                </div>
                <h3 className="font-bold text-lg text-white">Broadcast Emergency Alert?</h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                  This will dispatch an urgent alarm to all certified first responders within 1.5 km of KPRIET campus.
                </p>
              </div>

              {/* Summary details */}
              <div className="p-4 rounded-xl bg-navy-950/60 border border-navy-800 space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-navy-800">
                  <span className="text-slate-400">Emergency Type:</span>
                  <span className="font-bold text-white">{currentTypeObj.label}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-navy-800">
                  <span className="text-slate-400">Location:</span>
                  <span className="font-bold text-white text-right max-w-[200px] truncate">
                    {locationLabel}
                  </span>
                </div>
                {selectedType === 'blood_needed' && (
                  <div className="flex justify-between py-1 border-b border-navy-800">
                    <span className="text-slate-400">Blood Requested:</span>
                    <span className="font-bold text-rose-400">{bloodGroup}</span>
                  </div>
                )}
                {description && (
                  <div className="pt-1">
                    <span className="text-slate-400 block mb-0.5">Notes:</span>
                    <p className="text-slate-200 italic">{description}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleBroadcastEmergency}
                  disabled={submitting}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emergency-600 via-emergency-500 to-rose-600 hover:brightness-110 text-white font-extrabold text-base tracking-wide shadow-2xl shadow-emergency-600/50 flex items-center justify-center space-x-2 transition-all transform active:scale-98 disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Dispatching to Volunteers...</span>
                    </>
                  ) : (
                    <>
                      <Radio className="w-5 h-5 animate-pulse" />
                      <span>DISPATCH EMERGENCY ALERT</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={submitting}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-navy-800"
                >
                  Edit Information
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
