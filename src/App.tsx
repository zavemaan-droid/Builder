import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import AuthPage from '@/pages/AuthPage';
import ChatPage from '@/pages/ChatPage';
import ProjectsPage from '@/pages/ProjectsPage';
import AgentsPage from '@/pages/AgentsPage';
import CommunityPage from '@/pages/CommunityPage';
import UpgradesPage from '@/pages/UpgradesPage';
import PlatformPage from '@/pages/PlatformPage';
import SettingsPage from '@/pages/SettingsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<ChatPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="agents" element={<AgentsPage />} />
        <Route path="community" element={<CommunityPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="upgrades" element={<AdminRoute><UpgradesPage /></AdminRoute>} />
        <Route path="platform" element={<AdminRoute><PlatformPage /></AdminRoute>} />
      </Route>
    </Routes>
  );
}
