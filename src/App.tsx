import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './store';
import { LoginPage } from './pages/LoginPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { TopicSelectPage } from './pages/TopicSelectPage';
import { LessonPage } from './pages/LessonPage';
import { LessonSummaryPage } from './pages/LessonSummaryPage';
import { StatsPage } from './pages/StatsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AddWordPage } from './pages/AddWordPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isOnboarded } = useApp();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isOnboarded) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated, isOnboarded } = useApp();

  return (
    <Routes>
      <Route path="/login" element={
        isAuthenticated ? <Navigate to={isOnboarded ? "/dashboard" : "/onboarding"} replace /> : <LoginPage />
      } />
      <Route path="/onboarding" element={
        !isAuthenticated ? <Navigate to="/login" replace /> :
        isOnboarded ? <Navigate to="/dashboard" replace /> :
        <OnboardingPage />
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute><DashboardPage /></ProtectedRoute>
      } />
      <Route path="/topics" element={
        <ProtectedRoute><TopicSelectPage /></ProtectedRoute>
      } />
      <Route path="/lesson" element={
        <ProtectedRoute><LessonPage /></ProtectedRoute>
      } />
      <Route path="/lesson/summary" element={
        <ProtectedRoute><LessonSummaryPage /></ProtectedRoute>
      } />
      <Route path="/stats" element={
        <ProtectedRoute><StatsPage /></ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute><SettingsPage /></ProtectedRoute>
      } />
      <Route path="/add-word" element={
        <ProtectedRoute><AddWordPage /></ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}
