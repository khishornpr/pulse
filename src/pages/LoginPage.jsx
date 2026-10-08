import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Mail, Lock, Loader2, AlertCircle, ArrowRight, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DEMO_ACCOUNTS } from '../lib/constants';

export default function LoginPage() {
  const { signIn, quickSwitchDemo } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const { data, error } = await signIn({ email, password });
      if (error) throw error;
      navigate('/home');
    } catch (err) {
      setErrorMsg(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (acc) => {
    await quickSwitchDemo(acc.email);
    if (acc.role === 'admin') navigate('/admin');
    else if (acc.role === 'volunteer') navigate('/volunteer');
    else navigate('/home');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Banner */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emergency-600 to-rose-500 mx-auto flex items-center justify-center shadow-lg shadow-emergency-600/30">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Sign in to Pulse</h2>
          <p className="text-xs text-slate-400">KPRIET Campus Emergency Response System</p>
        </div>

        {/* Form Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-navy-900 border border-navy-800 shadow-2xl space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                College Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@kpriet.ac.in or student@pulse.demo"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-navy-950 border border-navy-700 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emergency-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-navy-950 border border-navy-700 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emergency-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emergency-600 to-rose-600 hover:from-emergency-500 hover:to-rose-500 text-white font-bold text-sm shadow-xl shadow-emergency-600/30 flex items-center justify-center space-x-2 transition-all transform active:scale-98 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="pt-3 border-t border-navy-800 space-y-2">
            <p className="text-[10px] uppercase font-bold text-slate-400 text-center flex items-center justify-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>1-Click Hackathon Demo Sign-In</span>
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleDemoLogin(acc)}
                  className="p-2.5 rounded-xl bg-navy-950 hover:bg-navy-800 border border-navy-700 text-left transition-colors"
                >
                  <p className="font-bold text-xs text-slate-100 truncate">{acc.label}</p>
                  <p className="text-[9px] text-emergency-400">{acc.badge}</p>
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-xs text-slate-400">
            Don't have an account?{' '}
            <Link to="/signup" className="text-emergency-400 font-bold hover:underline">
              Create Volunteer / Student Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
