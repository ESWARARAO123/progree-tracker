import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { FileText, Plus, CheckCircle, XCircle, Clock, Home, Building2, Plane, Users, CalendarDays, Loader2, UserCircle2 } from 'lucide-react';
import { LeaveRequestModal } from '../components/LeaveRequestModal';
import { LeaveUsersModal } from '../components/LeaveUsersModal';
import * as api from '../api';
import type { LeaveRequest } from '../types';

const TYPE_META: Record<string, { label: string; badge: string; icon: React.ReactNode }> = {
  LEAVE: {
    label: 'Leave',
    badge: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
    icon: <Plane className="w-3 h-3" />,
  },
  WFH: {
    label: 'Work From Home',
    badge: 'bg-violet-500/20 text-violet-300 border border-violet-500/30',
    icon: <Home className="w-3 h-3" />,
  },
  WFBO: {
    label: 'Work From Bellandur Office',
    badge: 'bg-sky-500/20 text-sky-300 border border-sky-500/30',
    icon: <Building2 className="w-3 h-3" />,
  },
};

function mapLeave(l: any): LeaveRequest {
  return {
    id: l.id,
    userId: l.user_id || l.userId,
    userName: l.user_name || l.userName || '',
    userEmail: l.user_email || l.userEmail || '',
    requestType: l.request_type || l.requestType,
    startDate: l.start_date || l.startDate,
    endDate: l.end_date || l.endDate,
    reason: l.reason,
    status: l.status,
    reviewedBy: l.reviewed_by || l.reviewedBy || '',
    adminComment: l.admin_comment || l.adminComment,
    createdAt: l.created_at || l.createdAt || '',
  };
}

