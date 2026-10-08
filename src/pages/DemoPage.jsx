import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sliders,
  Zap,
  RotateCcw,
  Navigation,
  CheckCircle,
  Play,
  ArrowRight,
  Shield,
  Radio,
  User,
  ExternalLink,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DEMO_ACCOUNTS } from '../lib/constants';
import { rpcCreateIncident, rpcUpdateMyLocation } from '../lib/supabase';

export default function DemoPage() {
  const { user, quickSwitchDemo } = useAuth();
  const navigate = useNavigate();
  const [statusMsg, setStatusMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleQuickLogin = async (acc) => {
    await quickSwitchDemo(acc.email);
    if (acc.role === 'admin') navigate('/admin');
    else if (acc.role === 'volunteer') navigate('/volunteer');
    else navigate('/home');
  };

  const handleCreateTestIncident = async (type) => {
    setLoading(true);
    setStatusMsg(`Dispatching test ${type.toUpperCase()} emergency...`);
    try {
      await rpcCreateIncident({
        type,
        description: `Hackathon Test: Rapid ${type} incident reported at Central Library`,
        lat: 11.0834,
        lng: 77.1422,
        label: 'Central Library & Reading Hall',
      });
      setStatusMsg(`Dispatched! Now switch to Volunteer 1 account to accept the incoming siren.`);
    } catch (err) {
      console.error(err);
      setStatusMsg('Error creating incident: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateMovement = async () => {
    setLoading(true);
    setStatusMsg('Simulating Volunteer movement toward victim spot...');
    try {
      let step = 0;
      const startLat = 11.0845;
      const startLng = 77.1435;
      const targetLat = 11.0834;
      const targetLng = 77.1422;

      const interval = setInterval(async () => {
        step++;
        const currLat = startLat + (targetLat - startLat) * (step / 4);
        const currLng = startLng + (targetLng - startLng) * (step / 4);
        await rpcUpdateMyLocation(currLat, currLng);

        if (step >= 4) {
          clearInterval(interval);
          setLoading(false);
          setStatusMsg('Volunteer arrived on scene!');
        }
      }, 1000);
    } catch (err) {
      console.warn(err);
      setLoading(false);
    }
  };

  const handleResetData = () => {
    if (window.confirm('Reset all demo incidents and local state to fresh start?')) {
      localStorage.removeItem('pulse_mock_incidents');
      localStorage.removeItem('pulse_mock_alerts');
      window.location.reload();
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-in fade-in">
      {/* Page Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-navy-900 border border-amber-500/40 shadow-2xl space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold">
          <Sliders className="w-3.5 h-3.5" />
          <span>Hackathon Testing Console</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Demo Control Room & Quick Switcher</h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
          Simulate multi-user real-time interaction in one browser or across multiple tabs (Student, First Responder, Admin Proctor).
        </p>
      </div>

      {statusMsg && (
        <div className="p-4 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs font-bold flex items-center justify-between animate-in fade-in">
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg('')} className="text-amber-400 hover:text-white">✕</button>
        </div>
      )}

      {/* 1. Quick Login Accounts */}
      <div className="space-y-3">
        <h2 className="text-base font-extrabold text-white flex items-center gap-2">
          <User className="w-5 h-5 text-emergency-400" />
          <span>1. Instant Demo Account Switcher</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {DEMO_ACCOUNTS.map((acc) => {
            const isCurrent = user?.email === acc.email;
            return (
              <div
                key={acc.email}
                className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                  isCurrent
                    ? 'bg-navy-800 border-amber-500 ring-2 ring-amber-500/30 shadow-xl'
                    : 'bg-navy-900 border-navy-800 hover:border-navy-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-navy-950 text-slate-300 border border-navy-700">
                      {acc.badge}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] font-extrabold text-amber-400">ACTIVE</span>
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-white">{acc.label}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{acc.desc}</p>
                </div>

                <button
                  onClick={() => handleQuickLogin(acc)}
                  className={`mt-4 w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all ${
                    isCurrent
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-navy-950 hover:bg-navy-800 text-slate-200 border border-navy-700'
                  }`}
                >
                  <span>{isCurrent ? 'Current Session' : 'Login as ' + acc.badge}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Simulation Triggers */}
      <div className="p-6 rounded-3xl bg-navy-900 border border-navy-800 shadow-xl space-y-4">
        <h2 className="text-base font-extrabold text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <span>2. Real-Time Emergency Simulation Triggers</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => handleCreateTestIncident('medical')}
            disabled={loading}
            className="p-4 rounded-2xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-left transition-all group disabled:opacity-50"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-extrabold text-xs text-red-400 uppercase">Trigger Medical SOS</span>
              <Play className="w-3.5 h-3.5 text-red-400 group-hover:scale-125 transition-transform" />
            </div>
            <p className="text-[11px] text-slate-300">Broadcasts instant CPR alert to Priya Dharshini</p>
          </button>

          <button
            onClick={() => handleCreateTestIncident('accident')}
            disabled={loading}
            className="p-4 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-left transition-all group disabled:opacity-50"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-extrabold text-xs text-amber-400 uppercase">Trigger Accident Alert</span>
              <Play className="w-3.5 h-3.5 text-amber-400 group-hover:scale-125 transition-transform" />
            </div>
            <p className="text-[11px] text-slate-300">Broadcasts vehicle escort alert to Karthik Raja</p>
          </button>

          <button
            onClick={handleSimulateMovement}
            disabled={loading}
            className="p-4 rounded-2xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-left transition-all group disabled:opacity-50"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-extrabold text-xs text-blue-400 uppercase">Simulate GPS Movement</span>
              <Navigation className="w-3.5 h-3.5 text-blue-400 group-hover:scale-125 transition-transform" />
            </div>
            <p className="text-[11px] text-slate-300">Moves volunteer across campus towards incident spot</p>
          </button>
        </div>

        <div className="pt-2">
          <button
            onClick={handleResetData}
            className="py-2.5 px-4 rounded-xl bg-navy-950 hover:bg-navy-800 border border-navy-700 text-slate-400 hover:text-rose-400 font-semibold text-xs flex items-center space-x-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo State / Clear Test Incidents</span>
          </button>
        </div>
      </div>

      {/* 3. Recommended 2-Minute Demo Script */}
      <div className="p-6 rounded-3xl bg-navy-900 border border-navy-800 shadow-xl space-y-4">
        <h2 className="text-base font-extrabold text-white flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-purple-400" />
          <span>3. Recommended 2-Minute Evaluation Walkthrough</span>
        </h2>

        <div className="space-y-3 text-xs text-slate-300">
          <div className="p-3.5 rounded-2xl bg-navy-950 border border-navy-800 flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-emergency-600/30 text-emergency-400 font-bold flex items-center justify-center shrink-0">1</span>
            <div>
              <p className="font-bold text-white">Student Triggers Emergency</p>
              <p className="text-slate-400 mt-0.5">
                Log in as <strong>Student (Aravind)</strong>, press the giant SOS button, select Medical Emergency at Central Library, and confirm broadcast.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-navy-950 border border-navy-800 flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-emerald-600/30 text-emerald-400 font-bold flex items-center justify-center shrink-0">2</span>
            <div>
              <p className="font-bold text-white">Volunteer Receives Realtime Audio Siren & Accepts</p>
              <p className="text-slate-400 mt-0.5">
                Switch to <strong>Volunteer 1 (Priya)</strong> in second tab or demo switcher. Full-screen siren rings automatically. Tap <strong>Accept & Respond</strong>.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-navy-950 border border-navy-800 flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-amber-600/30 text-amber-400 font-bold flex items-center justify-center shrink-0">3</span>
            <div>
              <p className="font-bold text-white">Race Condition Safeguard</p>
              <p className="text-slate-400 mt-0.5">
                Switch to <strong>Volunteer 2 (Karthik)</strong>. Observe that attempting to accept returns "Already taken by someone else".
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-navy-950 border border-navy-800 flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-purple-600/30 text-purple-400 font-bold flex items-center justify-center shrink-0">4</span>
            <div>
              <p className="font-bold text-white">Admin Command Room & AI Post-Mortem</p>
              <p className="text-slate-400 mt-0.5">
                Switch to <strong>Admin</strong>. Observe live incident marker on map, switch to Risk Heatmap, and click <strong>Generate AI Summary</strong> to produce an instant post-mortem report.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
