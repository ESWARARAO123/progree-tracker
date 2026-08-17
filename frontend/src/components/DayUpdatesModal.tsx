import React from 'react';
import { createPortal } from 'react-dom';
import { X, Sun, Moon, Calendar, CheckCircle, FileText } from 'lucide-react';
import type { User, DailyTaskUpdate } from '../types';

interface DayUpdatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  users: User[];
  updates: DailyTaskUpdate[];
  currentUser: User;
}

function fmtTime(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export const DayUpdatesModal: React.FC<DayUpdatesModalProps> = ({ isOpen, onClose, date, users, updates, currentUser }) => {
  if (!isOpen) return null;

  const dayUpdates = updates.filter(u => u.reportDate === date);
  const modalRoot = document.body;

  if (currentUser.role === 'ADMIN') {
    const nonAdminUsers = users.filter(u => u.role !== 'ADMIN');
    const submittedUsers = nonAdminUsers
      .filter(emp => dayUpdates.some(tu => tu.userId === emp.id && (tu.morningSubmittedAt || tu.eveningSubmittedAt)))
      .sort((a, b) => {
        const timeA = dayUpdates.find(tu => tu.userId === a.id)?.morningSubmittedAt || dayUpdates.find(tu => tu.userId === a.id)?.eveningSubmittedAt || '9999-99-99';
        const timeB = dayUpdates.find(tu => tu.userId === b.id)?.morningSubmittedAt || dayUpdates.find(tu => tu.userId === b.id)?.eveningSubmittedAt || '9999-99-99';
        return (timeA as string).localeCompare(timeB as string);
      });
    const notSubmittedUsers = nonAdminUsers.filter(emp => !dayUpdates.some(tu => tu.userId === emp.id && (tu.morningSubmittedAt || tu.eveningSubmittedAt)));
    const rows = [...submittedUsers, ...notSubmittedUsers];

    return createPortal((
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
        <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
          <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Daily Updates — {date}</h3>
                <p className="text-xs text-slate-400">
                  {submittedUsers.length} of {rows.length} employees submitted • {notSubmittedUsers.length} pending
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 font-semibold border-b border-slate-800 uppercase text-[10px] sticky top-0 bg-slate-950/90">
                <tr>
                  <th className="p-3">Employee</th>
                  <th className="p-3">Morning Update</th>
                  <th className="p-3">Morning Time</th>
                  <th className="p-3">Evening Update</th>
                  <th className="p-3">Evening Time</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {rows.map(emp => {
                  const update = dayUpdates.find(tu => tu.userId === emp.id);
                  const hasMorning = update?.morningSubmittedAt;
                  const hasEvening = update?.eveningSubmittedAt;
                  return (
                    <tr key={emp.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3">
                        <div className="font-semibold text-white">{emp.fullName}</div>
                        <div className="text-[10px] text-slate-500">{emp.email}</div>
                      </td>
                      <td className="p-3 max-w-[180px]">
                        {hasMorning ? (
                          <div className="space-y-0.5">
                            <p className="text-slate-200 line-clamp-2">{update.morningPlannedWork || '—'}</p>
                            {update.morningTaskTitle && <div className="text-[10px] text-emerald-400">Task: {update.morningTaskTitle}</div>}
                          </div>
                        ) : (
                          <span className="text-slate-600 italic">Not submitted</span>
                        )}
                      </td>
                      <td className="p-3">
                        {hasMorning ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            <Sun className="w-3 h-3" />
                            <span>{fmtTime(update.morningSubmittedAt)}</span>
                          </span>
                        ) : (
                          <span className="text-slate-600 italic text-[11px]">—</span>
                        )}
                      </td>
                      <td className="p-3 max-w-[180px]">
                        {hasEvening ? (
                          <div className="space-y-0.5">
                            <p className="text-slate-200 line-clamp-2">{update.eveningCompletedWork || '—'}</p>
                            {update.eveningNextDayPlan && <div className="text-[10px] text-blue-400">Next: {update.eveningNextDayPlan}</div>}
                          </div>
                        ) : (
                          <span className="text-slate-600 italic">Pending</span>
                        )}
                      </td>
                      <td className="p-3">
                        {hasEvening ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            <Moon className="w-3 h-3" />
                            <span>{fmtTime(update.eveningSubmittedAt)}</span>
                          </span>
                        ) : (
                          <span className="text-slate-600 italic text-[11px]">—</span>
                        )}
                      </td>
                      <td className="p-3">
                        {hasMorning && hasEvening ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle className="w-3 h-3 inline mr-1" /> COMPLETE
                          </span>
                        ) : hasMorning ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            MORNING ONLY
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                            NO UPDATE
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      ),
      modalRoot
    );
  }

  const myUpdate = dayUpdates.find(u => u.userId === currentUser.id);
  const hasMorning = myUpdate?.morningSubmittedAt;
  const hasEvening = myUpdate?.eveningSubmittedAt;

  return createPortal((
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">My Update — {date}</h3>
              <p className="text-xs text-slate-400">
                {hasMorning && hasEvening ? 'Complete' : hasMorning || hasEvening ? 'Partial' : 'No update submitted'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className={`p-4 rounded-xl border ${hasMorning ? 'bg-amber-950/20 border-amber-500/30' : 'bg-slate-900/60 border-slate-700'}`}>
            <div className="flex items-center space-x-2 mb-2">
              <Sun className={`w-4 h-4 ${hasMorning ? 'text-amber-400' : 'text-slate-500'}`} />
              <span className={`text-xs font-semibold ${hasMorning ? 'text-amber-300' : 'text-slate-400'}`}>Morning Update</span>
              {hasMorning && (
                <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {fmtTime(myUpdate.morningSubmittedAt)}
                </span>
              )}
            </div>
            {hasMorning ? (
              <div className="text-xs text-slate-300 space-y-1">
                <p>{myUpdate.morningPlannedWork || '—'}</p>
                {myUpdate.morningTaskTitle && <p className="text-[10px] text-emerald-400">Task: {myUpdate.morningTaskTitle}</p>}
                {myUpdate.morningBlockers && <p className="text-[10px] text-rose-400">Blocker: {myUpdate.morningBlockers}</p>}
                {myUpdate.morningEstHours != null && <p className="text-[10px] text-slate-500">Est. Hours: {myUpdate.morningEstHours} hrs</p>}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Not submitted</p>
            )}
          </div>

          <div className={`p-4 rounded-xl border ${hasEvening ? 'bg-blue-950/20 border-blue-500/30' : 'bg-slate-900/60 border-slate-700'}`}>
            <div className="flex items-center space-x-2 mb-2">
              <Moon className={`w-4 h-4 ${hasEvening ? 'text-blue-400' : 'text-slate-500'}`} />
              <span className={`text-xs font-semibold ${hasEvening ? 'text-blue-300' : 'text-slate-400'}`}>Evening Update</span>
              {hasEvening && (
                <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {fmtTime(myUpdate.eveningSubmittedAt)}
                </span>
              )}
            </div>
            {hasEvening ? (
              <div className="text-xs text-slate-300 space-y-1">
                <p>{myUpdate.eveningCompletedWork || '—'}</p>
                {myUpdate.eveningChallenges && <p className="text-[10px] text-amber-400">Challenges: {myUpdate.eveningChallenges}</p>}
                {myUpdate.eveningNextDayPlan && <p className="text-[10px] text-blue-400">Next: {myUpdate.eveningNextDayPlan}</p>}
                {myUpdate.eveningHoursSpent != null && <p className="text-[10px] text-slate-500">Hours: {myUpdate.eveningHoursSpent} hrs</p>}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Not submitted</p>
            )}
          </div>
        </div>
      </div>
    </div>
    ),
    modalRoot
  );
};