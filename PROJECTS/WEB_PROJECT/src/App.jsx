import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { HashRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { useState, useCallback } from 'react';
import Layout from './components/Layout';
import Splash from './pages/Splash';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AuthCallback from './pages/AuthCallback';
import FileComplaint from './pages/FileComplaint';
import ForgotPassword from './pages/ForgotPassword';
import TrackCase from './pages/TrackCase';
// WomenSafety removed per requirements
import Dashboard from './pages/Dashboard';
import Departments from './pages/Departments';
import Contact from './pages/Contact';
import LiveTracking from './pages/LiveTracking';
import Analytics from './pages/Analytics';
import LegalDocuments from './pages/LegalDocuments';
import PoliceStations from './pages/PoliceStations';
import Feedback from './pages/Feedback';
import OfficerDashboard from './pages/OfficerDashboard';
import StationDashboard from './pages/StationDashboard';
import DSPDashboard from './pages/DSPDashboard';
import AttendanceSystem from './pages/AttendanceSystem';
import CrimeAnalysis from './pages/CrimeAnalysis';
import LawyerDashboard from './pages/LawyerDashboard';
import CourtDashboard from './pages/CourtDashboard';
import FIRDocument from './pages/FIRDocument';
import ConstitutionRights from './pages/ConstitutionRights';
import CitizenChat from './pages/CitizenChat';
import SmartAlerts from './pages/SmartAlerts';
import UnifiedDashboard from './pages/UnifiedDashboard';
import PerformanceDashboard from './pages/PerformanceDashboard';
import CaseManagement from './pages/CaseManagement';
import SafeRoute from './pages/SafeRoute';
import TrustedCircle from './pages/TrustedCircle';
import PoliceAIAdvisor from './pages/PoliceAIAdvisor';
import DutyManagement from './pages/DutyManagement';
import AlertsAdmin from './pages/AlertsAdmin';
import GoldenHourCyber from './pages/GoldenHourCyber';
import OfficerManagement from './pages/OfficerManagement';
import ActivityLog from './pages/ActivityLog';
import DGPDashboard from './pages/DGPDashboard';
import AdminPanel from './pages/AdminPanel';

import CrimeHeatMap from './pages/CrimeHeatMap';
import NyayaAIAssistant from './pages/NyayaAIAssistant';
import WorkforceMonitor from './pages/WorkforceMonitor';
import SystemAdminBoard from './pages/SystemAdminBoard';
import CitizenDashboard from './pages/CitizenDashboard';
import CyberOpsCenter from './pages/CyberOpsCenter';
import CompleteProfile from './pages/CompleteProfile';
import ResetPassword from './pages/ResetPassword';

const RequireRole = ({ children, allowedRoles }) => {
  const { profile } = useAuth();
  if (!profile) return null;
  const userRole = profile.role || profile.user_type || 'citizen';
  
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};
const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/auth" element={<Navigate to="/login" replace />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/complete-profile" element={<CompleteProfile />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/file-complaint" element={<FileComplaint />} />
        <Route path="/track-case" element={<TrackCase />} />
        {/* women-safety removed */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/departments" element={<Departments />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/live-tracking" element={<LiveTracking />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/legal-documents" element={<LegalDocuments />} />
        <Route path="/police-stations" element={<PoliceStations />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/officer-dashboard" element={<RequireRole allowedRoles={['police_officer', 'station_officer', 'dsp', 'sp', 'commissioner', 'dgp', 'administrator', 'system_admin']}><OfficerDashboard /></RequireRole>} />
        <Route path="/station-dashboard" element={<RequireRole allowedRoles={['station_officer', 'dsp', 'sp', 'commissioner', 'dgp', 'administrator', 'system_admin']}><StationDashboard /></RequireRole>} />
        <Route path="/dsp-dashboard" element={<RequireRole allowedRoles={['dsp', 'sp', 'commissioner', 'dgp', 'administrator', 'system_admin']}><DSPDashboard /></RequireRole>} />
        <Route path="/attendance" element={<RequireRole allowedRoles={['station_officer', 'dsp', 'sp', 'commissioner', 'dgp', 'administrator', 'system_admin']}><AttendanceSystem /></RequireRole>} />
        <Route path="/crime-analysis" element={<RequireRole allowedRoles={['dsp', 'sp', 'commissioner', 'dgp', 'administrator', 'system_admin']}><CrimeAnalysis /></RequireRole>} />
        <Route path="/lawyer-dashboard" element={<RequireRole allowedRoles={['lawyer', 'system_admin']}><LawyerDashboard /></RequireRole>} />
        <Route path="/court-dashboard" element={<RequireRole allowedRoles={['court', 'court_officer', 'judge', 'system_admin']}><CourtDashboard /></RequireRole>} />
        <Route path="/fir-document" element={<FIRDocument />} />
        <Route path="/constitution-rights" element={<ConstitutionRights />} />
        <Route path="/citizen-chat" element={<CitizenChat />} />
        <Route path="/smart-alerts" element={<SmartAlerts />} />
        <Route path="/unified-dashboard" element={<RequireRole allowedRoles={['dgp', 'administrator', 'system_admin']}><UnifiedDashboard /></RequireRole>} />
        <Route path="/performance-dashboard" element={<RequireRole allowedRoles={['dgp', 'administrator', 'system_admin']}><PerformanceDashboard /></RequireRole>} />
        <Route path="/case-management" element={<RequireRole allowedRoles={['police_officer', 'station_officer', 'dsp', 'sp', 'commissioner', 'dgp', 'administrator', 'system_admin']}><CaseManagement /></RequireRole>} />
        <Route path="/safe-route" element={<SafeRoute />} />
        <Route path="/trusted-circle" element={<TrustedCircle />} />
        <Route path="/police-ai-advisor" element={<RequireRole allowedRoles={['dsp', 'sp', 'commissioner', 'dgp', 'administrator', 'system_admin']}><PoliceAIAdvisor /></RequireRole>} />
        <Route path="/duty-management" element={<RequireRole allowedRoles={['station_officer', 'dsp', 'sp', 'commissioner', 'dgp', 'administrator', 'system_admin']}><DutyManagement /></RequireRole>} />
        <Route path="/alerts-admin" element={<RequireRole allowedRoles={['dgp', 'administrator', 'system_admin']}><AlertsAdmin /></RequireRole>} />
        <Route path="/golden-hour-cyber" element={<GoldenHourCyber />} />
        <Route path="/officer-management" element={<RequireRole allowedRoles={['dgp', 'administrator', 'system_admin']}><OfficerManagement /></RequireRole>} />
        <Route path="/activity-log" element={<RequireRole allowedRoles={['dgp', 'administrator', 'system_admin']}><ActivityLog /></RequireRole>} />
        <Route path="/dgp-dashboard" element={<RequireRole allowedRoles={['dgp', 'administrator', 'system_admin']}><DGPDashboard /></RequireRole>} />
        <Route path="/admin-panel" element={<RequireRole allowedRoles={['administrator', 'system_admin']}><AdminPanel /></RequireRole>} />

        <Route path="/crime-heat-map" element={<RequireRole allowedRoles={['dsp', 'sp', 'commissioner', 'dgp', 'administrator', 'system_admin']}><CrimeHeatMap /></RequireRole>} />
        <Route path="/nyaya-ai" element={<NyayaAIAssistant />} />
        <Route path="/workforce-monitor" element={<RequireRole allowedRoles={['dsp', 'sp', 'commissioner', 'dgp', 'administrator', 'system_admin']}><WorkforceMonitor /></RequireRole>} />
        <Route path="/system-admin" element={<RequireRole allowedRoles={['system_admin']}><SystemAdminBoard /></RequireRole>} />
        <Route path="/citizen-dashboard" element={<RequireRole allowedRoles={['citizen']}><CitizenDashboard /></RequireRole>} />
        <Route path="/cyber-ops" element={<RequireRole allowedRoles={['cyber_officer', 'dsp', 'sp', 'commissioner', 'dgp', 'administrator', 'system_admin']}><CyberOpsCenter /></RequireRole>} />
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
  );
};

function App() {
  const [showSplash, setShowSplash] = useState(() => {
    return sessionStorage.getItem('nyayamitra_splash_shown') !== 'true';
  });

  const handleSplashComplete = useCallback(() => {
    sessionStorage.setItem('nyayamitra_splash_shown', 'true');
    setShowSplash(false);
  }, []);

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          {showSplash ? (
            <Splash onComplete={handleSplashComplete} />
          ) : (
            <AuthenticatedApp />
          )}
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App