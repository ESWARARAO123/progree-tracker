import React, { useState, useEffect } from 'react';
import { X, Users, ChevronLeft, ChevronRight, Loader2, Plane, Home, Building2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import * as api from '../api';
import type { UserLeaveUsage } from '../types';

interface LeaveUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function fmtMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[m - 1]} ${y}`;
}

function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export const LeaveUsersModal: React.FC<LeaveUsersModalProps> = ({ isOpen, onClose }) => {
  const { token } = useAuth();
  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const [month, setMonth] = useState(currentMonth);
  const [usage, setUsage] = useState<UserLeaveUsage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMonth(currentMonth);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !token) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await api.getAdminUsersUsage(token, month);
        if (cancelled) return;
        const mapped: UserLeaveUsage[] = (res || []).map((u: any) => ({
          userId: u.user_id,
          userName: u.user_name,
          userEmail: u.user_email,
          department: u.department,
          designation: u.designation,
          isActive: u.is_active,
          usedLeave: u.used_leave ?? 0,
          usedWfh: u.used_wfh ?? 0,
          usedWfbo: u.used_wfbo ?? 0,
          total: u.total ?? 0,
        }));
        setUsage(mapped);
      } catch (err) {
        console.error('Failed to load user leave usage:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isOpen, month, token]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col h-[650px] max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Team Leave Usage</h3>
              <p className="text-xs text-slate-400">All users and their requests used in the selected month</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Month Navigator */}
        <div className="px-6 py-3 bg-slate-800/40 border-b border-slate-800 flex items-center justify-between">
          <button
            onClick={() => setMonth(shiftMonth(month, -1))}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold text-white">{fmtMonth(month)}</span>
          <button
            onClick={() => setMonth(shiftMonth(month, 1))}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Usage Table */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950/40">
          {loading && usage.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            </div>
          ) : usage.length === 0 ? (
            <div className="text-center py-16 text-slate-500 space-y-2">
              <Users className="w-10 h-10 mx-auto text-slate-600 opacity-60" />
              <p className="text-sm font-medium">No employees found.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 font-semibold border-b border-slate-800 uppercase text-[10px] sticky top-0 bg-slate-950/90">
                <tr>
                  <th className="p-3">Employee</th>
                  <th className="p-3">Department</th>
                  <th className="p-3 text-center">
                    <span className="inline-flex items-center space-x-1"><Plane className="w-3 h-3 text-orange-400" /><span>Leave</span></span>
                  </th>
                  <th className="p-3 text-center">
                    <span className="inline-flex items-center space-x-1"><Home className="w-3 h-3 text-violet-400" /><span>WFH</span></span>
                  </th>
                  <th className="p-3 text-center">
                    <span className="inline-flex items-center space-x-1"><Building2 className="w-3 h-3 text-sky-400" /><span>WFBO</span></span>
                  </th>
                  <th className="p-3 text-center">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {usage.map(u => (
                  <tr key={u.userId} className={`hover:bg-slate-800/40 transition ${!u.isActive ? 'opacity-50' : ''}`}>
                    <td className="p-3">
                      <div className="font-semibold text-white flex items-center space-x-1.5">
                        <span>{u.userName}</span>
                        {!u.isActive && (
                          <span className="inline-flex items-center space-x-0.5 text-[9px] text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded px-1 py-0.5">
                            <ShieldAlert className="w-2.5 h-2.5" />
                            <span>INACTIVE</span>
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500">{u.userEmail}</div>
                    </td>
                    <td className="p-3 text-slate-400">{u.department || '—'}</td>
                    <td className="p-3 text-center">
                      <span className="font-bold text-orange-300">{u.usedLeave}</span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="font-bold text-violet-300">{u.usedWfh}</span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="font-bold text-sky-300">{u.usedWfbo}</span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="font-bold text-white bg-slate-800 border border-slate-700 rounded-lg px-2 py-0.5">{u.total}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
