import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Bell, Clock, Lock, Zap, LogOut, Check, CheckCheck, ChevronDown, KeyRound, Mail } from 'lucide-react';
import { ChangePasswordModal } from './ChangePasswordModal';

export const Navbar: React.FC = () => {
  const { currentUser, notifications, trigger10PmScan, markNotificationRead, markAllNotificationsRead } = useApp();
  const { logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-blue-500/20 border border-blue-400/30 tracking-wider">
            SEAI
          </div>
          <div>
            <h1 className="font-bold text-white tracking-wide text-lg">Sierra Team Hub</h1>
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
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-88 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-4 z-50">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                <div className="flex items-center space-x-2">
                  <h4 className="font-semibold text-sm text-white">Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="flex items-center space-x-1 text-[11px] text-blue-400 hover:text-blue-300 font-medium transition"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">No notifications</p>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={`p-3 rounded-xl text-xs border transition cursor-pointer space-y-1.5 ${
                        n.isRead
                          ? 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:bg-slate-800/50'
                          : 'bg-blue-500/10 border-blue-500/30 text-white font-medium hover:bg-blue-500/15 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-blue-400 truncate">{n.title}</span>
                        <div className="flex items-center space-x-2 shrink-0">
                          {n.isRead ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700/60 flex items-center space-x-1">
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>Read</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center space-x-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                              <span>New</span>
                            </span>
                          )}
                          <span className="text-[10px] text-slate-500">{n.createdAt}</span>
                        </div>
                      </div>
                      <p className="text-slate-300 leading-relaxed">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3 pl-2 border-l border-slate-800">
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 rounded-xl hover:bg-slate-800/60 px-2 py-1.5 transition"
            >
              <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs font-bold text-white">
                {currentUser.fullName.charAt(0)}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-semibold text-white">{currentUser.fullName}</div>
                <div className="text-[10px] text-slate-400">{currentUser.email}</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-1.5 z-50">
                <div className="px-3 py-2 border-b border-slate-800 mb-1">
                  <div className="text-xs font-semibold text-white">{currentUser.fullName}</div>
                  <div className="text-[10px] text-slate-400">{currentUser.email}</div>
                  <div className="text-[10px] mt-0.5 px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 w-fit">
                    {currentUser.role}
                  </div>
                </div>
                <button
                  onClick={() => { setShowUserMenu(false); setIsPasswordOpen(true); }}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-xs text-slate-300 hover:bg-slate-800 transition"
                >
                  <KeyRound className="w-3.5 h-3.5 text-blue-400" />
                  <span>Change Password</span>
                </button>
                <button
                  onClick={logout}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>

                <button
                  onClick={() => window.open('mailto:eswar@sierraedge.ai?subject=Sierra%20Team%20Hub%20Feedback&body=Hello%20Eswar,%0A%0AI%20have%20a%20suggestion%20regarding%20Sierra%20Team%20Hub%3A%0A%0A')}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-xs text-emerald-400 hover:bg-emerald-500/10 transition"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Send Feedback / Suggestion</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={logout}
            className="p-2 rounded-lg bg-slate-800 border border-slate-700/70 hover:bg-rose-500/20 hover:border-rose-500/30 text-slate-400 hover:text-rose-300 transition lg:hidden"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <ChangePasswordModal isOpen={isPasswordOpen} onClose={() => setIsPasswordOpen(false)} />
    </header>
  );
};
