import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  User,
  Mail,
  Lock,
  Phone,
  Building,
  Droplets,
  Radio,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BLOOD_GROUPS, VOLUNTEER_SKILLS } from '../lib/constants';

export default function SignupPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engg');
  const [phone, setPhone] = useState('+91 ');
  const [role, setRole] = useState('student');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const toggleSkill = (skillId) => {
    setSkills((prev) =>
      prev.includes(skillId) ? prev.filter((s) => s !== skillId) : [...prev, skillId]
    );
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const { data, error } = await signUp({
        email,
        password,
        fullName,
        department,
        phone,
        role,
        bloodGroup,
        skills,
      });

      if (error) throw error;

      if (role === 'volunteer') {
        navigate('/volunteer');
      } else {
        navigate('/home');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emergency-600 to-rose-500 mx-auto flex items-center justify-center shadow-lg shadow-emergency-600/30">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Join Pulse KPRIET</h2>
          <p className="text-xs text-slate-400">Campus Emergency & First Responder Network</p>
        </div>

        <div className="p-6 sm:p-8 rounded-3xl bg-navy-900 border border-navy-800 shadow-2xl space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            {/* Role Select Buttons */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                I am registering as:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`p-3 rounded-2xl border text-left flex items-center space-x-3 transition-all ${
                    role === 'student'
                      ? 'bg-navy-800 border-emergency-500 ring-2 ring-emergency-500/30 text-white'
                      : 'bg-navy-950 border-navy-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <User className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="font-bold text-xs text-white">Student / Staff</p>
                    <p className="text-[10px] text-slate-400">Can trigger SOS alerts</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('volunteer')}
                  className={`p-3 rounded-2xl border text-left flex items-center space-x-3 transition-all ${
                    role === 'volunteer'
                      ? 'bg-navy-800 border-emerald-500 ring-2 ring-emerald-500/30 text-white'
                      : 'bg-navy-950 border-navy-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Radio className="w-5 h-5 text-emerald-400" />
                  <div>
                    <p className="font-bold text-xs text-white">First Responder</p>
                    <p className="text-[10px] text-emerald-400">Receives emergency alerts</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Aravind Swaminathan"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-navy-950 border border-navy-700 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emergency-500"
              />
            </div>

            {/* Email (College preferred notice) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Email Address
                </label>
                <span className="text-[10px] text-emergency-400 font-semibold">
                  * KPRIET email preferred
                </span>
              </div>
              <input
                type="email"
                required
                placeholder="username@kpriet.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-navy-950 border border-navy-700 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emergency-500"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-navy-950 border border-navy-700 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emergency-500"
              />
            </div>

            {/* Department & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CSE (III Year)"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-navy-950 border border-navy-700 text-xs text-slate-100 placeholder-slate-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Phone (Emergency Contact)
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98421..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-navy-950 border border-navy-700 text-xs text-slate-100 placeholder-slate-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Blood Group */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Blood Group
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                {BLOOD_GROUPS.map((bg) => (
                  <button
                    key={bg}
                    type="button"
                    onClick={() => setBloodGroup(bg)}
                    className={`py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                      bloodGroup === bg
                        ? 'bg-rose-600 border-rose-400 text-white shadow-sm'
                        : 'bg-navy-950 border-navy-700 text-slate-300 hover:bg-navy-800'
                    }`}
                  >
                    {bg}
                  </button>
                ))}
              </div>
            </div>

            {/* Volunteer Skills Checkboxes (if role === volunteer) */}
            {role === 'volunteer' && (
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2.5 animate-in fade-in">
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-300">
                  Select Certified Skills
                </label>
                <div className="space-y-1.5">
                  {VOLUNTEER_SKILLS.map((sk) => {
                    const isChecked = skills.includes(sk.id);
                    return (
                      <button
                        key={sk.id}
                        type="button"
                        onClick={() => toggleSkill(sk.id)}
                        className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-colors ${
                          isChecked
                            ? 'bg-emerald-600/20 border-emerald-500 text-emerald-200'
                            : 'bg-navy-950 border-navy-800 text-slate-400 hover:bg-navy-800'
                        }`}
                      >
                        <div>
                          <p className="font-bold text-xs">{sk.label}</p>
                          <p className="text-[10px] text-slate-400">{sk.description}</p>
                        </div>
                        {isChecked && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emergency-600 to-rose-600 hover:from-emergency-500 hover:to-rose-500 text-white font-bold text-sm shadow-xl shadow-emergency-600/30 flex items-center justify-center space-x-2 transition-all transform active:scale-98 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Create Campus Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-emergency-400 font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
