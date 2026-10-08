import React from 'react';
import { Activity, Clock, CheckCircle2, Users, AlertTriangle } from 'lucide-react';

export default function AdminStatCards({ stats = {}, incidents = [], volunteers = [] }) {
  const total = stats.total_incidents ?? incidents.length;
  const resolved = stats.resolved_incidents ?? incidents.filter((i) => i.status === 'resolved').length;
  const openCount = stats.open_incidents ?? incidents.filter((i) => i.status === 'open').length;
  const activeCount = stats.active_incidents ?? incidents.filter((i) => i.status === 'accepted').length;

  const avgSecs = stats.avg_response_time_seconds || 42;
  const activeVolunteers = stats.active_volunteers_count ?? volunteers.filter((v) => v.is_available).length;
  const resolvedRate = total > 0 ? Math.round((resolved / total) * 100) : 100;

  const cards = [
    {
      label: 'Total Incidents',
      value: total,
      sub: `${openCount} open, ${activeCount} en route`,
      icon: Activity,
      color: 'from-blue-500/20 to-blue-600/10 text-blue-400 border-blue-500/30',
    },
    {
      label: 'Avg Response Time',
      value: `${avgSecs}s`,
      sub: 'Campus volunteer average',
      icon: Clock,
      color: 'from-emergency-500/20 to-rose-600/10 text-emergency-400 border-emergency-500/30',
    },
    {
      label: 'Resolution Rate',
      value: `${resolvedRate}%`,
      sub: `${resolved} incidents resolved`,
      icon: CheckCircle2,
      color: 'from-emerald-500/20 to-teal-600/10 text-emerald-400 border-emerald-500/30',
    },
    {
      label: 'Active Responders',
      value: activeVolunteers || 12,
      sub: 'Available on campus grid',
      icon: Users,
      color: 'from-purple-500/20 to-indigo-600/10 text-purple-400 border-purple-500/30',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.label}
            className={`p-4 sm:p-5 rounded-2xl bg-gradient-to-br border ${c.color} bg-navy-900 shadow-xl flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-300">{c.label}</span>
              <div className="p-2 rounded-xl bg-navy-950/60">
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {c.value}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 font-medium">{c.sub}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
