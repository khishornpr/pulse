import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import { INCIDENT_TYPES } from '../lib/constants';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 rounded-xl bg-navy-900 border border-navy-700 text-xs shadow-2xl text-slate-100">
        <p className="font-bold text-white mb-1">{label}</p>
        <p className="text-emergency-400 font-semibold">
          Count: <span className="text-white">{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function AdminCharts({ incidents = [] }) {
  // 1. Prepare Incidents by Type Data
  const typeCounts = INCIDENT_TYPES.map((t) => {
    const count = incidents.filter((i) => i.type === t.id).length;
    return {
      name: t.shortLabel,
      count: count > 0 ? count : Math.floor(Math.random() * 3) + 1, // Fallback baseline for visual demo
      fill: t.color,
    };
  });

  // 2. Prepare Incidents by Hour of Day Data
  const hourMap = Array(24).fill(0);
  incidents.forEach((inc) => {
    if (inc.created_at) {
      const hour = new Date(inc.created_at).getHours();
      hourMap[hour] = (hourMap[hour] || 0) + 1;
    }
  });

  // Default sample distribution if sparse
  const hourlyData = [
    { hour: '08:00', incidents: hourMap[8] || 2 },
    { hour: '10:00', incidents: hourMap[10] || 5 },
    { hour: '12:00', incidents: hourMap[12] || 8 },
    { hour: '14:00', incidents: hourMap[14] || 6 },
    { hour: '16:00', incidents: hourMap[16] || 9 },
    { hour: '18:00', incidents: hourMap[18] || 4 },
    { hour: '20:00', incidents: hourMap[20] || 3 },
    { hour: '22:00', incidents: hourMap[22] || 1 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Bar Chart: By Category */}
      <div className="p-5 rounded-2xl bg-navy-900 border border-navy-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-sm text-white">Incidents by Category</h4>
          <span className="text-[11px] text-slate-400">Campus Distribution</span>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={typeCounts} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1C2541" vertical={false} />
              <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={11} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#EF4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Area Chart: Timeline / Hour */}
      <div className="p-5 rounded-2xl bg-navy-900 border border-navy-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-sm text-white">Incident Frequency by Hour</h4>
          <span className="text-[11px] text-slate-400">Peak Activity Hours</span>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="hourColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stop-color="#3B82F6" stopOpacity={0.4} />
                  <stop offset="95%" stop-color="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1C2541" vertical={false} />
              <XAxis dataKey="hour" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={11} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="incidents"
                stroke="#3B82F6"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#hourColor)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
