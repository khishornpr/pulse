import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useRealtimeIncidents } from './hooks/useRealtimeIncidents';
import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';
import DemoControlDrawer from './components/DemoControlDrawer';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import HomePage from './pages/HomePage';
import VolunteerPage from './pages/VolunteerPage';
import AdminPage from './pages/AdminPage';
import DemoPage from './pages/DemoPage';

function ProtectedRoute({ children, requiredRole = null }) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-950 text-slate-100">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-emergency-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-slate-400">Loading Pulse Grid...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && role !== requiredRole && role !== 'admin') {
    return <Navigate to="/home" replace />;
  }

  return children;
}

function AppContent() {
  const { connectionStatus } = useRealtimeIncidents();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col selection:bg-emergency-600 selection:text-white">
      <Navbar connectionStatus={connectionStatus} />

      <main className="flex-1">
        <ErrorBoundary key={location.pathname}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/volunteer"
              element={
                <ProtectedRoute>
                  <VolunteerPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminPage />
                </ProtectedRoute>
              }
            />
            <Route path="/demo" element={<DemoPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
      </main>

      {/* Floating Demo Control Drawer on all screens for seamless hackathon testing */}
      <DemoControlDrawer />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <ErrorBoundary>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ErrorBoundary>
    </Router>
  );
}
