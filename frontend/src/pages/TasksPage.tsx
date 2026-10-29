import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, CheckSquare, User as UserIcon, Calendar, Sun, ArrowUpDown, Edit3, Paperclip, ExternalLink, CheckCircle2, ArrowDown, ChevronDown, ChevronUp, CheckCircle, AlertTriangle } from 'lucide-react';
import { NewTaskModal } from '../components/NewTaskModal';
import { EditTaskModal } from '../components/EditTaskModal';
import { UpdateTaskStatusModal } from '../components/UpdateTaskStatusModal';
import { todayStr, getDaysRemaining, getDeadlineColor, getTotalDays } from '../utils/date';
import type { TaskStatus, Task, User } from '../types';

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
  const [statusProofTask, setStatusProofTask] = useState<Task | null>(null);
  const [sortBy, setSortBy] = useState<'PRIORITY' | 'DUE_DATE' | 'PROJECT' | 'STATUS'>('PRIORITY');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  // Admin filter states
  const [adminSelectedProjectId, setAdminSelectedProjectId] = useState<string>('ALL');
  const [adminSelectedUserId, setAdminSelectedUserId] = useState<string>('ALL');
  // Non-admin filter states - default to current user (owner) to show their tasks
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [selectedProjectUserId, setSelectedProjectUserId] = useState<string>(currentUser?.id || 'ALL');

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
    if (adminSelectedProjectId !== 'ALL') {
      filteredTasks = filteredTasks.filter(t => t.projectId === adminSelectedProjectId);
    }
    if (adminSelectedUserId !== 'ALL') {
      filteredTasks = filteredTasks.filter(t => t.assignedTo === adminSelectedUserId);
    }

    const pendingTasks = filteredTasks.filter(t => t.status !== 'COMPLETED');
    const completedTasks = filteredTasks.filter(t => t.status === 'COMPLETED');

    const sortTasks = (taskList: typeof filteredTasks) => {
      return [...taskList].sort((a, b) => {
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
    };

    const sortedPendingTasks = sortTasks(pendingTasks);
    const sortedCompletedTasks = sortTasks(completedTasks);

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
                value={adminSelectedProjectId}
                onChange={e => setAdminSelectedProjectId(e.target.value)}
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
                value={adminSelectedUserId}
                onChange={e => setAdminSelectedUserId(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="ALL">All Team Members ({users.length})</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.fullName}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-end md:self-auto flex-wrap gap-2">
            <button
              onClick={() => setShowCompletedTasks(!showCompletedTasks)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition ${
                showCompletedTasks
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              {showCompletedTasks ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              <span>{showCompletedTasks ? 'Hide' : 'Show'} Completed Tasks ({completedTasks.length})</span>
            </button>
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
                  <th className="text-left px-4 py-3 font-semibold text-slate-400">Status & Proof</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-400">Due Date</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedPendingTasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                      {filteredTasks.length === 0
                        ? 'No tasks found matching criteria.'
                        : 'No pending tasks found. All tasks are completed!'
                      }
                    </td>
                  </tr>
                ) : (
                  sortedPendingTasks.map(t => (
                    <tr key={t.id} className="border-b border-slate-800 hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white">{t.title}</div>
                        <div className="flex items-center space-x-1 text-[10px] text-slate-500 mt-0.5">
                          <UserIcon className="w-3 h-3" />
                          <span>Created by <span className="text-slate-400 font-medium">{t.createdByName || '—'}</span></span>
                        </div>
                        {t.description && <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[200px]">{t.description}</div>}
                      </td>
                      <td className="px-4 py-3 text-slate-300">{t.projectName}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-1.5">
                          <UserIcon className="w-3 h-3 text-slate-500" />
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
                      <td className="px-4 py-3 space-y-1">
                        <div className="flex items-center space-x-2">
                          <select
                            value={t.status}
                            onChange={e => updateTaskStatus(t.id, e.target.value as TaskStatus)}
                            className={`text-[10px] font-semibold px-2 py-1 rounded border ${statusColor[t.status]} bg-slate-800 focus:outline-none cursor-pointer`}
                          >
                            {allStatuses.map(s => (
                              <option key={s} value={s}>{s.replace('_', ' ')}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => setStatusProofTask(t)}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-blue-400 transition"
                            title="Upload Screenshot / Document Proof"
                          >
                            <Paperclip className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {t.attachmentUrl && (
                          <a
                            href={t.attachmentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-blue-400 underline hover:text-blue-300 flex items-center space-x-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span className="truncate max-w-[120px]">{t.attachmentName || 'Proof'}</span>
                          </a>
                        )}
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
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => setEditingTask(t)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition"
                            title="Update Task"
                          >
                            <Edit3 className="w-4 h-4" />
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

        {showCompletedTasks && completedTasks.length > 0 && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden mt-4">
            <div className="px-4 py-3 bg-emerald-950/30 border-b border-slate-800 flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-300">Completed Tasks ({sortedCompletedTasks.length})</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60">
                    <th className="text-left px-4 py-3 font-semibold text-slate-400">Task</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-400">Project</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-400">Assignee</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-400">Priority</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-400">Completed Date</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-400">Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCompletedTasks.map(t => (
                    <tr key={t.id} className="border-b border-slate-800 hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white">{t.title}</div>
                        {t.description && <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[200px]">{t.description}</div>}
                      </td>
                      <td className="px-4 py-3 text-slate-300">{t.projectName}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-1.5">
                          <UserIcon className="w-3 h-3 text-slate-500" />
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
                      <td className="px-4 py-3 text-emerald-300">
                        {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {t.dueDate ? (
                          <div className="flex flex-col space-y-1">
                            <div className="flex items-center space-x-1.5 text-slate-400">
                              <Calendar className="w-3 h-3 text-blue-400" />
                              <span>{t.dueDate}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <NewTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        {editingTask && (
          <EditTaskModal isOpen={!!editingTask} onClose={() => setEditingTask(null)} task={editingTask} />
        )}
        <UpdateTaskStatusModal
          isOpen={!!statusProofTask}
          onClose={() => setStatusProofTask(null)}
          task={statusProofTask}
        />
      </div>
    );
  }


  // Get user's projects (owned or assigned)
  const userProjects = projects.filter(p => 
    p.owner?.id === currentUser.id || p.assignedUsers.some(u => u.id === currentUser.id)
  );

  // For project owners, show all tasks in their projects + their own "Others" tasks; for others, only their own tasks
  const isProjectOwner = userProjects.some(p => p.owner?.id === currentUser.id);
  const myTasks = isProjectOwner
    ? tasks.filter(t => userProjects.some(p => p.id === t.projectId) || (t.assignedTo === currentUser.id && !t.projectId))
    : tasks.filter(t => t.assignedTo === currentUser.id);

  // Get users from selected project (for project-specific filtering)
  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const projectUsers = selectedProject ? selectedProject.assignedUsers.filter((u: User) => u.isActive) : [];

  // Filter tasks by selected project
  let filteredTasks: Task[] = [...myTasks];
  if (selectedProjectId !== "ALL") {
    filteredTasks = filteredTasks.filter((t: Task) => t.projectId === selectedProjectId);
  }
  // Filter by selected user (works across all projects or within selected project)
  if (selectedProjectUserId !== "ALL") {
    filteredTasks = filteredTasks.filter((t: Task) => t.assignedTo === selectedProjectUserId);
  }
  

  const userTodayUpdate = updates.find(u => u.userId === currentUser.id && u.reportDate === today);
  const todayMorningTaskId = userTodayUpdate?.morningTaskId;

  // Column tasks
  const myTasksColumn = filteredTasks.filter((t: Task) => t.status === 'NOT_STARTED');
  const inProgressColumn = filteredTasks.filter((t: Task) => t.status === 'IN_PROGRESS');
  const blockedColumn = filteredTasks.filter((t: Task) => t.status === 'BLOCKED');
  const completedColumn = filteredTasks.filter((t: Task) => t.status === 'COMPLETED');

  // Helper for deadline badge
  const getDeadlineBadge = (task: Task) => {
    if (!task.dueDate) return null;
    const daysRem = getDaysRemaining(task.dueDate);
    const totalDays = getTotalDays(task.createdAt, task.dueDate);
    const info = getDeadlineColor(daysRem, totalDays);
    const isOverdue = task.dueDate < today && task.status !== 'COMPLETED';
    const classes = isOverdue 
      ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' 
      : `${info.bg} ${info.text} ${info.border}`;
    const label = isOverdue ? `${Math.abs(daysRem)}d overdue` : `${daysRem}d left`;
    return (
      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border flex items-center space-x-1 self-start sm:self-auto ${classes}`}>
        <span>{label}</span>
      </span>
    );
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
    // Create custom drag image for smoother drag
    const dragImage = document.createElement('div');
    dragImage.className = 'glass-panel p-3 rounded-lg border border-emerald-500/50 shadow-xl';
    dragImage.style.cssText = 'position: absolute; top: -9999px; pointer-events: none; min-width: 280px;';
    dragImage.innerHTML = `
      <div class="font-bold text-sm text-white">${e.currentTarget.querySelector('h4')?.textContent || 'Task'}</div>
      <div class="text-xs text-emerald-300 mt-1">Drag to column...</div>
    `;
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 20, 20);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  const handleDragOver = (e: React.DragEvent, columnId?: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (columnId) setDragOverColumn(columnId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if leaving the column entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    if (draggedTaskId && draggedTaskId !== '') {
      updateTaskStatus(draggedTaskId, targetStatus);
    }
    setDraggedTaskId(null);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  const columnConfig = [
    { id: 'NOT_STARTED', title: 'My Tasks', icon: CheckSquare, color: 'slate', tasks: myTasksColumn },
    { id: 'IN_PROGRESS', title: 'In Progress', icon: Sun, color: 'blue', tasks: inProgressColumn },
    { id: 'BLOCKED', title: 'Blocked', icon: AlertTriangle, color: 'rose', tasks: blockedColumn },
    { id: 'COMPLETED', title: 'Completed', icon: CheckCircle2, color: 'emerald', tasks: completedColumn },
  ];

  // TaskCard component to avoid nested JSX complexity
  function TaskCard({ task }: { task: Task }) {
    const progress = statusProgress[task.status];
    const isTodayPlan = task.id === todayMorningTaskId;
    const isDragging = draggedTaskId === task.id;

    const cardClass = `glass-panel p-4 rounded-xl border transition-all duration-200 ${
      isDragging ? 'opacity-50 rotate-1 scale-102 shadow-2xl z-10' :
      isTodayPlan ? 'border-emerald-500/50 bg-emerald-500/[0.04]' : 'border-slate-800 hover:border-slate-700'
    }`;

    const priorityClass = `text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
      task.priority === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
      task.priority === 'HIGH' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
      'bg-slate-800 text-slate-300 border-slate-700'
    }`;

    return (
      <div
        key={task.id}
        draggable
        onDragStart={(e) => handleDragStart(e, task.id)}
        onDragEnd={handleDragEnd}
        className={cardClass}
        style={{ cursor: 'grab' }}
      >
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate">{task.projectName}</div>
            <h4 className="font-bold text-sm text-white mt-0.5 truncate">{task.title}</h4>
          </div>
          <span className={priorityClass}>{task.priority}</span>
        </div>

        {isTodayPlan && (
          <div className="mb-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2 space-y-1">
            <div className="flex items-center space-x-1.5 text-[9px] font-bold text-emerald-300 uppercase tracking-wider">
              <Sun className="w-3 h-3" />
              <span>Today's Plan</span>
            </div>
            {userTodayUpdate?.morningPlannedWork && (
              <p className="text-[10px] text-slate-300 truncate">{userTodayUpdate.morningPlannedWork}</p>
            )}
          </div>
        )}

        {task.description && <p className="text-xs text-slate-400 mb-2 line-clamp-2">{task.description}</p>}

        {task.attachmentUrl && (
          <div className="mb-2 p-2 rounded-lg bg-slate-800/80 border border-slate-700/80 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 truncate">
              <span className="truncate text-slate-200 font-medium">{task.attachmentName || 'Attached Proof'}</span>
            </div>
            <a href={task.attachmentUrl} target="_blank" rel="noreferrer" className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-lg text-[9px] font-semibold border border-blue-500/30 flex items-center space-x-1 shrink-0">
              <ExternalLink className="w-2.5 h-2.5" /><span>View</span>
            </a>
          </div>
        )}

        <div className="space-y-1 mb-2">
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>Progress</span>
            <span className="font-semibold text-white">{progress}%</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${statusBarColor[task.status]}`} style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-800">
          <div className="flex items-center space-x-1.5 text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span>Deadline: <strong className="text-slate-200">{task.dueDate || 'No deadline'}</strong></span>
          </div>
          {getDeadlineBadge(task)}
        </div>

        <div className="pt-2 border-t border-slate-800">
          <div className="flex space-x-2">
            <button
              onClick={() => setEditingTask(task)}
              className="flex-1 text-[10px] text-blue-400 hover:underline flex items-center justify-center space-x-1 py-1 border border-blue-500/30 rounded-lg hover:bg-blue-500/10 transition"
            >
              <Edit3 className="w-3 h-3" />
              <span>Edit Task</span>
            </button>
            <button
              onClick={() => setStatusProofTask(task)}
              className="flex-1 text-[10px] text-slate-400 hover:underline flex items-center justify-center space-x-1 py-1 border border-slate-700 rounded-lg hover:bg-slate-800 transition"
            >
              <Paperclip className="w-3 h-3" />
              <span>Upload Proof</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col gap-3 p-3">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 flex-shrink-0 px-1">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center space-x-1.5">
            <CheckSquare className="w-4 h-4 text-blue-400" />
            <span>My Tasks</span>
          </h2>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 shadow-lg shadow-blue-600/30 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Task</span>
        </button>
      </div>

      {/* Project & User Filter Dropdowns for Project Owners */}
      {userProjects.length > 0 && (
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 font-medium">Project:</span>
              <select
                value={selectedProjectId}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value);
                  // Reset to current user when project changes (show their tasks by default)
                  setSelectedProjectUserId(currentUser?.id || 'ALL');
                }}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="ALL">All My Projects</option>
                {userProjects.map(p => (
                  <option key={p.id} value={p.id}>{p.name} {p.owner?.id === currentUser.id ? '(Owner)' : ''}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 font-medium">Team Member:</span>
              <select
                value={selectedProjectUserId}
                onChange={e => setSelectedProjectUserId(e.target.value)}
                disabled={selectedProjectId === 'ALL'}
                className={`bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none ${selectedProjectId === 'ALL' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <option value="ALL">All Members</option>
                {projectUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.fullName} ({u.role}){u.id === currentUser.id ? ' (You)' : ''}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 flex-1 min-h-0">
        {columnConfig.map((col) => {
          const { id, title, icon: ColIcon, color, tasks: columnTasks } = col;
          const bgColor = {
            slate: 'bg-slate-800/50 border-slate-700',
            blue: 'bg-blue-900/30 border-blue-800/50',
            rose: 'bg-rose-900/30 border-rose-800/50',
            emerald: 'bg-emerald-900/30 border-emerald-800/50',
          }[color];

          const textColor = {
            slate: 'text-slate-300',
            blue: 'text-blue-300',
            rose: 'text-rose-300',
            emerald: 'text-emerald-300',
          }[color];

          return (
            <div
              key={id}
              className={`glass-panel rounded-2xl border flex flex-col ${bgColor} ${dragOverColumn === id ? 'ring-2 ring-emerald-400/50 bg-emerald-500/10' : ''}`}
              onDragOver={(e) => handleDragOver(e, id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, id as TaskStatus)}
            >
              {/* Column Header */}
              <div className="p-4 border-b border-slate-700/50 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center space-x-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${textColor} bg-current/10`}>
                    <ColIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">{title}</h3>
                    <p className="text-[10px] text-slate-500">{columnTasks.length} task{columnTasks.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                {dragOverColumn === id && (
                  <span className="text-xs text-emerald-400 font-semibold flex items-center space-x-1">
                    <ArrowDown className="w-3.5 h-3.5" />
                    <span>Drop here</span>
                  </span>
                )}
              </div>

              {/* Task List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
                {columnTasks.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2">
                    <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center">
                      <Plus className="w-5 h-5" />
                    </div>
                    <p className="text-xs">No tasks</p>
                    <p className="text-[10px]">Drop tasks here</p>
                  </div>
                ) : (
                  columnTasks.map(t => <TaskCard key={t.id} task={t} />)
                )}
              </div>
            </div>
          );
        })}
      </div>

      <NewTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      {editingTask && (
        <EditTaskModal isOpen={!!editingTask} onClose={() => setEditingTask(null)} task={editingTask} />
      )}
      <UpdateTaskStatusModal
        isOpen={!!statusProofTask}
        onClose={() => setStatusProofTask(null)}
        task={statusProofTask}
      />
    </div>
  );
};
