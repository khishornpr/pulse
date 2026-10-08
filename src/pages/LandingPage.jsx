import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  Shield,
  Radio,
  Zap,
  HeartPulse,
  Users,
  MapPin,
  Clock,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CampusMap from '../components/CampusMap';
import { DEMO_ACCOUNTS } from '../lib/constants';

export default function LandingPage() {
  const { user, quickSwitchDemo } = useAuth();
  const navigate = useNavigate();

  const handleQuickStart = async (role) => {
    await quickSwitchDemo(role);
    if (role === 'admin') navigate('/admin');
    else if (role === 'volunteer') navigate('/volunteer');
    else navigate('/home');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-5 max-w-3xl mx-auto pt-4">
        {/* Pill Tag */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emergency-600/15 border border-emergency-500/30 text-xs font-bold text-emergency-400 animate-pulse">
          <Activity className="w-4 h-4 text-emergency-400" />
          <span>KPRIET Campus Rapid Emergency Grid</span>
        </div>

        {/* 3-Line Idea Summary */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
          When seconds matter, <br />
          <span className="bg-gradient-to-r from-emergency-500 via-rose-400 to-amber-400 bg-clip-text text-transparent">
            the campus responds as one.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-300 font-medium leading-relaxed">
          Pulse connects anyone in distress directly to nearest CPR-certified students, vehicle owners, blood donors, and security staff with sub-minute GPS triage.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {user ? (
            <Link
              to="/home"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emergency-600 to-rose-600 hover:from-emergency-500 hover:to-rose-500 text-white font-extrabold text-base shadow-2xl shadow-emergency-600/40 flex items-center justify-center space-x-2 transition-all transform active:scale-95"
            >
              <span>Go to Emergency Dashboard</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          ) : (
            <>
              <button
                onClick={() => handleQuickStart('student')}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emergency-600 via-emergency-500 to-rose-600 hover:brightness-110 text-white font-black text-base shadow-2xl shadow-emergency-600/40 flex items-center justify-center space-x-2 transition-all transform active:scale-95 cursor-pointer"
              >
                <Zap className="w-5 h-5" />
                <span>Try Live Demo (Instant)</span>
              </button>

              <Link
                to="/login"
                className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-navy-900 hover:bg-navy-800 border border-navy-700 text-slate-200 font-bold text-sm flex items-center justify-center space-x-2 transition-colors"
              >
                <span>Login with Email</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* 3 Core Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-navy-900/80 border border-navy-800 shadow-xl space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
            <HeartPulse className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg text-white">1-Tap Emergency SOS</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Victims press a single button. Automatic GPS coordinates and campus block presets find volunteers within 1,500m instantly.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-navy-900/80 border border-navy-800 shadow-xl space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Radio className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg text-white">Smart Skill Matching</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Medical alerts route to CPR-certified peers; accidents route to vehicle drivers; blood requests alert matching blood-type donors.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-navy-900/80 border border-navy-800 shadow-xl space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg text-white">Live Admin Control</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Proctors monitor incidents in real-time, inspect risk heatmaps, view response latencies, and generate Claude AI post-mortems.
          </p>
        </div>
      </div>

      {/* Interactive Demo Account Taster */}
      <div className="p-6 sm:p-8 rounded-3xl bg-navy-900 border border-navy-800 shadow-2xl space-y-5">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold text-white">Test 3-Way Realtime Flow</h2>
          <p className="text-xs text-slate-400">
            Open multiple browser tabs or use the 1-click accounts below to test Student, Responder, and Admin synchronization.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {DEMO_ACCOUNTS.filter(a => a.role !== 'volunteer' || a.email.includes('1')).map((acc) => (
            <button
              key={acc.email}
              onClick={() => handleQuickStart(acc.role)}
              className="p-5 rounded-2xl bg-navy-950 border border-navy-800 hover:border-emergency-500/50 hover:bg-navy-850 text-left transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-navy-800 text-slate-300 border border-navy-700">
                    {acc.badge}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emergency-400 group-hover:translate-x-1 transition-all" />
                </div>
                <h4 className="font-bold text-sm text-white group-hover:text-emergency-300 transition-colors">
                  {acc.label}
                </h4>
                <p className="text-xs text-slate-400 mt-1">{acc.desc}</p>
              </div>
              <span className="text-[11px] text-emergency-400 font-semibold mt-3">
                Click to Enter &rarr;
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
