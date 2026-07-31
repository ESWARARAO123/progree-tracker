import React from 'react';
import { useApp } from '../context/AppContext';
import { Users, CheckCircle2, AlertTriangle, Briefcase, FileCheck, Sun, Moon, ArrowUpRight, TrendingUp, CalendarClock, Clock, ListTodo } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, Cell } from 'recharts';
import { todayStr, getDaysRemaining, getDeadlineColor, getTotalDays } from '../utils/date';

interface Props {
  openMorningModal: () => void;
  openEveningModal: () => void;
}

export const DashboardPage: React.FC<Props> = ({ openMorningModal, openEveningModal }) => {
  const { currentUser, users, projects, tasks, updates, loading } = useApp();

  const today = todayStr();
  const hour = new Date().getHours();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  const userTodayUpdate = updates.find(u => u.userId === currentUser.id && u.reportDate === today);

  const myTasks = tasks.filter(t => t.assignedTo === currentUser.id);
  const myOverdueTasks = myTasks.filter(t => t.dueDate && t.dueDate < today && t.status !== 'COMPLETED');
  const myTodayTasks = myTasks.filter(t => t.dueDate === today);
  const myUpcomingTasks = myTasks.filter(t => t.dueDate && t.dueDate >= today && t.dueDate !== today);

  const sortedUpcoming = [...myUpcomingTasks].sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const morningReminder = hour < 12;
  const eveningReminder = hour >= 16 && hour < 22;
  const reminderMessage = !userTodayUpdate?.morningSubmittedAt && morningReminder
    ? 'Submit your morning update with today\'s plan'
    : !userTodayUpdate?.eveningSubmittedAt && eveningReminder
    ? 'Wrap up your day with an evening update'
    : null;

  if (currentUser.role === 'ADMIN') {
    const totalEmployees = users.length;
    const morningSubmittedCount = updates.filter(u => u.reportDate === today && u.morningSubmittedAt).length;
    const eveningSubmittedCount = updates.filter(u => u.reportDate === today && u.eveningSubmittedAt).length;
    const pendingUpdateCount = totalEmployees - morningSubmittedCount;

    const productivityData = [
      { day: 'Mon', score: 85, hours: 38 },
      { day: 'Tue', score: 92, hours: 42 },
      { day: 'Wed', score: 88, hours: 40 },
      { day: 'Thu', score: 95, hours: 44 },
      { day: 'Fri', score: 90, hours: 39 },
    ];

    const taskCompletionData = [
      { name: 'Completed', count: tasks.filter(t => t.status === 'COMPLETED').length, color: '#10b981' },
      { name: 'In Progress', count: tasks.filter(t => t.status === 'IN_PROGRESS').length, color: '#3b82f6' },
      { name: 'Blocked', count: tasks.filter(t => t.status === 'BLOCKED').length, color: '#ef4444' },
      { name: 'Not Started', count: tasks.filter(t => t.status === 'NOT_STARTED').length, color: '#64748b' },
    ];

    return (
      <div className="space-y-6 pb-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-slate-800 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="relative z-10 space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {currentUser.role} Workspace
              </span>
              <span className="text-xs text-slate-400">• {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Welcome back, {currentUser.fullName}!
            </h2>
            <p className="text-xs text-slate-400 max-w-xl">
              Organization Productivity Dashboard: Track project health, daily submission compliance, and pending approvals.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-medium">Total Employees</span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-white">{totalEmployees}</span>
              <span className="text-[10px] text-emerald-400 flex items-center font-medium">
                100% Active <ArrowUpRight className="w-3 h-3 ml-0.5" />
              </span>
            </div>
            <div className="text-[11px] text-slate-400">Company-wide active users</div>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-medium">Morning Updates</span>
              <Sun className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-amber-300">{morningSubmittedCount} / {totalEmployees}</span>
              <span className="text-[10px] text-slate-400 font-medium">Today</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-amber-400 h-full rounded-full" style={{ width: `${(morningSubmittedCount / totalEmployees) * 100}%` }} />
            </div>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-medium">Evening Updates</span>
              <Moon className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-blue-300">{eveningSubmittedCount} / {totalEmployees}</span>
              <span className="text-[10px] text-slate-400 font-medium">Locks 10 PM</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-blue-400 h-full rounded-full" style={{ width: `${(eveningSubmittedCount / totalEmployees) * 100}%` }} />
            </div>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-medium">Pending Update Reminders</span>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-rose-400">{pendingUpdateCount}</span>
              <span className="text-[10px] text-rose-400 font-medium bg-rose-500/10 px-1.5 py-0.5 rounded">
                Auto Email @10PM
              </span>
            </div>
            <div className="text-[11px] text-slate-400">CC sent to all Admins</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Weekly Productivity & Time Log Index</span>
                </h3>
                <p className="text-xs text-slate-400">Average team output score vs logged hours</p>
              </div>
              <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                +14% vs Last Week
              </span>
            </div>

            <div className="h-60 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={productivityData}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400" />
                <span>Task Status Distribution</span>
              </h3>
              <p className="text-xs text-slate-400">Breakdown of assigned company tasks</p>
            </div>

            <div className="h-60 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taskCompletionData} layout="vertical">
                  <XAxis type="number" stroke="#64748b" fontSize={11} hide />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} width={80} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                    {taskCompletionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                <Briefcase className="w-4 h-4 text-purple-400" />
                <span>Active Projects Overview</span>
              </h3>
              <span className="text-xs text-slate-400">{projects.length} Total Projects</span>
            </div>

            <div className="space-y-3">
              {projects.map(p => (
                <div key={p.id} className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-xs text-white">{p.name}</div>
                      <div className="text-[10px] text-slate-400">{p.description}</div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {p.status}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Completion</span>
                      <span className="font-semibold text-white">{p.progressPercentage}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full" style={{ width: `${p.progressPercentage}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FCFS Admin Updates Table */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h3 className="font-bold text-base text-white flex items-center space-x-2">
                  <FileCheck className="w-5 h-5 text-emerald-400" />
                  <span>First-Come First-Serve (FCFS) Live Updates Table ({today})</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Real-time daily morning plans & evening status sorted by submission sequence.</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {updates.filter(u => u.reportDate === today).length} Submissions Today
              </span>
            </div>

            {(() => {
              const todayUpdates = updates.filter(u => u.reportDate === today);
              // Sort FCFS (First Come First Serve): earliest morning submission time first
              const fcfsOrdered = [...todayUpdates].sort((a, b) => {
                const timeA = a.morningSubmittedAt || a.eveningSubmittedAt || '9999-99-99';
                const timeB = b.morningSubmittedAt || b.eveningSubmittedAt || '9999-99-99';
                return timeA.localeCompare(timeB);
              });

              return (
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="p-3">FCFS Queue</th>
                        <th className="p-3">Employee</th>
                        <th className="p-3">Morning Task Update</th>
                        <th className="p-3">Est. Hrs</th>
                        <th className="p-3">Evening Status</th>
                        <th className="p-3">Actual Hrs</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {fcfsOrdered.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-500">
                            No updates submitted yet today.
                          </td>
                        </tr>
                      ) : (
                        fcfsOrdered.map((u, index) => (
                          <tr key={u.id} className="hover:bg-slate-800/40 transition">
                            <td className="p-3">
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                <span>#{index + 1} FCFS</span>
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="font-semibold text-white">{u.userName}</div>
                              <div className="text-[10px] text-slate-400">{u.userEmail}</div>
                            </td>
                            <td className="p-3 max-w-xs">
                              {u.morningPlannedWork ? (
                                <div className="space-y-1">
                                  <p className="text-slate-200">{u.morningPlannedWork}</p>
                                  {u.morningTaskTitle && (
                                    <div className="text-[10px] text-emerald-400 font-medium">Task: {u.morningTaskTitle}</div>
                                  )}
                                  {u.morningBlockers && (
                                    <div className="text-[10px] text-rose-400 font-semibold">Blocker: {u.morningBlockers}</div>
                                  )}
                                  <div className="text-[9px] text-slate-500">
                                    Submitted: {u.morningSubmittedAt ? new Date(u.morningSubmittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-600 italic">Not submitted</span>
                              )}
                            </td>
                            <td className="p-3 font-semibold text-white">
                              {u.morningEstHours ? `${u.morningEstHours} hrs` : '—'}
                            </td>
                            <td className="p-3 max-w-xs">
                              {u.eveningCompletedWork ? (
                                <div className="space-y-1">
                                  <p className="text-slate-200">{u.eveningCompletedWork}</p>
                                  {u.eveningChallenges && (
                                    <div className="text-[10px] text-amber-400">Challenges: {u.eveningChallenges}</div>
                                  )}
                                  {u.eveningNextDayPlan && (
                                    <div className="text-[10px] text-blue-400">Next: {u.eveningNextDayPlan}</div>
                                  )}
                                  <div className="text-[9px] text-slate-500">
                                    Submitted: {u.eveningSubmittedAt ? new Date(u.eveningSubmittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-600 italic">Pending evening</span>
                              )}
                            </td>
                            <td className="p-3 font-semibold text-white">
                              {u.eveningHoursSpent ? `${u.eveningHoursSpent} hrs` : '—'}
                            </td>
                            <td className="p-3">
                              {u.morningSubmittedAt && u.eveningSubmittedAt ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  COMPLETE
                                </span>
                              ) : u.morningSubmittedAt ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  MORNING ONLY
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                                  PENDING
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Top Banner Greeting */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-slate-800 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative z-10 space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
              My Workspace
            </span>
            <span className="text-xs text-slate-400">• {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Welcome back, {currentUser.fullName}!
          </h2>
          <p className="text-xs text-slate-400 max-w-xl">
            Submit your daily updates and track your projects & deadlines.
          </p>
        </div>

        <div className="flex items-center space-x-3 relative z-10">
          <button
            onClick={openMorningModal}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2 border transition ${
              userTodayUpdate?.morningSubmittedAt
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
            }`}
          >
            <Sun className="w-4 h-4" />
            <span>{userTodayUpdate?.morningSubmittedAt ? 'Morning Submitted ✓' : 'Submit Morning Update'}</span>
          </button>

          <button
            onClick={openEveningModal}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2 border transition ${
              userTodayUpdate?.eveningSubmittedAt
                ? 'bg-blue-950/40 border-blue-500/40 text-blue-300'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30'
            }`}
          >
            <Moon className="w-4 h-4" />
            <span>{userTodayUpdate?.eveningSubmittedAt ? 'Evening Submitted ✓' : 'Submit Evening Update'}</span>
          </button>
        </div>
      </div>

      {/* Time-based reminder card */}
      {reminderMessage && (
        <div className="rounded-2xl bg-gradient-to-r from-amber-950/30 to-orange-950/30 border border-amber-500/30 p-4 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">{reminderMessage}</p>
            <p className="text-xs text-amber-300/70">Complete it before the window closes to stay on track</p>
          </div>
          <button
            onClick={reminderMessage.includes('morning') ? openMorningModal : openEveningModal}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white transition shrink-0"
          >
            Submit Now
          </button>
        </div>
      )}

      {/* My Projects & My Tasks side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Projects */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm text-white flex items-center space-x-2">
              <Briefcase className="w-4 h-4 text-purple-400" />
              <span>My Projects</span>
            </h3>
            <span className="text-xs text-slate-400">{projects.length} Projects</span>
          </div>

          <div className="space-y-3">
            {projects.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No projects assigned yet.</p>
            ) : (
              projects.map(p => (
                <div key={p.id} className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-xs text-white">{p.name}</div>
                      <div className="text-[10px] text-slate-400">{p.description}</div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      p.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                      p.status === 'IN_PROGRESS' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                      p.status === 'ON_HOLD' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                      p.status === 'PLANNING' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                      'bg-slate-500/20 text-slate-300 border-slate-500/30'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Progress</span>
                      <span className="font-semibold text-white">{p.progressPercentage}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full" style={{ width: `${p.progressPercentage}%` }} />
                    </div>
                  </div>
                  {p.endDate && (
                    <div className="text-[10px] text-slate-500 flex items-center space-x-1">
                      <CalendarClock className="w-3 h-3" />
                      <span>Target: {p.endDate}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* My Upcoming Deadlines */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm text-white flex items-center space-x-2">
              <ListTodo className="w-4 h-4 text-rose-400" />
              <span>My Tasks & Deadlines</span>
            </h3>
            <span className="text-xs text-slate-400">{myTasks.length} Tasks</span>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {myTasks.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No tasks assigned yet.</p>
            ) : (
              <>
                {myOverdueTasks.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-rose-400 uppercase tracking-wider mb-2 flex items-center space-x-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Overdue ({myOverdueTasks.length})</span>
                    </p>
                    {myOverdueTasks.map(t => (
                      <div key={t.id} className="p-3 bg-rose-950/20 border border-rose-500/30 rounded-xl mb-2">
                        <div className="flex justify-between items-start">
                          <div className="font-semibold text-xs text-white">{t.title}</div>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            {t.status}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">{t.projectName}</div>
                        <div className="text-[10px] text-rose-400 font-semibold mt-1">Due: {t.dueDate}</div>
                      </div>
                    ))}
                  </div>
                )}

                {myTodayTasks.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider mb-2">Due Today</p>
                    {myTodayTasks.map(t => (
                      <div key={t.id} className="p-3 bg-amber-950/20 border border-amber-500/20 rounded-xl mb-2">
                        <div className="flex justify-between items-start">
                          <div className="font-semibold text-xs text-white">{t.title}</div>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            {t.status}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">{t.projectName}</div>
                      </div>
                    ))}
                  </div>
                )}

                {sortedUpcoming.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-2">Upcoming</p>
                    {sortedUpcoming.slice(0, 5).map(t => {
                      const daysRem = getDaysRemaining(t.dueDate);
                      const totalDays = getTotalDays(t.createdAt, t.dueDate);
                      const deadlineInfo = getDeadlineColor(daysRem, totalDays);
                      return (
                        <div key={t.id} className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl mb-2 space-y-1.5">
                          <div className="flex justify-between items-start">
                            <div className="font-semibold text-xs text-white">{t.title}</div>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                              t.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                              t.status === 'IN_PROGRESS' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                              t.status === 'BLOCKED' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                              'bg-slate-500/20 text-slate-300 border-slate-500/30'
                            }`}>
                              {t.status}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400">{t.projectName}</div>
                          <div className="flex justify-between items-center text-[10px] pt-1 border-t border-slate-800/60">
                            <span className="text-slate-400">Due: {t.dueDate}</span>
                            <span className={`font-bold px-1.5 py-0.5 rounded border ${deadlineInfo.bg} ${deadlineInfo.text} ${deadlineInfo.border}`}>
                              {daysRem} days remaining
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Today's update status card */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="font-bold text-sm text-white flex items-center space-x-2">
          <FileCheck className="w-4 h-4 text-emerald-400" />
          <span>Today's Update Status</span>
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className={`p-4 rounded-xl border ${userTodayUpdate?.morningSubmittedAt ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-slate-900/60 border-slate-700'}`}>
            <div className="flex items-center space-x-2 mb-2">
              <Sun className={`w-4 h-4 ${userTodayUpdate?.morningSubmittedAt ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span className={`text-xs font-semibold ${userTodayUpdate?.morningSubmittedAt ? 'text-emerald-300' : 'text-slate-400'}`}>Morning Update</span>
            </div>
            {userTodayUpdate?.morningSubmittedAt ? (
              <div className="text-xs text-slate-300 space-y-1">
                <p><span className="text-slate-500">Planned:</span> {userTodayUpdate.morningPlannedWork}</p>
                <p><span className="text-slate-500">Est. Hours:</span> {userTodayUpdate.morningEstHours}h</p>
              </div>
            ) : (
              <p className="text-xs text-slate-500">Not submitted yet</p>
            )}
          </div>
          <div className={`p-4 rounded-xl border ${userTodayUpdate?.eveningSubmittedAt ? 'bg-blue-950/20 border-blue-500/30' : 'bg-slate-900/60 border-slate-700'}`}>
            <div className="flex items-center space-x-2 mb-2">
              <Moon className={`w-4 h-4 ${userTodayUpdate?.eveningSubmittedAt ? 'text-blue-400' : 'text-slate-500'}`} />
              <span className={`text-xs font-semibold ${userTodayUpdate?.eveningSubmittedAt ? 'text-blue-300' : 'text-slate-400'}`}>Evening Update</span>
            </div>
            {userTodayUpdate?.eveningSubmittedAt ? (
              <div className="text-xs text-slate-300 space-y-1">
                <p><span className="text-slate-500">Completed:</span> {userTodayUpdate.eveningCompletedWork}</p>
                <p><span className="text-slate-500">Hours Spent:</span> {userTodayUpdate.eveningHoursSpent}h</p>
              </div>
            ) : (
              <p className="text-xs text-slate-500">Not submitted yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
