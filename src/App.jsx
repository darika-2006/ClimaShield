import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { globalStyles } from './stitches.config';
import Navbar from './components/Navbar';
import RecentlyAccessedBar from './components/RecentlyAccessedBar';
import EmergencyChatbot from './components/EmergencyChatbot';
import ProtectedRoute from './components/ProtectedRoute';

import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';

import HomePage from './pages/HomePage';
import IndiaOverview from './pages/IndiaOverview';
import TimeMachine from './pages/TimeMachine';
import DisasterSimulator from './pages/DisasterSimulator';
import LiveAlerts from './pages/LiveAlerts';
import TamilNaduLiveMap from './pages/TamilNaduLiveMap';
import ReportIncidentPage from './pages/ReportIncidentPage';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import CitizenDashboard from './pages/CitizenDashboard';
import AdminCommandCenter from './pages/AdminCommandCenter';
import ArchitectureHub from './pages/ArchitectureHub';

function App() {
  globalStyles();

  return (
    <AuthProvider>
      <LanguageProvider>
        <BrowserRouter>
          <Navbar />
          <RecentlyAccessedBar />
          <Routes>
            <Route path="/" element={<TamilNaduLiveMap />} />
            <Route path="/tn-map" element={<TamilNaduLiveMap />} />
            <Route path="/india" element={<IndiaOverview />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/timeline" element={<TimeMachine />} />
            <Route path="/alerts" element={<LiveAlerts />} />
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/architecture" element={<ArchitectureHub />} />

            {/* Role-Protected Routes */}
            <Route
              path="/citizen"
              element={
                <ProtectedRoute allowedRoles={['CITIZEN', 'DISTRICT_OFFICER', 'ADMIN']}>
                  <CitizenDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'DISTRICT_OFFICER']}>
                  <AdminCommandCenter />
                </ProtectedRoute>
              }
            />
            <Route
              path="/simulator"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'DISTRICT_OFFICER']}>
                  <DisasterSimulator />
                </ProtectedRoute>
              }
            />
            <Route
              path="/report"
              element={
                <ProtectedRoute allowedRoles={['CITIZEN', 'DISTRICT_OFFICER', 'ADMIN']}>
                  <ReportIncidentPage />
                </ProtectedRoute>
              }
            />
          </Routes>
          <EmergencyChatbot />
        </BrowserRouter>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;