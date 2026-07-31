import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Bell, Clock, Lock, Zap, LogOut } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { currentUser, notifications, trigger10PmScan, markNotificationRead } = useApp();
  const { logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20">
            WT
          </div>
          <div>
            <h1 className="font-bold text-white tracking-wide text-lg">SierraEdgeAI Tracker</h1>
            <span className="text-xs text-slate-400">Enterprise Work Update & Productivity System</span>
          </div>
        </div>

        <div className="hidden md:flex items-center space-x-2 bg-slate-800/80 border border-slate-700/60 px-3 py-1.5 rounded-lg text-xs text-slate-300">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span>Lock Cutoff: <strong className="text-amber-400 font-semibold">10:00 PM</strong></span>
          <span className="text-slate-500">|</span>
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-emerald-400 font-medium">Auto-Lock Active</span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button
          onClick={trigger10PmScan}
          className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
          title="Simulate Nightly 10:00 PM Lock & Email Reminder Trigger"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span className="hidden sm:inline">Simulate 10 PM Scan</span>
        </button>

        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg bg-slate-800 border border-slate-700/70 hover:bg-slate-700 text-slate-300 relative transition"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-4 z-50">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                <h4 className="font-semibold text-sm text-white">Notifications</h4>
                <span className="text-xs text-slate-400">{unreadCount} unread</span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No notifications</p>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={`p-2.5 rounded-lg text-xs border transition cursor-pointer ${n.isRead ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-blue-500/10 border-blue-500/30 text-white font-medium'}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-blue-400">{n.title}</span>
                        <span className="text-[10px] text-slate-500">{n.createdAt}</span>
                      </div>
                      <p className="text-slate-300">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3 pl-2 border-l border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs font-bold text-white">
              {currentUser.fullName.charAt(0)}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-semibold text-white">{currentUser.fullName}</div>
              <div className="text-[10px] text-slate-400">{currentUser.email}</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-lg bg-slate-800 border border-slate-700/70 hover:bg-rose-500/20 hover:border-rose-500/30 text-slate-400 hover:text-rose-300 transition"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
