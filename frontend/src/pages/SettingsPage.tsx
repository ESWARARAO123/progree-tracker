import React, { useState } from 'react';
import {
  Settings,
  Bot,
  Bell,
  User,
  Mail,
  KeyRound,
  Check,
  Laptop,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ErrorTroubleshooterBot } from '../components/ErrorTroubleshooterBot';
import { ChangePasswordModal } from '../components/ChangePasswordModal';

interface SettingsPageProps {
  onNavigateTab: (tab: string) => void;
}

type SettingsTab = 'bot' | 'preferences' | 'account' | 'contact';

const SUPPORT_EMAIL = 'eswar@sierraedge.ai';

export const SettingsPage: React.FC<SettingsPageProps> = ({
  onNavigateTab,
}) => {
  const { currentUser, updatePreferences } = useApp();
  const [activeTab, setActiveTab] = useState<SettingsTab>('bot');
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Preference fields
  const [morningReminder, setMorningReminder] = useState(
    currentUser.preferences?.morningReminder ?? true
  );
  const [eveningReminder, setEveningReminder] = useState(
    currentUser.preferences?.eveningReminder ?? true
  );
  const [desktopAlerts, setDesktopAlerts] = useState(
    currentUser.preferences?.desktopAlerts ?? false
  );
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // System Diagnostics
  const [diagnosticsCopied, setDiagnosticsCopied] = useState(false);

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPrefs(true);
    setSaveSuccess(false);

    try {
      await updatePreferences({
        morningReminder,
        eveningReminder,
        desktopAlerts,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update preferences', err);
      alert('Failed to save preferences. Please try again.');
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleCopyDiagnostics = () => {
    const diag = `=== Sierra Team Hub System Diagnostics ===
Generated: ${new Date().toISOString()}
User Name: ${currentUser.fullName}
User Email: ${currentUser.email}
User ID: ${currentUser.id}
Role: ${currentUser.role}
Department: ${currentUser.department || 'N/A'}
Designation: ${currentUser.designation || 'N/A'}
User Agent: ${navigator.userAgent}
Screen Resolution: ${window.screen.width}x${window.screen.height}
Current URL: ${window.location.href}
Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}
Online Status: ${navigator.onLine ? 'Connected' : 'Offline'}`;

    navigator.clipboard.writeText(diag);
    setDiagnosticsCopied(true);
    setTimeout(() => setDiagnosticsCopied(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">
              Settings & Support Hub
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Troubleshoot errors with our 24/7 Bot, configure preferences, or escalate to{' '}
              <strong className="text-blue-400">{SUPPORT_EMAIL}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('bot')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition shrink-0 ${
            activeTab === 'bot'
              ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Bot className="w-4 h-4 text-purple-400" />
          <span>Error Troubleshooter Bot</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </button>

        <button
          onClick={() => setActiveTab('preferences')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition shrink-0 ${
            activeTab === 'preferences'
              ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Bell className="w-4 h-4 text-amber-400" />
          <span>Preferences & Notifications</span>
        </button>

        <button
          onClick={() => setActiveTab('account')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition shrink-0 ${
            activeTab === 'account'
              ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <User className="w-4 h-4 text-cyan-400" />
          <span>Account & Security</span>
        </button>

        <button
          onClick={() => setActiveTab('contact')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition shrink-0 ${
            activeTab === 'contact'
              ? 'bg-rose-600/20 text-rose-300 border border-rose-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Mail className="w-4 h-4 text-rose-400" />
          <span>Direct Support ({SUPPORT_EMAIL})</span>
        </button>
      </div>

      {/* Tab 1: Troubleshooter Bot */}
      {activeTab === 'bot' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <div>
                <h3 className="text-xs font-bold text-white">
                  Got an error? Let our bot troubleshoot it!
                </h3>
                <p className="text-[11px] text-slate-400">
                  Ask about locked updates, 403 forbidden access, upload errors, or session timeouts.
                  If unresolved, you can mail <strong className="text-blue-400">{SUPPORT_EMAIL}</strong> directly.
                </p>
              </div>
            </div>
          </div>

          <ErrorTroubleshooterBot
            onNavigateTab={onNavigateTab}
          />
        </div>
      )}



      {/* Tab 3: Preferences & Notifications */}
      {activeTab === 'preferences' && (
        <form onSubmit={handleSavePreferences} className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Daily Reminder Preferences</h3>
                <p className="text-xs text-slate-400">
                  Configure automated reminders for Morning and Evening updates
                </p>
              </div>
            </div>

            {saveSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Preferences saved successfully!</span>
              </div>
            )}

            <div className="space-y-4">
              <label className="flex items-start justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 cursor-pointer hover:bg-slate-800/80 transition">
                <div className="space-y-1 pr-4">
                  <div className="text-xs font-semibold text-white">
                    Morning Update Reminder (9:30 AM)
                  </div>
                  <div className="text-[11px] text-slate-400 leading-relaxed">
                    Receive a notification reminder to log your planned work and blockers before
                    the morning window closes at 12:00 PM.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={morningReminder}
                  onChange={e => setMorningReminder(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-700 bg-slate-900 mt-1"
                />
              </label>

              <label className="flex items-start justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 cursor-pointer hover:bg-slate-800/80 transition">
                <div className="space-y-1 pr-4">
                  <div className="text-xs font-semibold text-white">
                    Evening Update Reminder (5:00 PM & 9:00 PM)
                  </div>
                  <div className="text-[11px] text-slate-400 leading-relaxed">
                    Receive reminders before the strict 10:00 PM auto-lock cutoff so your
                    accomplishments and hours spent are logged on time.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={eveningReminder}
                  onChange={e => setEveningReminder(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-700 bg-slate-900 mt-1"
                />
              </label>

              <label className="flex items-start justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 cursor-pointer hover:bg-slate-800/80 transition">
                <div className="space-y-1 pr-4">
                  <div className="text-xs font-semibold text-white">Desktop Audio Alerts</div>
                  <div className="text-[11px] text-slate-400 leading-relaxed">
                    Play a gentle audio chime when project tasks or meeting invites arrive.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={desktopAlerts}
                  onChange={e => setDesktopAlerts(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-700 bg-slate-900 mt-1"
                />
              </label>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingPrefs}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-600/20 transition disabled:opacity-50"
              >
                {savingPrefs ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save Preferences</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab 4: Account & Security */}
      {activeTab === 'account' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold text-white">
                  {currentUser.fullName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{currentUser.fullName}</h3>
                  <p className="text-xs text-slate-400">{currentUser.email}</p>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {currentUser.role}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 space-y-1">
                <span className="text-slate-400 font-medium">Department</span>
                <p className="text-white font-semibold">{currentUser.department || 'General'}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 space-y-1">
                <span className="text-slate-400 font-medium">Designation</span>
                <p className="text-white font-semibold">{currentUser.designation || 'Team Member'}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 space-y-1">
                <span className="text-slate-400 font-medium">Account Status</span>
                <p className="text-emerald-400 font-semibold flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Active & Verified</span>
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 space-y-1">
                <span className="text-slate-400 font-medium">Security Access</span>
                <p className="text-white font-semibold">
                  {currentUser.role === 'ADMIN' ? 'Full Administrator Privileges' : 'Standard Employee Access'}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white">Account Password</h4>
                <p className="text-[11px] text-slate-400">
                  Update your login password regularly for account security
                </p>
              </div>

              <button
                onClick={() => setIsPasswordModalOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 border border-blue-500/30 text-xs font-semibold transition"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Change Password</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Direct Support (eswar@sierraedge.ai) & Diagnostics */}
      {activeTab === 'contact' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/20">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Direct Technical Support</h3>
                <p className="text-xs text-slate-400">
                  Contact our lead engineer for issues unresolved by the automated bot
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Official Support Email:</span>
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="font-mono text-sm font-bold text-emerald-400 hover:underline"
                >
                  {SUPPORT_EMAIL}
                </a>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                If the Diagnostic Bot was unable to resolve your error, you can send an email directly to{' '}
                <strong className="text-white">{SUPPORT_EMAIL}</strong>. Our team usually responds
                within 1 business hour.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
                  `[Sierra Team Hub] Support Request - ${currentUser.fullName}`
                )}&body=${encodeURIComponent(
                  `Hello Eswar,\n\nI need technical assistance regarding Sierra Team Hub.\n\nUser: ${currentUser.fullName} (${currentUser.email})\nRole: ${currentUser.role}\nTime: ${new Date().toLocaleString()}\n\nProblem Details:\n`
                )}`}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-rose-600/20 transition"
              >
                <Mail className="w-4 h-4" />
                <span>Mail to {SUPPORT_EMAIL}</span>
              </a>

              <button
                onClick={handleCopyDiagnostics}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
              >
                {diagnosticsCopied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Diagnostics Copied!</span>
                  </>
                ) : (
                  <>
                    <Laptop className="w-4 h-4" />
                    <span>Copy System Diagnostics</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* System Diagnostics Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Diagnostic Snapshot
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase">System Time</span>
                <p className="text-white font-mono mt-0.5">{new Date().toLocaleTimeString()}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase">Connection</span>
                <p className="text-emerald-400 font-semibold mt-0.5">Online • Stable</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase">Cutoff Rule</span>
                <p className="text-amber-400 font-semibold mt-0.5">10:00 PM Auto-Lock</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
};
