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
import { PanelLeftOpen } from 'lucide-react';

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

const VALID_TABS = ['dashboard', 'projects', 'tasks', 'calendar', 'leave', 'reports', 'audit', 'users'];

const getInitialTab = () => {
  const hash = window.location.hash.replace('#', '');
  if (hash && VALID_TABS.includes(hash)) return hash;
  const saved = localStorage.getItem('activeTab');
  if (saved && VALID_TABS.includes(saved)) return saved;
  return 'dashboard';
};

const AppShell: React.FC = () => {
  const [activeTab, setActiveTabState] = useState<string>(getInitialTab);
  const [isMorningOpen, setIsMorningOpen] = useState(false);
  const [isEveningOpen, setIsEveningOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(
    () => localStorage.getItem('sidebarCollapsed') === 'true'
  );

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      localStorage.setItem('sidebarCollapsed', String(!prev));
      return !prev;
    });
  };

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    window.location.hash = tab;
    localStorage.setItem('activeTab', tab);
  };

  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && VALID_TABS.includes(hash)) {
        setActiveTabState(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-[#0b0f19] text-slate-100 antialiased selection:bg-blue-500 selection:text-white">
      <Navbar />

      <div className="flex-1 flex overflow-y-auto">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          openMorningModal={() => setIsMorningOpen(true)}
          openEveningModal={() => setIsEveningOpen(true)}
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebar}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 relative z-10">
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

        {sidebarCollapsed && (
          <button
            onClick={toggleSidebar}
            className="fixed bottom-6 left-6 z-30 p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition"
            title="Show sidebar"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        )}
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
