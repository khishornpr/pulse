import React, { useState } from 'react';
import {
  Search,
  Filter,
  Sparkles,
  CheckCircle,
  XCircle,
  MapPin,
  Clock,
  User,
  Shield,
  Loader2,
  ChevronDown,
  Info
} from 'lucide-react';
import { INCIDENT_TYPES } from '../lib/constants';
import { generateAiSummary, rpcResolveIncident } from '../lib/supabase';

export default function IncidentTable({
  incidents = [],
  onRefresh = null,
  onSelectMapLocation = null,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [generatingAiId, setGeneratingAiId] = useState(null);
  const [activeSummaryModal, setActiveSummaryModal] = useState(null);
  const [resolvingId, setResolvingId] = useState(null);

  // Filter logic
  const filtered = incidents.filter((inc) => {
    const matchesSearch =
      (inc.location_label || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inc.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inc.reporter_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inc.volunteer_name || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || inc.status === statusFilter;
    const matchesType = typeFilter === 'all' || inc.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleAiSummary = async (incident) => {
    setGeneratingAiId(incident.id);
    try {
      const { summary, error } = await generateAiSummary(incident.id);
      setActiveSummaryModal({
        incident,
        summary: summary || incident.ai_summary || 'Summary generation completed.',
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('AI Summary failed:', err);
    } finally {
      setGeneratingAiId(null);
    }
  };

  const handleResolve = async (incidentId) => {
    setResolvingId(incidentId);
    try {
      await rpcResolveIncident(incidentId);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to resolve:', err);
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls / Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search location, responder, reporter..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-navy-900 border border-navy-700 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emergency-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-navy-900 border border-navy-700 text-xs text-slate-200 font-medium focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="accepted">Accepted</option>
            <option value="resolved">Resolved</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-navy-900 border border-navy-700 text-xs text-slate-200 font-medium focus:outline-none"
          >
            <option value="all">All Types</option>
            {INCIDENT_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-2xl border border-navy-800 bg-navy-900 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-navy-950/80 border-b border-navy-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Emergency Type</th>
                <th className="py-3 px-4">Campus Location</th>
                <th className="py-3 px-4">Reporter</th>
                <th className="py-3 px-4">First Responder</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-800/60 text-slate-200 font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No matching campus incidents found.
                  </td>
                </tr>
              ) : (
                filtered.map((inc) => {
                  const typeConfig = INCIDENT_TYPES.find((t) => t.id === inc.type) || INCIDENT_TYPES[0];
                  const timeFormatted = inc.created_at
                    ? new Date(inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Just now';

                  return (
                    <tr key={inc.id} className="hover:bg-navy-800/40 transition-colors">
                      {/* Type Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded-md font-bold uppercase text-[9px] border ${typeConfig.badgeClass}`}>
                          {typeConfig.shortLabel}
                        </span>
                        {inc.blood_group_needed && (
                          <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] bg-rose-600 text-white font-bold">
                            {inc.blood_group_needed}
                          </span>
                        )}
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => onSelectMapLocation && onSelectMapLocation(inc)}
                          className="flex items-center space-x-1 hover:text-emergency-400 text-left transition-colors group"
                        >
                          <MapPin className="w-3.5 h-3.5 text-emergency-500 shrink-0 group-hover:scale-110" />
                          <span className="font-semibold text-white truncate max-w-[160px]">
                            {inc.location_label || 'Campus Location'}
                          </span>
                        </button>
                      </td>

                      {/* Reporter */}
                      <td className="py-3.5 px-4 text-slate-300">
                        <p className="font-semibold text-slate-100">{inc.reporter_name || 'Student'}</p>
                        <p className="text-[10px] text-slate-400">{inc.reporter_phone || '+91 98421...'}</p>
                      </td>

                      {/* Responder */}
                      <td className="py-3.5 px-4">
                        {inc.volunteer_name ? (
                          <div>
                            <p className="font-semibold text-emerald-400">{inc.volunteer_name}</p>
                            <p className="text-[10px] text-slate-400">{inc.volunteer_phone || 'Verified'}</p>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Unassigned</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            inc.status === 'open'
                              ? 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse'
                              : inc.status === 'accepted'
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                              : inc.status === 'resolved'
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                          }`}
                        >
                          {inc.status}
                        </span>
                      </td>

                      {/* Time */}
                      <td className="py-3.5 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                        {timeFormatted}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-2">
                        {/* AI Summary button */}
                        {inc.status === 'resolved' && (
                          <button
                            onClick={() => handleAiSummary(inc)}
                            disabled={generatingAiId === inc.id}
                            className="px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 font-semibold text-[10px] inline-flex items-center space-x-1 transition-colors"
                          >
                            {generatingAiId === inc.id ? (
                              <Loader2 className="w-3 h-3 animate-spin text-purple-400" />
                            ) : (
                              <Sparkles className="w-3 h-3 text-purple-400" />
                            )}
                            <span>{inc.ai_summary ? 'View AI Report' : 'Generate AI Summary'}</span>
                          </button>
                        )}

                        {/* Force Resolve */}
                        {inc.status !== 'resolved' && inc.status !== 'cancelled' && (
                          <button
                            onClick={() => handleResolve(inc.id)}
                            disabled={resolvingId === inc.id}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-300 font-semibold text-[10px] inline-flex items-center space-x-1 transition-colors"
                          >
                            <CheckCircle className="w-3 h-3" />
                            <span>Resolve</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Summary Modal */}
      {activeSummaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-navy-900 border border-purple-500/40 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-navy-800">
              <div className="flex items-center space-x-2 text-purple-400">
                <Sparkles className="w-5 h-5" />
                <h3 className="font-bold text-base text-white">AI Incident Post-Mortem Report</h3>
              </div>
              <button
                onClick={() => setActiveSummaryModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-navy-950/80 border border-purple-500/20 text-xs space-y-2 leading-relaxed">
              <p className="text-slate-200 italic font-sans text-sm">
                {activeSummaryModal.summary}
              </p>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-navy-800">
              <span>Powered by Supabase Edge Function & Claude Sonnet</span>
              <button
                onClick={() => setActiveSummaryModal(null)}
                className="px-4 py-2 rounded-xl bg-navy-800 hover:bg-navy-700 text-slate-200 font-semibold text-xs"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
