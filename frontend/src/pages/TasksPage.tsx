import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, CheckSquare, User, Calendar, Sun, ArrowUpDown, Edit3 } from 'lucide-react';
import { NewTaskModal } from '../components/NewTaskModal';
import { EditTaskModal } from '../components/EditTaskModal';
import { todayStr, getDaysRemaining, getDeadlineColor, getTotalDays } from '../utils/date';
import type { TaskStatus, Task } from '../types';

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
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [selectedUserId, setSelectedUserId] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'PRIORITY' | 'DUE_DATE' | 'PROJECT' | 'STATUS'>('PRIORITY');

  const today = todayStr();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (currentUser.role === 'ADMIN') {
    let filteredTasks = [...tasks];
    if (selectedProjectId !== 'ALL') {
      filteredTasks = filteredTasks.filter(t => t.projectId === selectedProjectId);
    }
    if (selectedUserId !== 'ALL') {
      filteredTasks = filteredTasks.filter(t => t.assignedTo === selectedUserId);
    }

    const sortedTasks = [...filteredTasks].sort((a, b) => {
      if (sortBy === 'PRIORITY') {
        return (priorityRank[b.priority] || 0) - (priorityRank[a.priority] || 0);
      }
      if (sortBy === 'DUE_DATE') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      }
      if (sortBy === 'PROJECT') {
        return a.projectName.localeCompare(b.projectName);
      }
      if (sortBy === 'STATUS') {
        return a.status.localeCompare(b.status);
      }
      return 0;
    });

    return (
      <div className="space-y-6 pb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <CheckSquare className="w-5 h-5 text-blue-400" />
              <span>Task Management Board</span>
            </h2>
            <p className="text-xs text-slate-400">Company-wide task distribution, priority status, and assignee updates.</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-lg shadow-blue-600/30 transition"
            >
              <Plus className="w-4 h-4" />
              <span>New Task</span>
            </button>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 font-medium">Project:</span>
              <select
                value={selectedProjectId}
                onChange={e => setSelectedProjectId(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="ALL">All Projects ({projects.length})</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 font-medium">Assignee:</span>
              <select
                value={selectedUserId}
                onChange={e => setSelectedUserId(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="ALL">All Team Members ({users.length})</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.fullName}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-end md:self-auto">
            <ArrowUpDown className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs text-slate-400 font-semibold">Sort Tasks:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 text-xs text-white font-medium rounded-xl px-3 py-1.5 focus:border-blue-500 focus:outline-none cursor-pointer"
            >
              <option value="PRIORITY">By Priority (Highest First)</option>
              <option value="DUE_DATE">By Due Date (Earliest First)</option>
              <option value="PROJECT">By Project Name</option>
              <option value="STATUS">By Status</option>
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
                  <th className="text-right px-4 py-3 font-semibold text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedTasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-500">No tasks found matching criteria.</td>
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
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setEditingTask(t)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition"
                          title="Edit Task"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <NewTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        {editingTask && (
          <EditTaskModal isOpen={!!editingTask} onClose={() => setEditingTask(null)} task={editingTask} />
        )}
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
                  <div className="flex items-center space-x-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      t.priority === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                      t.priority === 'HIGH' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                      'bg-slate-800 text-slate-300 border-slate-700'
                    }`}>
                      {t.priority}
                    </span>
                  </div>
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
