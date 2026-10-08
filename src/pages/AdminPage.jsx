import React, { useState, useEffect } from 'react';
import {
  Shield,
  Activity,
  Flame,
  Layers,
  BarChart3,
  ListFilter,
  MapPin,
  RefreshCw,
  Users,
  Radio,
  Sliders
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRealtimeIncidents } from '../hooks/useRealtimeIncidents';
import { fetchIncidentStats, supabase } from '../lib/supabase';
import AdminStatCards from '../components/AdminStatCards';
import IncidentTable from '../components/IncidentTable';
import CampusMap from '../components/CampusMap';
import HeatmapView from '../components/HeatmapView';
import AdminCharts from '../components/AdminCharts';

export default function AdminPage() {
  const { role } = useAuth();
  const { incidents, refreshIncidents, connectionStatus } = useRealtimeIncidents();
  const [volunteers, setVolunteers] = useState([]);
  const [stats, setStats] = useState({});
  const [activeTab, setActiveTab] = useState('grid'); // 'grid' | 'heatmap' | 'charts'
  const [mapCenter, setMapCenter] = useState(null);

  const loadAdminData = async () => {
    try {
      const { data: statData } = await fetchIncidentStats();
      if (statData) setStats(statData);

      const { data: volData } = await supabase
        .from('volunteers_with_coords')
        .select('*');
      if (volData) setVolunteers(volData);
    } catch (err) {
      console.warn('Error loading admin data:', err);
    }
  };

  useEffect(() => {
    loadAdminData();
    const interval = setInterval(loadAdminData, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-navy-900 border border-navy-800 shadow-2xl">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-lg">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Campus Admin Command Center
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Live Proctor Console
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time emergency telemetry, volunteer dispatch monitoring & AI post-mortems
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            refreshIncidents();
            loadAdminData();
          }}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-navy-950 hover:bg-navy-800 border border-navy-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Feeds</span>
        </button>
      </div>

      {/* 1. Stat Cards */}
      <AdminStatCards stats={stats} incidents={incidents} volunteers={volunteers} />

      {/* 2. Main Live Map Section */}
      <div className="p-6 rounded-3xl bg-navy-900 border border-navy-800 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-emergency-400 animate-pulse" />
            <h2 className="font-bold text-base text-white">Live Incident & Responder Telemetry</h2>
          </div>

          {/* View Tab Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-navy-950 border border-navy-800 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('grid')}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors ${
                activeTab === 'grid'
                  ? 'bg-navy-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Map View</span>
            </button>
            <button
              onClick={() => setActiveTab('heatmap')}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors ${
                activeTab === 'heatmap'
                  ? 'bg-navy-800 text-rose-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Risk Heatmap</span>
            </button>
            <button
              onClick={() => setActiveTab('charts')}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors ${
                activeTab === 'charts'
                  ? 'bg-navy-800 text-blue-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analytics</span>
            </button>
          </div>
        </div>

        {/* Tab Displays */}
        {activeTab === 'grid' && (
          <div className="rounded-2xl overflow-hidden border border-navy-800">
            <CampusMap
              incidents={incidents}
              volunteers={volunteers}
              centerCoords={mapCenter}
              height="440px"
              zoom={17}
            />
          </div>
        )}

        {activeTab === 'heatmap' && (
          <div className="space-y-2">
            <p className="text-xs text-slate-300">
              Visualizing cumulative emergency frequency across campus blocks, academic zones, and perimeter gates.
            </p>
            <HeatmapView incidents={incidents} height="440px" />
          </div>
        )}

        {activeTab === 'charts' && (
          <div className="pt-2">
            <AdminCharts incidents={incidents} />
          </div>
        )}
      </div>

      {/* 3. Incidents Management Table */}
      <div className="p-6 rounded-3xl bg-navy-900 border border-navy-800 shadow-2xl space-y-4">
        <div className="flex items-center space-x-2">
          <ListFilter className="w-5 h-5 text-purple-400" />
          <h2 className="font-bold text-base text-white">Campus Emergency Audit Trail</h2>
        </div>
        <IncidentTable
          incidents={incidents}
          onRefresh={() => {
            refreshIncidents();
            loadAdminData();
          }}
          onSelectMapLocation={(inc) => {
            if (inc.lat && inc.lng) {
              setMapCenter({ lat: inc.lat, lng: inc.lng });
              setActiveTab('grid');
              window.scrollTo({ top: 120, behavior: 'smooth' });
            }
          }}
        />
      </div>
    </div>
  );
}
