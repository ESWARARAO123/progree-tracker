import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Calendar as CalendarIcon, CalendarDays, PartyPopper, X, ChevronLeft, ChevronRight, FileCheck, Sun, Moon, CheckCircle, Calendar, XCircle } from 'lucide-react';
import { PlanMeetingModal } from '../components/PlanMeetingModal';
import { CompanyHolidayModal } from '../components/CompanyHolidayModal';
import { MeetingDetailModal } from '../components/MeetingDetailModal';
import { DayUpdatesModal } from '../components/DayUpdatesModal';
import { todayStr } from '../utils/date';
import type { Meeting } from '../types';

export const CalendarPage: React.FC = () => {
  const { updates, leaveRequests, meetings, holidays, users, currentUser, loading, deleteCompanyHoliday } = useApp();

  const [viewDate, setViewDate] = useState(() => new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const currentMonth = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isMeetingOpen, setIsMeetingOpen] = useState(false);
  const [isHolidayOpen, setIsHolidayOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [updatesDate, setUpdatesDate] = useState<string | null>(null);
  const [showUpdates, setShowUpdates] = useState(false);

  const goToPrevMonth = () => {
    setSelectedDay(null);
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setSelectedDay(null);
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setSelectedDay(null);
    setViewDate(new Date());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  const today = todayStr();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7;

  const dateStrFor = (day: number) =>
    `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

  const getDayStatus = (day: number) => {
    const dateStr = dateStrFor(day);
    const dayOfWeek = new Date(year, month, day).getDay();
    const holiday = holidays.find(h => h.date === dateStr);

    const userUpdate = updates.find(u => u.userId === currentUser.id && u.reportDate === dateStr);
    const userLeave = leaveRequests.find(l => l.userId === currentUser.id && dateStr >= l.startDate && dateStr <= l.endDate);

    return {
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      holiday,
      hasMorning: !!userUpdate?.morningSubmittedAt,
      hasEvening: !!userUpdate?.eveningSubmittedAt,
      approvedRequest: userLeave?.status === 'APPROVED' ? userLeave : undefined,
      isToday: dateStr === today,
      isFuture: dateStr > today,
      dayMeetings: meetings.filter(m => m.date === dateStr),
    };
  };

  const getDayUpdates = (day: number) => {
    const dateStr = dateStrFor(day);
    return updates.filter(u => u.reportDate === dateStr);
  };

  let totalWorkingDays = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const status = getDayStatus(d);
    if (!status.isWeekend && !status.holiday) {
      totalWorkingDays++;
    }
  }

  const blanks = Array.from({ length: firstDayOfWeek }, (_, i) => i);
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <CalendarIcon className="w-5 h-5 text-emerald-400" />
            <span>Interactive Attendance & Work Calendar</span>
          </h2>
          <p className="text-xs text-slate-400">Monthly view of daily updates, approved leaves, meetings, and official working days.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {currentUser.role === 'ADMIN' && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsMeetingOpen(true)}
                className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition"
              >
                <CalendarDays className="w-4 h-4" />
                <span>Plan Meeting</span>
              </button>
              <button
                onClick={() => setIsHolidayOpen(true)}
                className="flex items-center space-x-1.5 bg-teal-600 hover:bg-teal-500 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-teal-600/30 transition"
              >
                <PartyPopper className="w-4 h-4" />
                <span>Add Office Holiday</span>
              </button>
            </div>
          )}

          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <button
              onClick={goToPrevMonth}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goToToday}
              className="px-2.5 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
              title="Jump to current month"
            >
              {currentMonth}
            </button>
            <button
              onClick={goToNextMonth}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <span className="text-slate-500 hidden sm:inline">|</span>
          <span className="text-emerald-400 font-bold text-xs">{totalWorkingDays} Net Working Days</span>
        </div>
      </div>

      {/* Legend Ribbon */}
      <div className="glass-panel p-3 rounded-xl border border-slate-800 flex flex-wrap gap-4 text-xs text-slate-300">
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500" />
          <span>Morning Submitted</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-blue-500" />
          <span>Evening Submitted</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-orange-500" />
          <span>Approved Leave</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-violet-500" />
          <span>Approved WFH</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-sky-500" />
          <span>Approved WFBO</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-indigo-500" />
          <span>Meeting</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-emerald-400" />
          <span className="text-emerald-400 font-semibold">✓ Submitted</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-amber-400" />
          <span className="text-amber-400 font-semibold">⏳ Pending</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-violet-500/60" />
          <span>Weekend (Non-Working Day)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-teal-500" />
          <span>Company Holiday</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-slate-950 border border-cyan-400/60" />
          <span>Today</span>
        </div>
      </div>

      {/* Calendar Grid - Single Unified View */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-5 space-y-4">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 border-b border-slate-800 pb-3">
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div className="text-slate-500">Sat (Off)</div>
          <div className="text-slate-500">Sun (Off)</div>
        </div>

        {/* Days Matrix */}
        <div className="grid grid-cols-7 gap-2">
          {blanks.map(i => (
            <div key={`blank-${i}`} className="min-h-[90px]" />
          ))}

          {daysArray.map(day => {
            const status = getDayStatus(day);
            const dateStr = dateStrFor(day);
            const isAdmin = currentUser.role === 'ADMIN';
            const isPastDate = dateStr < today;
            const isSelected = selectedDay === day;
            const hasMeetings = status.dayMeetings.length > 0;

            // Admin: count unique employees with updates for this day
            const dayUpdates = getDayUpdates(day);
            const employeesWithUpdates = new Set(dayUpdates.filter(u => u.morningSubmittedAt || u.eveningSubmittedAt).map(u => u.userId));
            const submittedCount = employeesWithUpdates.size;
            const nonAdminUsers = users.filter(u => u.role !== 'ADMIN');
            const pendingCount = isAdmin ? nonAdminUsers.length - submittedCount : 0;

            const baseStyle = status.isToday
              ? 'bg-slate-950 border-cyan-400/60 text-white ring-2 ring-cyan-500/20'
              : status.holiday
              ? 'bg-teal-950/40 border-teal-500/40 text-teal-300'
              : hasMeetings
              ? 'bg-indigo-950/50 border-indigo-500/60 text-indigo-200 ring-1 ring-indigo-500/30 shadow-lg shadow-indigo-500/10'
              : isAdmin && isPastDate && (submittedCount > 0 || pendingCount > 0)
              ? (submittedCount === nonAdminUsers.length && submittedCount > 0
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                  : 'bg-amber-950/30 border-amber-500/40 text-amber-200')
              : status.isWeekend
              ? 'bg-violet-950/25 border-violet-500/25 text-violet-300/70'
              : 'bg-slate-900/60 border-slate-800 text-slate-200 hover:border-slate-700';

            return (
              <div
                key={day}
                className={`relative min-h-[100px] p-2 rounded-xl border flex flex-col justify-between transition ${baseStyle} ${isPastDate || isAdmin ? 'cursor-pointer hover:border-indigo-500/50' : ''}`}
                onClick={() => (isPastDate || isAdmin) && setSelectedDay(isSelected ? null : day)}
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs">{day}</span>
                  <div className="flex items-center space-x-1">
                    {status.isToday && (
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase tracking-wider">Today</span>
                    )}
                    {hasMeetings && !status.isToday && (
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 uppercase tracking-wider">Meeting</span>
                    )}
                    {status.isWeekend && <span className="text-[9px] font-semibold text-violet-400/80">Off</span>}
                  </div>
                </div>

                <div className="space-y-1 my-1">
                  {status.holiday && (
                    <span className="flex items-center space-x-1 text-[9px] font-bold bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded block truncate">
                      <span className="truncate">🎉 {status.holiday.name}</span>
                      {isAdmin && (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            if (confirm(`Remove "${status.holiday!.name}" from company holidays?`)) {
                              deleteCompanyHoliday(status.holiday!.id);
                            }
                          }}
                          className="text-teal-300/70 hover:text-rose-300 shrink-0"
                          title="Remove holiday"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  )}

                  {status.approvedRequest && (() => {
                    const rt = status.approvedRequest!.requestType;
                    if (rt === 'WFH') {
                      return (
                        <span className="text-[9px] font-bold bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded block">
                          🏠 WFH Approved
                        </span>
                      );
                    }
                    if (rt === 'WFBO') {
                      return (
                        <span className="text-[9px] font-bold bg-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded block">
                          🏢 WFBO Approved
                        </span>
                      );
                    }
                    return (
                      <span className="text-[9px] font-bold bg-orange-500/20 text-orange-300 px-1.5 py-0.5 rounded block">
                        🌴 On Leave
                      </span>
                    );
                  })()}

                  {status.dayMeetings.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedMeeting(m);
                      }}
                      className="flex items-center justify-between w-full text-[9px] font-bold bg-indigo-600/30 text-indigo-200 border border-indigo-500/50 px-1.5 py-1 rounded-md truncate shadow-sm hover:bg-indigo-600/40 transition"
                      title={`${m.title} at ${m.startTime}${m.endTime ? ' – ' + m.endTime : ''}`}
                    >
                      <span className="truncate">📅 {m.title}</span>
                      <span className="text-[8px] text-indigo-300 shrink-0 font-mono ml-1">({m.startTime}{m.endTime ? '–' + m.endTime : ''})</span>
                    </button>
                  ))}

                  <div className="flex space-x-1 pt-1">
                    {status.hasMorning && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400" title="Morning Update Submitted" />
                    )}
                    {status.hasEvening && (
                      <span className="w-2 h-2 rounded-full bg-blue-400" title="Evening Update Submitted" />
                    )}
                  </div>

                  {/* Admin: submitted/pending counts */}
                  {isAdmin && !status.isWeekend && !status.holiday && !status.isFuture && (
                    <div className="flex items-center justify-between text-[9px]">
                      <span className="text-emerald-400 font-semibold" title="Submitted">
                        {submittedCount} ✓
                      </span>
                      {pendingCount > 0 && (
                        <span className="text-amber-400 font-semibold" title="Pending">
                          {pendingCount} ⏳
                        </span>
                      )}
                    </div>
                  )}

                  <div className="text-[9px] text-slate-400">
                    {!status.isWeekend && !status.holiday && 'Working Day'}
                  </div>
                </div>

                {isSelected && (
                  <div className="absolute inset-x-1.5 top-9 z-10 bg-slate-800 border border-indigo-500/40 rounded-xl shadow-2xl p-2 space-y-1.5">
                    <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider px-1">{dateStrFor(day)}</div>
                    {isPastDate ? (
                      <>
                        {isAdmin ? (
                          <button
                            onClick={e => { e.stopPropagation(); setUpdatesDate(dateStrFor(day)); setShowUpdates(true); setSelectedDay(null); }}
                            className="w-full flex items-center justify-center space-x-1.5 px-2 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-semibold transition"
                          >
                            <Calendar className="w-3 h-3" />
                            <span>View All Updates</span>
                          </button>
                        ) : (
                          <button
                            onClick={e => { e.stopPropagation(); setUpdatesDate(dateStrFor(day)); setSelectedDay(null); }}
                            className="w-full flex items-center justify-center space-x-1.5 px-2 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-semibold transition"
                          >
                            <FileCheck className="w-3 h-3" />
                            <span>See My Update</span>
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        {isAdmin && (
                          <button
                            onClick={e => { e.stopPropagation(); setIsMeetingOpen(true); }}
                            className="w-full flex items-center justify-center space-x-1.5 px-2 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-semibold transition"
                          >
                            <CalendarDays className="w-3 h-3" />
                            <span>Plan Meeting</span>
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={e => { e.stopPropagation(); setIsHolidayOpen(true); }}
                            className="w-full flex items-center justify-center space-x-1.5 px-2 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-[10px] font-semibold transition"
                          >
                            <PartyPopper className="w-3 h-3" />
                            <span>Add Company Holiday</span>
                          </button>
                        )}
                      </>
                    )}
                    <button
                      onClick={e => { e.stopPropagation(); setSelectedDay(null); }}
                      className="w-full flex items-center justify-center space-x-1.5 px-2 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-[10px] font-semibold transition"
                    >
                      <X className="w-3 h-3" />
                      <span>Cancel</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <PlanMeetingModal
        isOpen={isMeetingOpen}
        onClose={() => { setIsMeetingOpen(false); setEditingMeeting(null); setSelectedDay(null); }}
        date={selectedDay !== null ? dateStrFor(selectedDay) : today}
        meeting={editingMeeting}
      />
      <MeetingDetailModal
        isOpen={!!selectedMeeting}
        onClose={() => setSelectedMeeting(null)}
        meeting={selectedMeeting!}
        onEdit={() => {
          setEditingMeeting(selectedMeeting);
          setSelectedMeeting(null);
          setIsMeetingOpen(true);
        }}
      />
      <CompanyHolidayModal
        isOpen={isHolidayOpen}
        onClose={() => { setIsHolidayOpen(false); setSelectedDay(null); }}
        date={selectedDay !== null ? dateStrFor(selectedDay) : today}
      />
      <DayUpdatesModal
        isOpen={updatesDate !== null}
        onClose={() => setUpdatesDate(null)}
        date={updatesDate || today}
        users={users}
        updates={updates}
        currentUser={currentUser}
      />

      {/* Admin Attendance Modal - All Users View */}
      {showUpdates && updatesDate && currentUser.role === 'ADMIN' && (() => {
        const dayUpdates = updates.filter(u => u.reportDate === updatesDate);
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

        const formatTime = (iso?: string): string => {
          if (!iso) return '—';
          return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        };

        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
              <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">
                      Updates for {new Date(updatesDate).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {submittedUsers.length} submitted • {notSubmittedUsers.length} pending
                    </p>
                  </div>
                </div>
                <button onClick={() => { setShowUpdates(false); setUpdatesDate(null); }} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 z-10 bg-slate-900/95 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[10px] tracking-wider backdrop-blur">
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
                            <div className="text-[10px] text-slate-600">{emp.department} • {emp.designation}</div>
                          </td>
                          <td className="p-3 max-w-xs">
                            {hasMorning ? (
                              <div className="space-y-1">
                                <p className="text-slate-200 line-clamp-2">{update.morningPlannedWork || '—'}</p>
                                {update.morningTaskTitle && <div className="text-[10px] text-emerald-400 font-medium">Task: {update.morningTaskTitle}</div>}
                                {update.morningBlockers && <div className="text-[10px] text-rose-400 font-semibold">Blocker: {update.morningBlockers}</div>}
                                {update.morningEstHours && <div className="text-[9px] text-slate-500">Est. Hours: {update.morningEstHours} hrs</div>}
                              </div>
                            ) : (
                              <span className="text-slate-600 italic">Not submitted</span>
                            )}
                          </td>
                          <td className="p-3">
                            {hasMorning ? (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                <Sun className="w-3 h-3" />
                                <span>{formatTime(update.morningSubmittedAt)}</span>
                              </span>
                            ) : (
                              <span className="text-slate-600 italic text-[11px]">—</span>
                            )}
                          </td>
                          <td className="p-3 max-w-xs">
                            {hasEvening ? (
                              <div className="space-y-1">
                                <p className="text-slate-200 line-clamp-2">{update.eveningCompletedWork || '—'}</p>
                                {update.eveningChallenges && <div className="text-[10px] text-amber-400">Challenges: {update.eveningChallenges}</div>}
                                {update.eveningNextDayPlan && <div className="text-[10px] text-blue-400">Next: {update.eveningNextDayPlan}</div>}
                                {update.eveningHoursSpent && <div className="text-[9px] text-slate-500">Hours: {update.eveningHoursSpent} hrs</div>}
                              </div>
                            ) : (
                              <span className="text-slate-600 italic">Pending</span>
                            )}
                          </td>
                          <td className="p-3">
                            {hasEvening ? (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                <Moon className="w-3 h-3" />
                                <span>{formatTime(update.eveningSubmittedAt)}</span>
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

              {dayUpdates.length === 0 && (
                <div className="p-8 text-center text-slate-500">
                  <p className="text-sm">No updates submitted on this date.</p>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
};