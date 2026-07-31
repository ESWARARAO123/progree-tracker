import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, CheckSquare, User, Calendar, Sun, ArrowUpDown, Briefcase } from 'lucide-react';
import { NewTaskModal } from '../components/NewTaskModal';
import { todayStr, getDaysRemaining, getDeadlineColor, getTotalDays } from '../utils/date';
import type { TaskStatus } from '../types';

const statusProgress: Record<TaskStatus, number> = {
  'NOT_STARTED': 0,
  'IN_PROGRESS': 50,
  'BLOCKED': 30,
  'COMPLETED': 100,
};

const statusColor: Record<TaskStatus, string> = {
  'NOT_STARTED': 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  'IN_PROGRESS': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'BLOCKED': 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  'COMPLETED': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
};

const statusBarColor: Record<TaskStatus, string> = {
  'NOT_STARTED': 'bg-slate-500',
  'IN_PROGRESS': 'bg-blue-500',
  'BLOCKED': 'bg-rose-500',
  'COMPLETED': 'bg-emerald-500',
};

const priorityRank: Record<string, number> = {
  'CRITICAL': 4,
  'HIGH': 3,
  'MEDIUM': 2,
  'LOW': 1,
};

const allStatuses: TaskStatus[] = ['NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED'];

export const TasksPage: React.FC = () => {
  const { tasks, updates, projects, users, updateTaskStatus, currentUser, loading } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>('ALL');
  const [selectedUser, setSelectedUser] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'DEFAULT' | 'PROJECT_ASC' | 'USER_ASC' | 'PRIORITY_DESC' | 'DUE_DATE_ASC'>('DEFAULT');

  const today = todayStr();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Filter tasks based on project and assignee
  const filteredTasks = tasks.filter(t => {
    if (selectedProject !== 'ALL' && t.projectId !== selectedProject) return false;
    if (selectedUser !== 'ALL' && t.assignedTo !== selectedUser) return false;
    return true;
  });

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'PROJECT_ASC') {
      return (a.projectName || '').localeCompare(b.projectName || '');
    }
    if (sortBy === 'USER_ASC') {
      return (a.assignedToName || '').localeCompare(b.assignedToName || '');
    }
    if (sortBy === 'PRIORITY_DESC') {
      return (priorityRank[b.priority] || 0) - (priorityRank[a.priority] || 0);
    }
    if (sortBy === 'DUE_DATE_ASC') {
      return (a.dueDate || '9999-99-99').localeCompare(b.dueDate || '9999-99-99');
    }
    return 0;
  });

  if (currentUser.role === 'ADMIN') {
    return (
      <div className="space-y-6 pb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <CheckSquare className="w-5 h-5 text-blue-400" />
              <span>Task Board</span>
            </h2>
            <p className="text-xs text-slate-400">All tasks across projects — assignee, priority, timeline, and status.</p>
          </div>

          <div className="flex items-center space-x-3">
            {/* Top Right Sort Dropdown */}
            <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-700/80 px-3 py-2 rounded-xl text-xs shadow-sm">
              <ArrowUpDown className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400 font-semibold hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer text-xs"
              >
                <option value="DEFAULT" className="bg-slate-900 text-white">Default Order</option>
                <option value="PROJECT_ASC" className="bg-slate-900 text-white">Project Name (A-Z)</option>
                <option value="USER_ASC" className="bg-slate-900 text-white">Assignee Name (A-Z)</option>
                <option value="PRIORITY_DESC" className="bg-slate-900 text-white">Priority (Critical First)</option>
                <option value="DUE_DATE_ASC" className="bg-slate-900 text-white">Due Date (Earliest First)</option>
              </select>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center space-x-2 shadow-lg shadow-blue-600/30 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
            </button>
          </div>
        </div>

        {/* Filter Ribbon for Admin */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center space-x-1">
              <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
              <span>Filter by Project</span>
            </label>
            <select
              value={selectedProject}
              onChange={e => setSelectedProject(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center space-x-1">
              <User className="w-3.5 h-3.5 text-blue-400" />
              <span>Filter by Assignee</span>
            </label>
            <select
              value={selectedUser}
              onChange={e => setSelectedUser(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Assignees</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.fullName}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60">
                  <th className="text-left px-4 py-3 font-semibold text-slate-400">Task</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-400">Project</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-400">Assignee</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-400">Priority</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-400">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-400">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {sortedTasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-500">No tasks found matching criteria.</td>
                  </tr>
                ) : (
                  sortedTasks.map(t => (
                    <tr key={t.id} className="border-b border-slate-800 hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white">{t.title}</div>
                        {t.description && <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[200px]">{t.description}</div>}
                      </td>
                      <td className="px-4 py-3 text-slate-300">{t.projectName}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-1.5">
                          <User className="w-3 h-3 text-slate-500" />
                          <span className="text-slate-300">{t.assignedToName || 'Unassigned'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          t.priority === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300' :
                          t.priority === 'HIGH' ? 'bg-amber-500/20 text-amber-300' :
                          t.priority === 'MEDIUM' ? 'bg-blue-500/20 text-blue-300' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          {t.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={t.status}
                          onChange={e => updateTaskStatus(t.id, e.target.value as TaskStatus)}
                          className={`text-[10px] font-semibold px-2 py-1 rounded border ${statusColor[t.status]} bg-slate-800 focus:outline-none cursor-pointer`}
                        >
                          {allStatuses.map(s => (
                            <option key={s} value={s}>{s.replace('_', ' ')}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        {t.dueDate ? (
                          <div className="flex flex-col space-y-1">
                            <div className="flex items-center space-x-1.5 text-slate-400">
                              <Calendar className="w-3 h-3 text-blue-400" />
                              <span>{t.dueDate}</span>
                            </div>
                            {(() => {
                              const daysRem = getDaysRemaining(t.dueDate);
                              const totalDays = getTotalDays(t.createdAt, t.dueDate);
                              const info = getDeadlineColor(daysRem, totalDays);
                              const isOverdue = t.dueDate < today && t.status !== 'COMPLETED';
                              return (
                                <div className={`text-[10px] font-semibold ${isOverdue ? 'text-rose-400' : info.text}`}>
                                  {isOverdue ? `${Math.abs(daysRem)}d overdue` : `${daysRem} days remaining`}
                                </div>
                              );
                            })()}
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <NewTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </div>
    );
  }

  const myTasks = tasks.filter(t => t.assignedTo === currentUser.id);
  const userTodayUpdate = updates.find(u => u.userId === currentUser.id && u.reportDate === today);
  const todayMorningTaskId = userTodayUpdate?.morningTaskId;

  const orderedTasks = todayMorningTaskId
    ? [...myTasks].sort((a, b) => (a.id === todayMorningTaskId ? -1 : b.id === todayMorningTaskId ? 1 : 0))
    : myTasks;

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <CheckSquare className="w-5 h-5 text-blue-400" />
            <span>My Tasks</span>
          </h2>
          <p className="text-xs text-slate-400">Track your assigned tasks, update status, and monitor progress.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orderedTasks.length === 0 ? (
          <div className="col-span-full">
            <p className="text-xs text-slate-500 py-12 text-center border border-dashed border-slate-800 rounded-2xl">No tasks assigned to you yet.</p>
          </div>
        ) : (
          orderedTasks.map(t => {
            const progress = statusProgress[t.status];
            const isTodayPlan = t.id === todayMorningTaskId;
            return (
              <div key={t.id} className={`glass-panel p-5 rounded-2xl border space-y-4 transition ${
                isTodayPlan ? 'border-emerald-500/50 bg-emerald-500/[0.04]' : 'border-slate-800 hover:border-slate-700'
              }`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{t.projectName}</div>
                    <h3 className="font-bold text-sm text-white mt-1">{t.title}</h3>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    t.priority === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                    t.priority === 'HIGH' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                    'bg-slate-800 text-slate-300 border-slate-700'
                  }`}>
                    {t.priority}
                  </span>
                </div>

                {isTodayPlan && (
                  <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-2.5 space-y-1">
                    <div className="flex items-center space-x-1.5 text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
                      <Sun className="w-3 h-3" />
                      <span>Today's Plan</span>
                    </div>
                    {userTodayUpdate?.morningPlannedWork && (
                      <p className="text-[11px] text-slate-300">{userTodayUpdate.morningPlannedWork}</p>
                    )}
                  </div>
                )}

                {t.description && (
                  <p className="text-xs text-slate-400">{t.description}</p>
                )}

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Progress</span>
                    <span className="font-semibold text-white">{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${statusBarColor[t.status]}`} style={{ width: `${progress}%` }} />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs pt-2 border-t border-slate-800">
                  <div className="flex items-center space-x-1.5 text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-blue-400" />
                    <span>Deadline: <strong className="text-slate-200">{t.dueDate || 'No deadline'}</strong></span>
                  </div>
                  {t.dueDate && (() => {
                    const daysRem = getDaysRemaining(t.dueDate);
                    const totalDays = getTotalDays(t.createdAt, t.dueDate);
                    const info = getDeadlineColor(daysRem, totalDays);
                    const isOverdue = t.dueDate < today && t.status !== 'COMPLETED';
                    return (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center space-x-1 self-start sm:self-auto ${
                        isOverdue 
                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' 
                          : `${info.bg} ${info.text} ${info.border}`
                      }`}>
                        <span>{isOverdue ? `${Math.abs(daysRem)} days overdue` : `${daysRem} days remaining`}</span>
                      </span>
                    );
                  })()}
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1.5">Update Status</label>
                  <div className="grid grid-cols-4 gap-1">
                    {allStatuses.map(s => (
                      <button
                        key={s}
                        onClick={() => updateTaskStatus(t.id, s)}
                        className={`py-1.5 rounded-lg text-[9px] font-semibold border transition ${
                          t.status === s
                            ? `${statusColor[s]} border`
                            : 'bg-slate-800 text-slate-500 border-slate-700 hover:bg-slate-700 hover:text-slate-300'
                        }`}
                      >
                        {s === 'NOT_STARTED' ? 'Todo' : s === 'IN_PROGRESS' ? 'Doing' : s === 'BLOCKED' ? 'Blocked' : 'Done'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
