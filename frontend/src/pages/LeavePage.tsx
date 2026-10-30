import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { FileText, Plus, CheckCircle, XCircle, Clock, Home, Building2, Plane, Users, CalendarDays, Loader2, UserCircle2, Trash2, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { LeaveRequestModal } from '../components/LeaveRequestModal';
import { LeaveUsersModal } from '../components/LeaveUsersModal';
import * as api from '../api';
import { todayIST, todayStr } from '../utils/date';
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

export const LeavePage: React.FC<{ viewMode?: 'requests' | 'calendar' }> = ({ viewMode }) => {
  const { leaveRequests, leaveBalance, currentUser, users, projects, holidays, reviewLeaveRequest, deleteLeaveRequest, loading } = useApp();
  const { token } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);
  const [todayData, setTodayData] = useState<{ onLeaveToday: LeaveRequest[]; requestsToday: LeaveRequest[] } | null>(null);
  const [todayLoading, setTodayLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  // Use viewMode prop if provided, otherwise default to 'requests' and allow switching
  const [activeTab, setActiveTab] = useState<'requests' | 'calendar'>(viewMode || 'requests');
  const [calendarMonth, setCalendarMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedLeaveUserId, setSelectedLeaveUserId] = useState<string | undefined>(undefined);
  const [selectedLeaveDate, setSelectedLeaveDate] = useState<string | undefined>(undefined);
  const [editLeaveRequest, setEditLeaveRequest] = useState<LeaveRequest | null>(null);

  const openApplyModal = (userId?: string, date?: string) => {
    setSelectedLeaveUserId(userId);
    setSelectedLeaveDate(date);
    setEditLeaveRequest(null);
    setIsModalOpen(true);
  };

  const openEditModal = (req: LeaveRequest) => {
    setEditLeaveRequest(req);
    setSelectedLeaveUserId(req.userId);
    setSelectedLeaveDate(req.startDate);
    setIsModalOpen(true);
  };

  const isAdmin = currentUser.role === 'ADMIN';
  // If viewMode is forced, override activeTab
  const currentView = viewMode || activeTab;

  // Calendar utilities (defined before hooks so they can be used in useMemo)
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getDayOfWeek = (year: number, month: number, day: number) => {
    return new Date(year, month, day).getDay(); // 0 = Sunday, 6 = Saturday
  };

  const parseCalendarMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-').map(Number);
    return { year, month: month - 1 };
  };

  const { year: calYear, month: calMonth } = parseCalendarMonth(calendarMonth);
  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const dates = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const currentTodayStr = todayIST ? todayIST() : todayStr();

  // All hooks must be called unconditionally at the top
  // Get active users for calendar rows (filtered by project if selected)
  const activeUsers = useMemo(() => {
    let filtered = (users || []).filter(u => u.isActive);
    if (selectedProjectId) {
      const project = projects.find(p => p.id === selectedProjectId);
      if (project) {
        const projectUserIds = new Set(project.assignedUsers.map(u => u.id));
        filtered = filtered.filter(u => projectUserIds.has(u.id));
      }
    }
    return filtered;
  }, [users, projects, selectedProjectId]);

  // Build leave map for quick lookup: userId -> date -> leave info
  const leaveMap = useMemo(() => {
    const map: Record<string, Record<string, { type: 'LEAVE' | 'WFH' | 'WFBO'; status: string }>> = {};
    (leaveRequests || [])
      .filter(r => r.status === 'APPROVED')
      .forEach(req => {
        const start = new Date(req.startDate);
        const end = new Date(req.endDate);
        const userMap = map[req.userId] || (map[req.userId] = {});
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          userMap[dateStr] = { type: req.requestType as 'LEAVE' | 'WFH' | 'WFBO', status: req.status };
        }
      });
    return map;
  }, [leaveRequests]);

  // Build holiday map: date -> holiday name
  const holidayMap = useMemo(() => {
    const map: Record<string, string> = {};
    (holidays || []).forEach(h => {
      map[h.date] = h.name;
    });
    return map;
  }, [holidays]);

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

  const userRequests = isAdmin
    ? leaveRequests
    : leaveRequests.filter(r => r.userId === currentUser.id);

  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  const getCellStatus = (userId: string, date: number) => {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    const dayOfWeek = getDayOfWeek(calYear, calMonth, date);
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    const leaveInfo = leaveMap[userId]?.[dateStr];
    const holidayName = holidayMap[dateStr];
    
    if (holidayName) return { type: 'HOLIDAY', label: holidayName };
    if (leaveInfo) return { type: leaveInfo.type, label: leaveInfo.type };
    if (isWeekend) return { type: 'WEEKEND', label: 'Weekend' };
    return { type: 'WORK', label: 'Work' };
  };

  const getCellColor = (status: ReturnType<typeof getCellStatus>) => {
    switch (status.type) {
      case 'WEEKEND': return 'bg-emerald-500/30 border-emerald-500/50 text-emerald-300';
      case 'LEAVE': return 'bg-rose-500/30 border-rose-500/50 text-rose-300';
      case 'WFH': return 'bg-amber-500/30 border-amber-500/50 text-amber-300';
      case 'WFBO': return 'bg-sky-500/30 border-sky-500/50 text-sky-300';
      case 'HOLIDAY': return 'bg-purple-500/30 border-purple-500/50 text-purple-300';
      default: return 'bg-slate-800/50 border-slate-700 text-slate-500';
    }
  };

  const getCellLabel = (status: ReturnType<typeof getCellStatus>, dayOfWeek?: number) => {
    switch (status.type) {
      case 'WEEKEND':
        return dayOfWeek === 0 ? 'Sun' : 'Sat';
      case 'LEAVE': return 'L';
      case 'WFH': return 'WFH';
      case 'WFBO': return 'O';
      case 'HOLIDAY': return 'SH';
      default: return '';
    }
  };

  const formatMonthYear = (monthStr: string) => {
    const [year, month] = monthStr.split('-').map(Number);
    return new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
  };

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
              : 'Apply for leave or work from home.'}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {isAdmin && !viewMode && (
            <div className="flex items-center space-x-1 bg-slate-800/60 border border-slate-700 rounded-xl p-1 mr-2">
              <button
                onClick={() => setActiveTab('requests')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  currentView === 'requests'
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setActiveTab('calendar')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  currentView === 'calendar'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
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
            onClick={() => openApplyModal()}
            className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold flex items-center space-x-2 shadow-lg shadow-orange-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span>{isAdmin ? 'Add / Apply Leave' : 'Apply Request'}</span>
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
        currentView === 'calendar' ? (
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            <div className="px-5 py-4 bg-slate-800/60 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-purple-400" />
                <h3 className="font-semibold text-sm text-white">Leave Calendar</h3>
              </div>
              <div className="flex items-center space-x-2">
                {/* Project Filter Dropdown */}
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 min-w-[180px]"
                >
                  <option value="">All Projects</option>
                  {(projects || []).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    const [y, m] = calendarMonth.split('-').map(Number);
                    const prev = new Date(y, m - 2, 1);
                    setCalendarMonth(`${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    const now = new Date();
                    setCalendarMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
                  }}
                  className="text-sm font-semibold text-white min-w-[160px] text-center hover:text-blue-300 transition"
                  title="Click to jump to current month"
                >
                  {formatMonthYear(calendarMonth)}
                </button>
                <button
                  onClick={() => {
                    const [y, m] = calendarMonth.split('-').map(Number);
                    const next = new Date(y, m, 1);
                    setCalendarMonth(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
                  aria-label="Next month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="overflow-auto max-h-[calc(100vh-270px)] min-h-[350px]">
              <table className="w-full min-w-max text-left text-xs border-separate border-spacing-0">
                <thead className="sticky top-0 z-20">
                  <tr>
                    <th className="p-3 sticky top-0 left-0 z-30 bg-slate-900 border-b-2 border-r border-slate-800 w-44 min-w-[170px] uppercase text-[10px] font-semibold text-slate-400 shadow-sm">
                      Employee
                    </th>
                    {dates.map(day => {
                      const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const isToday = dateStr === currentTodayStr;
                      const dayOfWeek = getDayOfWeek(calYear, calMonth, day);
                      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                      return (
                        <th
                          key={day}
                          className={`p-2 text-center min-w-[38px] max-w-[38px] font-mono sticky top-0 z-20 border-b-2 border-slate-800 ${
                            isToday
                              ? 'bg-blue-900/90 text-blue-100 border-x-2 border-x-blue-400 shadow-sm'
                              : isWeekend
                              ? 'bg-slate-900 text-slate-400 border-r border-slate-800/60'
                              : 'bg-slate-900 text-slate-400 border-r border-slate-800/60'
                          }`}
                        >
                          <div className={`font-bold ${isToday ? 'text-blue-100 bg-blue-500/40 rounded px-1 py-0.5' : ''}`}>
                            {day}
                          </div>
                          <div className={`text-[9px] ${isToday ? 'text-blue-300 font-bold' : isWeekend ? 'text-violet-400/80' : 'text-slate-500'}`}>
                            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dayOfWeek]}
                          </div>
                          {isToday && (
                            <div className="text-[8px] font-extrabold uppercase tracking-tight text-blue-300 mt-0.5">
                              Today
                            </div>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  {activeUsers.length === 0 ? (
                    <tr>
                      <td colSpan={dates.length + 1} className="p-8 text-center text-slate-500">
                        No active users found.
                      </td>
                    </tr>
                  ) : (
                    activeUsers.map(user => (
                      <tr key={user.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3 sticky left-0 z-10 bg-slate-900 border-b border-r border-slate-800 w-44 min-w-[170px] font-semibold text-white truncate shadow-sm">
                          <div className="flex items-center justify-between">
                            <span className="truncate">{user.fullName}</span>
                            {isAdmin && (
                              <button
                                onClick={() => openApplyModal(user.id)}
                                className="text-[10px] text-orange-400 hover:text-orange-300 font-semibold bg-orange-500/10 hover:bg-orange-500/20 px-1.5 py-0.5 rounded border border-orange-500/30 transition ml-1 shrink-0"
                                title={`Add leave for ${user.fullName}`}
                              >
                                + Leave
                              </button>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">{user.email}</div>
                        </td>
                        {dates.map(day => {
                          const status = getCellStatus(user.id, day);
                          const dayOfWeek = getDayOfWeek(calYear, calMonth, day);
                          const color = getCellColor(status);
                          const label = getCellLabel(status, dayOfWeek);
                          const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          const isToday = dateStr === currentTodayStr;
                          const holidayName = holidayMap[dateStr];
                          const canEdit = isAdmin || user.id === currentUser.id;
                          const existingReq = leaveRequests.find(
                            r => r.userId === user.id && r.startDate <= dateStr && r.endDate >= dateStr
                          );
                          return (
                            <td
                              key={day}
                              onClick={() => {
                                if (canEdit) {
                                  if (existingReq) {
                                    openEditModal(existingReq);
                                  } else {
                                    openApplyModal(user.id, dateStr);
                                  }
                                }
                              }}
                              className={`p-1 text-center min-w-[38px] max-w-[38px] border-b border-slate-800/60 ${
                                isToday
                                  ? 'bg-blue-500/15 border-x-2 border-x-blue-400/40'
                                  : 'border-r border-slate-800/40'
                              } ${canEdit ? 'cursor-pointer hover:bg-slate-700/40' : ''}`}
                            >
                              <div
                                className={`${color} border h-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all hover:scale-[1.05] ${
                                  canEdit ? 'cursor-pointer' : 'cursor-default'
                                } ${
                                  isToday ? 'ring-1 ring-blue-400/50 shadow-sm' : ''
                                }`}
                                title={
                                  canEdit
                                    ? existingReq
                                      ? `Click to update ${existingReq.requestType} for ${user.fullName} on ${dateStr}`
                                      : `Click to record leave/WFH for ${user.fullName} on ${dateStr}`
                                    : status.type === 'HOLIDAY'
                                    ? holidayName
                                    : `${status.label} (${user.fullName})`
                                }
                              >
                                {label}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Legend */}
            <div className="px-5 py-4 bg-slate-800/60 border-t border-slate-700 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-4 text-xs">
                <span className="text-slate-400">Legend:</span>
                <div className="flex items-center space-x-1">
                  <div className="w-5 h-5 rounded-lg bg-emerald-500/30 border border-emerald-500/50" />
                  <span className="text-emerald-300">Weekend</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-5 h-5 rounded-lg bg-rose-500/30 border border-rose-500/50" />
                  <span className="text-rose-300">Leave</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-5 h-5 rounded-lg bg-amber-500/30 border border-amber-500/50" />
                  <span className="text-amber-300">WFH</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-5 h-5 rounded-lg bg-purple-500/30 border border-purple-500/50" />
                  <span className="text-purple-300">Sierra Holiday (SH)</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-5 h-5 rounded-lg bg-blue-500/20 border-2 border-blue-400" />
                  <span className="text-blue-300">Today</span>
                </div>
              </div>
              <div className="text-[10px] text-slate-500">
                L = Leave | WFH = WFH | SH = Sierra Holiday
              </div>
            </div>
          </div>
        ) : (
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
                          <div className="flex justify-end space-x-2">
                            {req.status === 'PENDING' ? (
                              <>
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
                              </>
                            ) : (
                              <span className="text-[10px] text-slate-500">Processed</span>
                            )}
                            <button
                              onClick={async () => {
                                if (window.confirm(`Delete leave request for ${req.userName}?`)) {
                                  await deleteLeaveRequest(req.id);
                                  fetchToday();
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                              title="Delete leave request"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

           {/* Admin: Pending Leave Requests by Month */}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            <div className="px-5 py-4 bg-slate-800/60 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-rose-400" />
                <h3 className="font-semibold text-sm text-white">Pending Requests</h3>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {(() => {
                    const pendingFiltered = leaveRequests.filter(r => {
                      if (r.status !== 'PENDING') return false;
                      if (todayData?.requestsToday.some(td => td.id === r.id)) return false;
                      if (!selectedMonth) return true;
                      const reqDate = new Date(r.createdAt);
                      const reqMonth = `${reqDate.getFullYear()}-${String(reqDate.getMonth() + 1).padStart(2, '0')}`;
                      return reqMonth === selectedMonth;
                    });
                    return pendingFiltered.length ?? 0;
                  })()} PENDING
                </span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
                >
                  <option value="">All Months</option>
                  {(() => {
                    const months = new Set<string>();
                    leaveRequests.forEach(r => {
                      if (r.createdAt) {
                        const d = new Date(r.createdAt);
                        months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
                      }
                    });
                    return Array.from(months).sort((a, b) => b.localeCompare(a)).map(m => {
                      const [y, mo] = m.split('-');
                      const date = new Date(parseInt(y), parseInt(mo) - 1);
                      return (
                        <option key={m} value={m}>
                          {date.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </option>
                      );
                    });
                  })()}
                </select>
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
                    <th className="p-4">Submitted</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {(() => {
                    const pendingPrevious = leaveRequests.filter(r => {
                      if (r.status !== 'PENDING') return false;
                      if (todayData?.requestsToday.some(td => td.id === r.id)) return false;
                      if (!selectedMonth) return true;
                      const reqDate = new Date(r.createdAt);
                      const reqMonth = `${reqDate.getFullYear()}-${String(reqDate.getMonth() + 1).padStart(2, '0')}`;
                      return reqMonth === selectedMonth;
                    });
                    if (pendingPrevious.length === 0) {
                      return (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500">
                            No pending requests for selected month.
                          </td>
                        </tr>
                      );
                    }
                    return pendingPrevious.map(req => (
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
                          {req.startDate} &rarr; {req.endDate}
                        </td>
                        <td className="p-4 max-w-xs truncate" title={req.reason}>{req.reason}</td>
                        <td className="p-4 text-[10px] text-slate-400 font-mono">{req.createdAt ? new Date(req.createdAt).toLocaleDateString() : ''}</td>
                        <td className="p-4 text-right">
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
                            <button
                              onClick={async () => {
                                if (window.confirm(`Delete leave request for ${req.userName}?`)) {
                                  await deleteLeaveRequest(req.id);
                                  fetchToday();
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                              title="Delete leave request"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )) : (
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

      <LeaveRequestModal
        isOpen={isModalOpen}
        initialUserId={selectedLeaveUserId}
        initialDate={selectedLeaveDate}
        editLeave={editLeaveRequest}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedLeaveUserId(undefined);
          setSelectedLeaveDate(undefined);
          setEditLeaveRequest(null);
          if (isAdmin) fetchToday();
        }}
      />
      <LeaveUsersModal
        isOpen={isUsersModalOpen}
        onClose={() => setIsUsersModalOpen(false)}
        onAddLeave={(userId) => {
          setIsUsersModalOpen(false);
          openApplyModal(userId);
        }}
      />
    </div>
  );
};
