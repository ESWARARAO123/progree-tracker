import React from 'react';
import { LayoutDashboard, Sun, Moon, Briefcase, CheckSquare, Calendar as CalendarIcon, FileText, BarChart3, ShieldAlert, Users, PanelLeftClose, CalendarDays } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openMorningModal: () => void;
  openEveningModal: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, openMorningModal, openEveningModal, collapsed, onToggleCollapse }) => {
  const { currentUser } = useApp();

  if (collapsed) return null;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects', icon: Briefcase },
    { id: 'tasks', label: 'Task Board', icon: CheckSquare },
    { id: 'calendar', label: 'Calendar & Attendance', icon: CalendarIcon },
    { id: 'leave', label: 'Leave & Requests', icon: FileText },
    ...(currentUser.role === 'ADMIN' ? [
      { id: 'leave-calendar', label: 'Leave Calendar', icon: CalendarDays },
    ] : []),
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
    ...(currentUser.role === 'ADMIN' ? [
      { id: 'users', label: 'User Management', icon: Users },
      { id: 'audit', label: 'Audit Logs', icon: ShieldAlert },
    ] : []),
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-4 shrink-0 hidden md:flex sticky top-0 self-start h-full overflow-y-auto">
      <button
        onClick={onToggleCollapse}
        className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition"
        title="Close sidebar"
      >
        <PanelLeftClose className="w-4 h-4" />
      </button>
      {/* Quick Action Buttons for Updates — employees only */}
      {currentUser.role !== 'ADMIN' && (
        <div className="space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3">Quick Updates</div>
          
          <button
            onClick={openMorningModal}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-600/30 text-xs font-semibold transition group shadow-sm"
          >
            <div className="flex items-center space-x-2.5">
              <Sun className="w-4 h-4 text-emerald-400 group-hover:rotate-45 transition-transform" />
              <span>Morning Update</span>
            </div>
            <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-300">9AM-12PM</span>
          </button>

          <button
            onClick={openEveningModal}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/30 text-blue-300 hover:bg-blue-600/30 text-xs font-semibold transition group shadow-sm"
          >
            <div className="flex items-center space-x-2.5">
              <Moon className="w-4 h-4 text-blue-400 group-hover:-rotate-12 transition-transform" />
              <span>Evening Update</span>
            </div>
            <span className="text-[10px] bg-blue-500/20 px-1.5 py-0.5 rounded text-blue-300">4PM-10PM</span>
          </button>
        </div>
      )}

      {/* Primary Navigation */}
      <div className="space-y-1 flex-1">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">Navigation</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                isActive
                  ? 'bg-blue-600/15 border border-blue-500/30 text-blue-400 font-semibold shadow-inner'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Footer info card */}
      <div className="p-3 rounded-xl glass-panel border border-slate-800 text-[11px] text-slate-400 space-y-1">
        <div className="flex items-center justify-between text-slate-300 font-medium">
          <span>Role Status</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${currentUser.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'}`}>
            {currentUser.role}
          </span>
        </div>
        <p className="text-slate-400">Lock Cutoff: 10:00 PM</p>
      </div>
    </aside>
  );
};
