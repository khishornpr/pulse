import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  Shield,
  Radio,
  UserCheck,
  LogOut,
  Sliders,
  ChevronDown,
  Sparkles,
  MapPin,
  AlertTriangle,
  Menu,
  X,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DEMO_ACCOUNTS } from '../lib/constants';

export default function Navbar({ connectionStatus = 'connected' }) {
  const { user, profile, role, signOut, quickSwitchDemo, isConfigured } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getRoleBadge = () => {
    switch (role) {
      case 'admin':
        return { label: 'Admin Command', bg: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
      case 'volunteer':
        return { label: 'First Responder', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      default:
        return { label: 'Student / Staff', bg: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
    }
  };

  const roleInfo = getRoleBadge();

  return (
    <nav className="sticky top-0 z-50 bg-navy-950/90 backdrop-blur-md border-b border-navy-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <Link to={user ? "/home" : "/"} className="flex items-center space-x-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emergency-600 via-emergency-500 to-rose-400 flex items-center justify-center shadow-lg shadow-emergency-600/30 group-hover:scale-105 transition-transform duration-200">
                <Activity className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-extrabold text-lg tracking-tight text-white">PULSE</span>
                  <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-emergency-600/30 text-emergency-400 border border-emergency-500/40">
                    KPRIET
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium tracking-wide">Campus Emergency Grid</p>
              </div>
            </Link>

            {/* Live Connection Pill */}
            <div className="hidden sm:flex items-center space-x-2 px-2.5 py-1 rounded-full bg-navy-900 border border-navy-700 text-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected'
                    ? 'bg-emerald-500 animate-pulse'
                    : connectionStatus === 'reconnecting'
                    ? 'bg-amber-400 animate-ping'
                    : 'bg-rose-500'
                }`}
              />
              <span className="text-slate-300 font-medium">
                {connectionStatus === 'connected' ? 'Live Grid' : connectionStatus === 'reconnecting' ? 'Syncing' : 'Offline'}
              </span>
            </div>
          </div>

          {/* Center Links (Logged In) */}
          {user && (
            <div className="hidden md:flex items-center space-x-1">
              <Link
                to="/home"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === '/home'
                    ? 'bg-navy-800 text-white border border-navy-700'
                    : 'text-slate-300 hover:text-white hover:bg-navy-900'
                }`}
              >
                SOS Dashboard
              </Link>
              <Link
                to="/volunteer"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                  location.pathname === '/volunteer'
                    ? 'bg-navy-800 text-white border border-navy-700'
                    : 'text-slate-300 hover:text-white hover:bg-navy-900'
                }`}
              >
                <Radio className="w-4 h-4 text-emerald-400" />
                <span>Responder Panel</span>
              </Link>
              {role === 'admin' && (
                <Link
                  to="/admin"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                    location.pathname === '/admin'
                      ? 'bg-navy-800 text-white border border-navy-700'
                      : 'text-slate-300 hover:text-white hover:bg-navy-900'
                  }`}
                >
                  <Shield className="w-4 h-4 text-purple-400" />
                  <span>Admin Command</span>
                </Link>
              )}
              <Link
                to="/demo"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                  location.pathname === '/demo'
                    ? 'bg-navy-800 text-amber-300 border border-amber-500/30'
                    : 'text-amber-400/90 hover:text-amber-300 hover:bg-navy-900'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>Demo Controls</span>
              </Link>
            </div>
          )}

          {/* Right Profile / Quick Switcher */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-navy-900 hover:bg-navy-800 border border-navy-700 transition-colors focus:outline-none"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-navy-700 to-navy-600 border border-slate-600 flex items-center justify-center font-bold text-xs text-white">
                    {profile?.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-semibold text-slate-200 leading-tight max-w-[120px] truncate">
                      {profile?.full_name || user.email}
                    </p>
                    <span className={`inline-block text-[10px] font-medium px-1.5 py-0.2 rounded border ${roleInfo.bg}`}>
                      {roleInfo.label}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-64 rounded-2xl bg-navy-900 border border-navy-700 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2"
                    onMouseLeave={() => setDropdownOpen(false)}
                  >
                    <div className="px-3 py-2 border-b border-navy-800">
                      <p className="text-xs font-semibold text-white">{profile?.full_name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                      <p className="text-[11px] text-slate-400">{profile?.department}</p>
                    </div>

                    <div className="py-2">
                      <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Quick Demo Switcher
                      </p>
                      {DEMO_ACCOUNTS.map((acc) => (
                        <button
                          key={acc.email}
                          onClick={async () => {
                            setDropdownOpen(false);
                            await quickSwitchDemo(acc.email);
                            if (acc.role === 'admin') navigate('/admin');
                            else if (acc.role === 'volunteer') navigate('/volunteer');
                            else navigate('/home');
                          }}
                          className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                            user.email === acc.email
                              ? 'bg-navy-800 text-white font-semibold'
                              : 'text-slate-300 hover:bg-navy-800/60'
                          }`}
                        >
                          <span className="truncate">{acc.label}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-navy-950 text-slate-300 border border-navy-700">
                            {acc.badge}
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-navy-800">
                      <button
                        onClick={async () => {
                          setDropdownOpen(false);
                          await signOut();
                          navigate('/');
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 flex items-center space-x-2 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-navy-800 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/login"
                  onClick={(e) => {
                    e.preventDefault();
                    quickSwitchDemo('student');
                    navigate('/home');
                  }}
                  className="px-3.5 py-1.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-emergency-600 to-emergency-500 hover:from-emergency-500 hover:to-emergency-400 text-white shadow-lg shadow-emergency-600/30 transition-all transform active:scale-95"
                >
                  Try Demo
                </Link>
              </div>
            )}

            {/* Mobile Hamburger */}
            <div className="flex md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 focus:outline-none"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-2 pb-4 space-y-1 bg-navy-900 border-b border-navy-800">
          <Link
            to="/home"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-navy-800"
          >
            SOS Dashboard
          </Link>
          <Link
            to="/volunteer"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-navy-800"
          >
            Responder Panel
          </Link>
          {role === 'admin' && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-navy-800"
            >
              Admin Command Center
            </Link>
          )}
          <Link
            to="/demo"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-amber-400 hover:bg-navy-800"
          >
            Demo Control Center
          </Link>
        </div>
      )}
    </nav>
  );
}