export const LeavePage: React.FC = () => {
  const { leaveRequests, leaveBalance, currentUser, reviewLeaveRequest, loading } = useApp();
  const { token } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);
  const [todayData, setTodayData] = useState<{ onLeaveToday: LeaveRequest[]; requestsToday: LeaveRequest[] } | null>(null);
  const [todayLoading, setTodayLoading] = useState(false);

  const isAdmin = currentUser.role === 'ADMIN';

  const fetchToday = async () => {
    if (!token || !isAdmin) return;
    try {
      setTodayLoading(true);
      const res = await api.getAdminTodayLeave(token);
      setTodayData({
        onLeaveToday: (res.on_leave_today || []).map(mapLeave),
        requestsToday: (res.requests_today || []).map(mapLeave),
      });
    } catch (err) {
      console.error('Failed to load today leave data:', err);
    } finally {
      setTodayLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchToday();
      const interval = setInterval(fetchToday, 30000);
      return () => clearInterval(interval);
    }
  }, [isAdmin, token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  const userRequests = isAdmin
    ? leaveRequests
    : leaveRequests.filter(r => r.userId === currentUser.id);

  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <FileText className="w-5 h-5 text-orange-400" />
            <span>{isAdmin ? 'Leave Portal' : 'Leave & Work Mode Requests'}</span>
          </h2>
          <p className="text-xs text-slate-400">
            {isAdmin
              ? `Manage who's on leave today and approve/reject requests submitted today (${today}).`
              : 'Apply for leave, work from home, or work from the Bellandur office.'}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {isAdmin && (
            <button
              onClick={() => setIsUsersModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center space-x-2 shadow-lg shadow-blue-600/30 transition"
            >
              <Users className="w-4 h-4" />
              <span>Users</span>
            </button>
          )}
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold flex items-center space-x-2 shadow-lg shadow-orange-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Apply Request</span>
          </button>
        </div>
      </div>

      {/* Leave Balance Cards (Employees only) */}
      {!isAdmin && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white">Used This Month</h3>
            <span className="text-xs text-slate-400">{leaveBalance?.month || 'This Month'}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-panel p-5 rounded-2xl border border-slate-800">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Leaves Used</p>
              <p className="text-3xl font-extrabold text-orange-400 mt-1">{leaveBalance?.usedLeave ?? 0}</p>
              <p className="text-[11px] text-slate-500 mt-1">Applied / approved this month</p>
            </div>
            <div className="glass-panel p-5 rounded-2xl border border-slate-800">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">WFH Used</p>
              <p className="text-3xl font-extrabold text-violet-400 mt-1">{leaveBalance?.usedWfh ?? 0}</p>
              <p className="text-[11px] text-slate-500 mt-1">Applied / approved this month</p>
            </div>
            <div className="glass-panel p-5 rounded-2xl border border-slate-800">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">WFBO Used</p>
              <p className="text-3xl font-extrabold text-sky-400 mt-1">{leaveBalance?.usedWfbo ?? 0}</p>
              <p className="text-[11px] text-slate-500 mt-1">Applied / approved this month</p>
            </div>
          </div>
        </div>
      )}

      {isAdmin ? (
        <>
          {/* Admin Today View: Who's On Leave Today */}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            <div className="px-5 py-4 bg-slate-800/60 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CalendarDays className="w-5 h-5 text-emerald-400" />
                <h3 className="font-semibold text-sm text-white">On Leave Today</h3>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {todayData?.onLeaveToday.length ?? 0} ON LEAVE
              </span>
            </div>
            <div className="p-5">
              {todayLoading && !todayData ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
                </div>
              ) : (todayData?.onLeaveToday.length ?? 0) === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">
                  <UserCircle2 className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-60" />
                  No one is on leave today.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {todayData!.onLeaveToday.map(r => (
                    <div key={r.id} className="flex items-center space-x-3 bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3">
                      <span className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-xs border border-emerald-500/30 shrink-0">
                        {r.userName.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-white truncate">{r.userName}</p>
                        <p className="text-[10px] text-slate-500">{r.startDate} → {r.endDate}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center space-x-1 shrink-0 ${TYPE_META[r.requestType]?.badge || 'bg-orange-500/20 text-orange-300 border border-orange-500/30'}`}>
                        {TYPE_META[r.requestType]?.icon}
                        <span>{TYPE_META[r.requestType]?.label || r.requestType}</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Admin Today View: Requests Submitted Today */}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            <div className="px-5 py-4 bg-slate-800/60 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <h3 className="font-semibold text-sm text-white">Requests Submitted Today</h3>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {todayData?.requestsToday.filter(r => r.status === 'PENDING').length ?? 0} PENDING
                </span>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-700 text-slate-300 border border-slate-600">
                  {todayData?.requestsToday.length ?? 0} TOTAL
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[10px]">
                  <tr>
                    <th className="p-4">Employee</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Dates</th>
                    <th className="p-4">Reason</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {todayLoading && !todayData ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center">
                        <Loader2 className="w-5 h-5 text-amber-500 animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : (todayData?.requestsToday.length ?? 0) === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        No requests were submitted today.
                      </td>
                    </tr>
                  ) : (
                    todayData!.requestsToday.map(req => (
                      <tr key={req.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-4 font-semibold text-white">
                          <div>{req.userName}</div>
                          <div className="text-[10px] text-slate-500">{req.userEmail}</div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center w-fit space-x-1 ${TYPE_META[req.requestType]?.badge || 'bg-orange-500/20 text-orange-300 border border-orange-500/30'}`}>
                            {TYPE_META[req.requestType]?.icon}
                            <span>{TYPE_META[req.requestType]?.label || req.requestType}</span>
                          </span>
                        </td>
                        <td className="p-4 font-mono text-[11px]">
                          {req.startDate} → {req.endDate}
                        </td>
                        <td className="p-4 max-w-xs truncate" title={req.reason}>{req.reason}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center w-fit space-x-1 ${
                            req.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                            req.status === 'REJECTED' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                            'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {req.status === 'APPROVED' && <CheckCircle className="w-3 h-3" />}
                            {req.status === 'REJECTED' && <XCircle className="w-3 h-3" />}
                            {req.status === 'PENDING' && <Clock className="w-3 h-3" />}
                            <span>{req.status}</span>
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {req.status === 'PENDING' ? (
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={async () => { await reviewLeaveRequest(req.id, 'APPROVED', 'Approved by Admin'); fetchToday(); }}
                                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[10px] transition"
                              >
                                Approve
                              </button>
                              <button
                                onClick={async () => { await reviewLeaveRequest(req.id, 'REJECTED', 'Capacity constraint'); fetchToday(); }}
                                className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-semibold text-[10px] transition"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-500">Processed</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Employee: Applications Table (their own) */
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-sm text-white">My Application Records</h3>
            <span className="text-xs text-slate-400">{userRequests.length} Total Applications</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[10px]">
                <tr>
                  <th className="p-4">Employee</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Dates</th>
                  <th className="p-4">Reason</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Admin Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {userRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No applications found.
                    </td>
                  </tr>
                ) : (
                  userRequests.map(req => (
                    <tr key={req.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-4 font-semibold text-white">
                        <div>{req.userName}</div>
                        <div className="text-[10px] text-slate-500">{req.userEmail}</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center w-fit space-x-1 ${TYPE_META[req.requestType]?.badge || 'bg-orange-500/20 text-orange-300 border border-orange-500/30'}`}>
                          {TYPE_META[req.requestType]?.icon}
                          <span>{TYPE_META[req.requestType]?.label || req.requestType}</span>
                        </span>
                      </td>
                      <td className="p-4 font-mono text-[11px]">
                        {req.startDate} → {req.endDate}
                      </td>
                      <td className="p-4 max-w-xs truncate" title={req.reason}>{req.reason}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center w-fit space-x-1 ${
                          req.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          req.status === 'REJECTED' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                          'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {req.status === 'APPROVED' && <CheckCircle className="w-3 h-3" />}
                          {req.status === 'REJECTED' && <XCircle className="w-3 h-3" />}
                          {req.status === 'PENDING' && <Clock className="w-3 h-3" />}
                          <span>{req.status}</span>
                        </span>
                      </td>
                      <td className="p-4 text-[11px] text-slate-400">
                        {req.reviewedBy ? (
                          <div>
                            <div className="text-white font-medium">By {req.reviewedBy}</div>
                            {req.adminComment && <div className="italic text-slate-400">"{req.adminComment}"</div>}
                          </div>
                        ) : (
                          <span className="text-slate-600">Pending Review</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <LeaveRequestModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <LeaveUsersModal isOpen={isUsersModalOpen} onClose={() => setIsUsersModalOpen(false)} />
    </div>
  );
};
