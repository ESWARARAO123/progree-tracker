import React from 'react';
import { X, CheckCircle2, AlertTriangle, Sun, Moon } from 'lucide-react';
import type { User, DailyTaskUpdate } from '../types';

interface AdminUpdateStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  kind: 'submitted' | 'pending';
  updateType?: 'morning' | 'evening';
  users: User[];
  updates: DailyTaskUpdate[];
  today: string;
}

function fmtTime(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export const AdminUpdateStatusModal: React.FC<AdminUpdateStatusModalProps> = ({ isOpen, onClose, kind, updateType = 'morning', users, updates, today }) => {
  if (!isOpen) return null;

  const isMorning = updateType === 'morning';
  const normalizeDate = (value?: string | null) => (value ? value.slice(0, 10) : '');
  const todayKey = normalizeDate(today);

  const relevantUpdates = updates.filter(u => normalizeDate(u.reportDate) === todayKey);
  const fallbackUpdates = relevantUpdates.length > 0 ? relevantUpdates : updates.slice().sort((a, b) => (b.reportDate || '').localeCompare(a.reportDate || ''));
  const displayUpdates = relevantUpdates.length > 0 ? relevantUpdates : fallbackUpdates;

  const submittedUpdates = displayUpdates.filter(u => (isMorning ? u.morningSubmittedAt : u.eveningSubmittedAt));
  const submittedUserIds = new Set(submittedUpdates.map(u => u.userId).filter(Boolean));

  const normalizedUsers = users.length > 0
    ? users
    : [];

  const submittedUsers = Array.from(new Map(
    [
      ...submittedUpdates.map(update => {
        const matchedUser = normalizedUsers.find(u => u.id === update.userId)
          || normalizedUsers.find(u => u.fullName === update.userName || u.email === update.userEmail || u.email === update.userName);

        return [
          matchedUser?.id || update.userId || update.id,
          {
            id: matchedUser?.id || update.userId || update.id,
            fullName: matchedUser?.fullName || update.userName || 'Unknown User',
            email: matchedUser?.email || update.userEmail || '',
            role: matchedUser?.role || 'EMPLOYEE',
            department: matchedUser?.department || '',
            designation: matchedUser?.designation || '',
            isActive: matchedUser?.isActive ?? true,
          } as User,
        ] as const;
      }),
      ...normalizedUsers.filter(u => submittedUserIds.has(u.id)).map(u => [u.id, u] as const),
    ].values()
  ).values());

  const pendingUsers = normalizedUsers.filter(u => !submittedUserIds.has(u.id)).filter(u => !submittedUpdates.some(update => {
    const sameUser = u.id === update.userId;
    const sameName = !!update.userName && (u.fullName === update.userName || u.email === update.userName);
    const sameEmail = !!update.userEmail && u.email === update.userEmail;
    return sameUser || sameName || sameEmail;
  }));

  const list = kind === 'submitted' ? Array.from(submittedUsers) : pendingUsers;

  const updateFor = (userId: string) => displayUpdates.find(u => u.userId === userId) || submittedUpdates.find(u => u.userId === userId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col h-[600px] max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              kind === 'submitted'
                ? 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                : 'bg-rose-500/20 border-rose-500/30 text-rose-400'
            }`}>
              {kind === 'submitted' ? <Sun className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                {kind === 'submitted'
                  ? (isMorning ? 'Morning Update Submissions' : 'Evening Update Submissions')
                  : (isMorning ? 'Pending Morning Updates' : 'Pending Evening Updates')}
              </h3>
              <p className="text-xs text-slate-400">
                {today} • {list.length} of {users.length} employees {kind === 'submitted'
                  ? (isMorning ? 'submitted morning updates' : 'submitted evening updates')
                  : 'yet to submit'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-950/40">
          {list.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
              {kind === 'submitted' ? (
                <CheckCircle2 className="w-10 h-10 text-emerald-500/50" />
              ) : (
                <CheckCircle2 className="w-10 h-10 text-emerald-500/50" />
              )}
              <p className="text-sm font-medium">
                {kind === 'submitted' ? 'No submissions yet today.' : 'Everyone has submitted today.'}
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 font-semibold border-b border-slate-800 uppercase text-[10px] sticky top-0 bg-slate-950/90">
                <tr>
                  <th className="p-3">Employee</th>
                  {kind === 'submitted' ? (
                    <>
                      <th className="p-3">{isMorning ? 'Morning Plan' : 'Evening Work'}</th>
                      <th className="p-3">{isMorning ? 'Est. Hrs' : 'Actual Hrs'}</th>
                      <th className="p-3">Submitted</th>
                    </>
                  ) : (
                    <>
                      <th className="p-3">Department</th>
                      <th className="p-3">Designation</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {list.map(u => {
                  const update = updateFor(u.id);
                  return (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3">
                        <div className="font-semibold text-white">{u.fullName}</div>
                        <div className="text-[10px] text-slate-500">{u.email}</div>
                      </td>
                      {kind === 'submitted' ? (
                        <>
                          <td className="p-3 max-w-xs">
                            {isMorning ? (update?.morningPlannedWork || '—') : (update?.eveningCompletedWork || '—')}
                          </td>
                          <td className="p-3 font-semibold text-white">
                            {isMorning
                              ? (update?.morningEstHours ? `${update.morningEstHours}h` : '—')
                              : (update?.eveningHoursSpent ? `${update.eveningHoursSpent}h` : '—')}
                          </td>
                          <td className="p-3">
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              {isMorning ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
                              <span>{fmtTime(isMorning ? update?.morningSubmittedAt : update?.eveningSubmittedAt)}</span>
                            </span>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-3 text-slate-400">{u.department || '—'}</td>
                          <td className="p-3 text-slate-400">{u.designation || '—'}</td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="px-6 py-3 bg-slate-900/90 border-t border-slate-800 text-[11px] text-slate-400 flex items-center space-x-1.5">
          <Moon className="w-3.5 h-3.5 text-blue-400" />
          <span>{isMorning ? 'Morning' : 'Evening'} submissions for today only. Updates refresh automatically every 30s.</span>
        </div>
      </div>
    </div>
  );
};
