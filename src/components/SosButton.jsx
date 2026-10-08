import React from 'react';
import { Activity, Radio, AlertOctagon } from 'lucide-react';

export default function SosButton({ onClick, disabled = false, isEmergencyActive = false }) {
  return (
    <div className="relative flex flex-col items-center justify-center my-6 py-4">
      {/* Outer Ripple Rings */}
      <div className="relative flex items-center justify-center">
        {!disabled && (
          <>
            <div className="absolute w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-emergency-600/20 animate-ping opacity-60 pointer-events-none" />
            <div className="absolute w-44 h-44 sm:w-52 sm:h-52 rounded-full bg-emergency-500/30 animate-pulse opacity-80 pointer-events-none" />
            <div className="absolute w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-emergency-600/40 blur-xl pointer-events-none" />
          </>
        )}

        {/* Giant Main SOS Button */}
        <button
          onClick={onClick}
          disabled={disabled}
          aria-label="Trigger Campus Emergency SOS"
          className={`relative z-10 w-36 h-36 sm:w-44 sm:h-44 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all duration-300 transform active:scale-95 focus:outline-none select-none ${
            isEmergencyActive
              ? 'bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 text-navy-950 ring-8 ring-amber-500/30'
              : 'bg-gradient-to-tr from-emergency-700 via-emergency-600 to-rose-500 text-white animate-sos-pulse hover:brightness-110 active:brightness-90 ring-8 ring-emergency-600/40'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {/* Inner Highlight Ring */}
          <div className="absolute inset-1 rounded-full border border-white/30 pointer-events-none"></div>

          {isEmergencyActive ? (
            <>
              <AlertOctagon className="w-10 h-10 sm:w-12 sm:h-12 text-navy-950 mb-1 animate-bounce" />
              <span className="font-black text-xl sm:text-2xl tracking-wider text-navy-950">
                ACTIVE
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-navy-900 uppercase tracking-wide">
                Tracking Aid
              </span>
            </>
          ) : (
            <>
              <Activity className="w-8 h-8 sm:w-10 sm:h-10 text-white mb-0.5 animate-pulse" />
              <span className="font-black text-3xl sm:text-4xl tracking-widest drop-shadow-md">
                SOS
              </span>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/90">
                Emergency
              </span>
            </>
          )}
        </button>
      </div>

      <div className="mt-6 text-center max-w-xs">
        <p className="text-xs font-semibold text-slate-300 flex items-center justify-center gap-1.5">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>Campus First-Responders On Standby</span>
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Tap to broadcast instant GPS triage to nearest KPRIET volunteers
        </p>
      </div>
    </div>
  );
}
