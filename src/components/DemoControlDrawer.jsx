import React, { useState } from 'react';
import {
  Sliders,
  Users,
  Radio,
  RotateCcw,
  Zap,
  CheckCircle,
  Navigation,
  Loader2,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DEMO_ACCOUNTS } from '../lib/constants';
import { rpcUpdateMyLocation, rpcCreateIncident } from '../lib/supabase';

export default function DemoControlDrawer({ onTriggerSimulation = null }) {
  const { user, quickSwitchDemo } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [statusText, setStatusText] = useState('');

  // 1. Simulate Volunteer Movement towards Active Emergency
  const handleSimulateMovement = async () => {
    setLoadingAction(true);
    setStatusText('Simulating Volunteer Movement towards target spot...');
    try {
      const storedIncidents = JSON.parse(localStorage.getItem('pulse_mock_incidents') || '[]');
      const activeInc = storedIncidents.find((i) => i.status === 'open' || i.status === 'accepted');

      const targetLat = activeInc?.lat || 11.0827;
      const targetLng = activeInc?.lng || 77.1420;

      // Move volunteer closer in 3 steps
      let step = 0;
      const startLat = 11.0842;
      const startLng = 11.1435;

      const interval = setInterval(async () => {
        step++;
        const currLat = startLat + (targetLat - startLat) * (step / 3);
        const currLng = startLng + (targetLng - startLng) * (step / 3);
        await rpcUpdateMyLocation(currLat, currLng);

        if (step >= 3) {
          clearInterval(interval);
          setLoadingAction(false);
          setStatusText('Volunteer reached emergency spot!');
          setTimeout(() => setStatusText(''), 4000);
        }
      }, 1000);
    } catch (err) {
      console.warn('Simulation error:', err);
      setLoadingAction(false);
    }
  };

  // 2. Reset All Incidents
  const handleResetIncidents = () => {
    localStorage.removeItem('pulse_mock_incidents');
    localStorage.removeItem('pulse_mock_alerts');
    window.location.reload();
  };

  // 3. Instant Medical SOS Trigger
  const handleTriggerQuickSos = async () => {
    setLoadingAction(true);
    setStatusText('Dispatching rapid Medical SOS...');
    try {
      await rpcCreateIncident({
        type: 'medical',
        description: 'Simulated Demo SOS: Asthmatic attack near Central Library',
        lat: 11.0834,
        lng: 77.1422,
        label: 'Central Library & Reading Hall',
      });
      setStatusText('Dispatched! Switch to Volunteer account to test acceptance.');
      setTimeout(() => setStatusText(''), 5000);
    } catch (err) {
      console.warn('Quick SOS error:', err);
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm w-full sm:w-auto">
      <div className="rounded-2xl bg-navy-900/95 border border-amber-500/40 shadow-2xl backdrop-blur-md overflow-hidden text-slate-100 transition-all">
        {/* Toggle Bar */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-2.5 flex items-center justify-between bg-gradient-to-r from-amber-600/20 via-navy-900 to-navy-900 border-b border-navy-800 text-xs font-bold text-amber-300 hover:text-amber-200"
        >
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>Hackathon Demo Control Center</span>
          </div>
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>

        {isOpen && (
          <div className="p-4 space-y-4 text-xs animate-in slide-in-from-bottom-2">
            {/* Quick Switch Buttons */}
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">
                1-Click Account Switcher
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {DEMO_ACCOUNTS.map((acc) => {
                  const isCurrent = user?.email === acc.email;
                  return (
                    <button
                      key={acc.email}
                      onClick={() => quickSwitchDemo(acc.email)}
                      className={`p-2 rounded-xl border text-left flex flex-col justify-between transition-all ${
                        isCurrent
                          ? 'bg-amber-500/20 border-amber-500 text-white font-bold ring-1 ring-amber-500'
                          : 'bg-navy-950 border-navy-800 hover:border-navy-700 text-slate-300'
                      }`}
                    >
                      <span className="font-semibold text-[11px] truncate">{acc.label}</span>
                      <span className="text-[9px] text-slate-400">{acc.badge}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Triggers */}
            <div className="space-y-2 pt-2 border-t border-navy-800">
              <p className="text-[10px] uppercase font-bold text-slate-400">
                Simulation Actions
              </p>

              <button
                onClick={handleTriggerQuickSos}
                disabled={loadingAction}
                className="w-full py-2 px-3 rounded-xl bg-emergency-600/30 hover:bg-emergency-600/50 border border-emergency-500/40 text-emergency-300 font-bold flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Trigger Instant Test Medical SOS</span>
              </button>

              <button
                onClick={handleSimulateMovement}
                disabled={loadingAction}
                className="w-full py-2 px-3 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 text-blue-300 font-bold flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-50"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Simulate Volunteer Approaching</span>
              </button>

              <button
                onClick={handleResetIncidents}
                className="w-full py-2 px-3 rounded-xl bg-navy-950 hover:bg-navy-800 border border-navy-800 text-slate-400 hover:text-slate-200 font-medium flex items-center justify-center space-x-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Demo Incidents</span>
              </button>
            </div>

            {statusText && (
              <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-200 text-[10px] font-medium animate-in fade-in">
                {statusText}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
