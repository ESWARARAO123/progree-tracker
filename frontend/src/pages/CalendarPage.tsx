import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Calendar as CalendarIcon, CalendarDays, PartyPopper, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { PlanMeetingModal } from '../components/PlanMeetingModal';
import { CompanyHolidayModal } from '../components/CompanyHolidayModal';
import { MeetingDetailModal } from '../components/MeetingDetailModal';
import { todayStr } from '../utils/date';
import type { Meeting } from '../types';

export const CalendarPage: React.FC = () => {
  const { updates, leaveRequests, meetings, holidays, currentUser, loading, deleteCompanyHoliday } = useApp();

  const [viewDate, setViewDate] = useState(() => new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const currentMonth = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isMeetingOpen, setIsMeetingOpen] = useState(false);
  const [isHolidayOpen, setIsHolidayOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);

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

      {/* Calendar Grid */}
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
            const canPlan = currentUser.role === 'ADMIN';
            const isSelected = selectedDay === day;
            const hasMeetings = status.dayMeetings.length > 0;

            const baseStyle = status.isToday
              ? 'bg-slate-950 border-cyan-400/60 text-white ring-2 ring-cyan-500/20'
              : status.holiday
              ? 'bg-teal-950/40 border-teal-500/40 text-teal-300'
              : hasMeetings
              ? 'bg-indigo-950/50 border-indigo-500/60 text-indigo-200 ring-1 ring-indigo-500/30 shadow-lg shadow-indigo-500/10'
              : status.isWeekend
              ? 'bg-violet-950/25 border-violet-500/25 text-violet-300/70'
              : 'bg-slate-900/60 border-slate-800 text-slate-200 hover:border-slate-700';

            return (
              <div
                key={day}
                className={`relative min-h-[90px] p-2 rounded-xl border flex flex-col justify-between transition ${baseStyle} ${canPlan ? 'cursor-pointer hover:border-indigo-500/50' : ''}`}
                onClick={() => canPlan && setSelectedDay(isSelected ? null : day)}
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
                      {currentUser.role === 'ADMIN' && (
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
                </div>

                <div className="text-[9px] text-slate-400">
                  {!status.isWeekend && !status.holiday && 'Working Day'}
                </div>

                {canPlan && isSelected && (
                  <div className="absolute inset-x-1.5 top-9 z-10 bg-slate-800 border border-indigo-500/40 rounded-xl shadow-2xl p-2 space-y-1.5">
                    <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider px-1">{dateStrFor(day)}</div>
                    <button
                      onClick={e => { e.stopPropagation(); setIsMeetingOpen(true); }}
                      className="w-full flex items-center justify-center space-x-1.5 px-2 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-semibold transition"
                    >
                      <CalendarDays className="w-3 h-3" />
                      <span>Plan Meeting</span>
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setIsHolidayOpen(true); }}
                      className="w-full flex items-center justify-center space-x-1.5 px-2 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-[10px] font-semibold transition"
                    >
                      <PartyPopper className="w-3 h-3" />
                      <span>Add Company Holiday</span>
                    </button>
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
    </div>
  );
};
