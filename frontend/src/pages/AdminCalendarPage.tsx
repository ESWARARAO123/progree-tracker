import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Sun, Moon, CheckCircle, XCircle, Calendar, CalendarDays, PartyPopper, FileCheck } from 'lucide-react';
import { todayStr } from '../utils/date';
import { PlanMeetingModal } from '../components/PlanMeetingModal';
import { CompanyHolidayModal } from '../components/CompanyHolidayModal';

export const AdminCalendarPage: React.FC = () => {
  const { users, updates, loading } = useApp();

  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showUpdates, setShowUpdates] = useState(false);
  const [isMeetingOpen, setIsMeetingOpen] = useState(false);
  const [isHolidayOpen, setIsHolidayOpen] = useState(false);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const currentMonth = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const goToPrevMonth = () => {
    setSelectedDate(null);
    setShowUpdates(false);
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setSelectedDate(null);
    setShowUpdates(false);
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setSelectedDate(null);
    setShowUpdates(false);
    setViewDate(new Date());
  };

  const selectedDayUpdates = useMemo(() => {
    if (!selectedDate) return [];
    return updates.filter(u => u.reportDate === selectedDate);
  }, [selectedDate, updates]);

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

  const getDayUpdates = (day: number) => {
    const dateStr = dateStrFor(day);
    return updates.filter(u => u.reportDate === dateStr);
  };

  const blanks = Array.from({ length: firstDayOfWeek }, (_, i) => i);
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getUserUpdateForDate = (userId: string, dateStr: string) => {
    return updates.find(u => u.userId === userId && u.reportDate === dateStr);
  };

  const formatTime = (iso?: string): string => {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <CalendarIcon className="w-5 h-5 text-emerald-400" />
            <span>Admin Calendar - Daily Updates History</span>
          </h2>
          <p className="text-xs text-slate-400">Click a previous date to view that day's updates, or today/future to plan meetings & holidays.</p>
        </div>

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
      </div>

      {/* Legend */}
      <div className="glass-panel p-3 rounded-xl border border-slate-800 flex flex-wrap gap-4 text-xs text-slate-300">
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-amber-400" />
          <span>Has Morning Update</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-blue-400" />
          <span>Has Evening Update</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-emerald-400" />
          <span>Both Submitted</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-slate-700 border border-slate-600" />
          <span>No Updates</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-slate-950 border border-cyan-400/60" />
          <span>Today</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-violet-950/25 border border-violet-500/25" />
          <span>Weekend</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-5 space-y-4">
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 border-b border-slate-800 pb-3">
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div className="text-slate-500">Sat</div>
          <div className="text-slate-500">Sun</div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {blanks.map(i => (
            <div key={`blank-${i}`} className="min-h-[90px]" />
          ))}

          {daysArray.map(day => {
            const dateStr = dateStrFor(day);
            const dayOfWeek = new Date(year, month, day).getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isToday = dateStr === today;
            const isPastDate = dateStr < today;
            const isSelected = selectedDate === dateStr;
            const dayUpdates = getDayUpdates(day);
            const hasMorning = dayUpdates.some(u => u.morningSubmittedAt);
            const hasEvening = dayUpdates.some(u => u.eveningSubmittedAt);

            let baseStyle = 'bg-slate-900/60 border-slate-800 text-slate-200';
            if (isToday) {
              baseStyle = 'bg-slate-950 border-cyan-400/60 text-white ring-2 ring-cyan-500/20';
            } else if (isSelected) {
              baseStyle = 'bg-indigo-950/50 border-indigo-500/60 text-indigo-200 ring-2 ring-indigo-500/30 shadow-lg shadow-indigo-500/10';
            } else if (hasMorning && hasEvening) {
              baseStyle = 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200';
            } else if (hasMorning || hasEvening) {
              baseStyle = 'bg-amber-950/30 border-amber-500/40 text-amber-200';
            } else if (isWeekend) {
              baseStyle = 'bg-violet-950/25 border-violet-500/25 text-violet-300/70';
            }

            return (
              <div
                key={day}
                className={`relative min-h-[90px] p-2 rounded-xl border flex flex-col justify-between transition cursor-pointer ${baseStyle} hover:border-indigo-500/50`}
                onClick={() => {
                  if (isSelected) {
                    setSelectedDate(null);
                    setShowUpdates(false);
                  } else {
                    setSelectedDate(dateStr);
                    setShowUpdates(false);
                  }
                }}
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs">{day}</span>
                  <div className="flex items-center space-x-1">
                    {isToday && (
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase tracking-wider">Today</span>
                    )}
                    {isWeekend && <span className="text-[9px] font-semibold text-violet-400/80">Off</span>}
                  </div>
                </div>

                <div className="space-y-1 my-1">
                  <div className="flex space-x-1 pt-1">
                    {hasMorning && (
                      <span className="w-2 h-2 rounded-full bg-amber-400" title="Morning updates submitted" />
                    )}
                    {hasEvening && (
                      <span className="w-2 h-2 rounded-full bg-blue-400" title="Evening updates submitted" />
                    )}
                    {!hasMorning && !hasEvening && !isWeekend && (
                      <span className="w-2 h-2 rounded-full bg-slate-700 border border-slate-600" title="No updates" />
                    )}
                  </div>
                  <div className="text-[9px] text-slate-400">
                    {dayUpdates.length > 0 && `${dayUpdates.length} update${dayUpdates.length > 1 ? 's' : ''}`}
                  </div>
                </div>

                <div className="text-[9px] text-slate-400">
                  {!isWeekend && 'Working Day'}
                </div>

                {isSelected && (
                  <div className="absolute inset-x-1.5 top-9 z-10 bg-slate-800 border border-indigo-500/40 rounded-xl shadow-2xl p-2 space-y-1.5">
                    <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider px-1">{dateStr}</div>
                    {isPastDate ? (
                      <button
                        onClick={e => { e.stopPropagation(); setShowUpdates(true); }}
                        className="w-full flex items-center justify-center space-x-1.5 px-2 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-semibold transition"
                      >
                        <FileCheck className="w-3 h-3" />
                        <span>See Updates</span>
                      </button>
                    ) : (
                      <>
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
                      </>
                    )}
                    <button
                      onClick={e => { e.stopPropagation(); setSelectedDate(null); setShowUpdates(false); }}
                      className="w-full flex items-center justify-center space-x-1.5 px-2 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-[10px] font-semibold transition"
                    >
                      <XCircle className="w-3 h-3" />
                      <span>Cancel</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Date Details */}
      {selectedDate && showUpdates && (
        <div className="glass-panel rounded-2xl border border-slate-800 p-5 space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">
                  Updates for {new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                </h3>
                <p className="text-xs text-slate-400">
                  {(() => {
                    const nonAdmin = users.filter(u => u.role !== 'ADMIN');
                    const submitted = nonAdmin.filter(emp => selectedDayUpdates.some(tu => tu.userId === emp.id && (tu.morningSubmittedAt || tu.eveningSubmittedAt))).length;
                    return `${submitted} submitted • ${nonAdmin.length - submitted} pending`;
                  })()}
                </p>
              </div>
            </div>
            <button
              onClick={() => { setSelectedDate(null); setShowUpdates(false); }}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-x-auto max-h-[520px] overflow-y-auto rounded-xl border border-slate-800">
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
                {(() => {
                  const nonAdminUsers = users.filter(u => u.role !== 'ADMIN');
                  const submittedUsers = nonAdminUsers
                    .filter(emp => selectedDayUpdates.some(tu => tu.userId === emp.id && (tu.morningSubmittedAt || tu.eveningSubmittedAt)))
                    .sort((a, b) => {
                      const timeA = selectedDayUpdates.find(tu => tu.userId === a.id)?.morningSubmittedAt || selectedDayUpdates.find(tu => tu.userId === a.id)?.eveningSubmittedAt || '9999-99-99';
                      const timeB = selectedDayUpdates.find(tu => tu.userId === b.id)?.morningSubmittedAt || selectedDayUpdates.find(tu => tu.userId === b.id)?.eveningSubmittedAt || '9999-99-99';
                      return (timeA as string).localeCompare(timeB as string);
                    });
                  const notSubmittedUsers = nonAdminUsers.filter(emp => !selectedDayUpdates.some(tu => tu.userId === emp.id && (tu.morningSubmittedAt || tu.eveningSubmittedAt)));
                  const rows = [...submittedUsers, ...notSubmittedUsers];

                  return rows.map(emp => {
                    const update = getUserUpdateForDate(emp.id, selectedDate);
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
                              {update.morningTaskTitle && (
                                <div className="text-[10px] text-emerald-400 font-medium">Task: {update.morningTaskTitle}</div>
                              )}
                              {update.morningBlockers && (
                                <div className="text-[10px] text-rose-400 font-semibold">Blocker: {update.morningBlockers}</div>
                              )}
                              {update.morningEstHours && (
                                <div className="text-[9px] text-slate-500">Est. Hours: {update.morningEstHours} hrs</div>
                              )}
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
                              {update.eveningChallenges && (
                                <div className="text-[10px] text-amber-400">Challenges: {update.eveningChallenges}</div>
                              )}
                              {update.eveningNextDayPlan && (
                                <div className="text-[10px] text-blue-400">Next: {update.eveningNextDayPlan}</div>
                              )}
                              {update.eveningHoursSpent && (
                                <div className="text-[9px] text-slate-500">Hours: {update.eveningHoursSpent} hrs</div>
                              )}
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
                  });
                })()}
              </tbody>
            </table>
          </div>

          {selectedDayUpdates.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <p className="text-sm">No updates submitted on this date.</p>
            </div>
          )}
        </div>
      )}

      <PlanMeetingModal
        isOpen={isMeetingOpen}
        onClose={() => { setIsMeetingOpen(false); setSelectedDate(null); setShowUpdates(false); }}
        date={selectedDate || today}
      />
      <CompanyHolidayModal
        isOpen={isHolidayOpen}
        onClose={() => { setIsHolidayOpen(false); setSelectedDate(null); setShowUpdates(false); }}
        date={selectedDate || today}
      />
    </div>
  );
};