import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { TasksPage } from './pages/TasksPage';
import { CalendarPage } from './pages/CalendarPage';
import { LeavePage } from './pages/LeavePage';
import { ReportsPage } from './pages/ReportsPage';
import { AuditPage } from './pages/AuditPage';
import { UsersPage } from './pages/UsersPage';
import { LoginPage } from './pages/LoginPage';
import { MorningUpdateModal } from './components/MorningUpdateModal';
import { EveningUpdateModal } from './components/EveningUpdateModal';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0f19]">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
};

const AppShell: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMorningOpen, setIsMorningOpen] = useState(false);
  const [isEveningOpen, setIsEveningOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19] text-slate-100 antialiased selection:bg-blue-500 selection:text-white">
      <Navbar />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          openMorningModal={() => setIsMorningOpen(true)}
          openEveningModal={() => setIsEveningOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardPage
                openMorningModal={() => setIsMorningOpen(true)}
                openEveningModal={() => setIsEveningOpen(true)}
              />
            )}
            {activeTab === 'projects' && <ProjectsPage />}
            {activeTab === 'tasks' && <TasksPage />}
            {activeTab === 'calendar' && <CalendarPage />}
            {activeTab === 'leave' && <LeavePage />}
            {activeTab === 'reports' && <ReportsPage />}
            {activeTab === 'audit' && <AuditPage />}
            {activeTab === 'users' && <UsersPage />}
          </div>
        </main>
      </div>

      <MorningUpdateModal isOpen={isMorningOpen} onClose={() => setIsMorningOpen(false)} />
      <EveningUpdateModal isOpen={isEveningOpen} onClose={() => setIsEveningOpen(false)} />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
