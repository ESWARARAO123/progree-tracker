import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../api';
import { X, Filter, MoreVertical, CheckCircle2, Calendar, Loader2 } from 'lucide-react';
import type { Task, TaskStatus, Priority } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string; color: string }[] = [
  { value: 'NOT_STARTED', label: 'Not Started', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  { value: 'BLOCKED', label: 'Blocked', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { value: 'COMPLETED', label: 'Completed', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
];

const PRIORITY_OPTIONS: { value: Priority; label: string; color: string }[] = [
  { value: 'LOW', label: 'Low', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
  { value: 'MEDIUM', label: 'Medium', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  { value: 'HIGH', label: 'High', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { value: 'CRITICAL', label: 'Critical', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
];

export const ProjectOwnerTasksModal: React.FC<Props> = ({ isOpen, onClose, projectId, projectName }) => {
  const { token } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'ALL'>('ALL');
  const [filterPriority, setFilterPriority] = useState<Priority | 'ALL'>('ALL');
  const [filterAssignee, setFilterAssignee] = useState<string>('ALL');

  useEffect(() => {
    if (!isOpen) return;
    const fetchTasks = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const res = await api.getTasks(token, projectId);
        setTasks(res || []);
      } catch (err) {
        console.error('Failed to load tasks:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [isOpen, projectId, token]);

  const filteredTasks = tasks.filter(t => {
    if (filterStatus !== 'ALL' && t.status !== filterStatus) return false;
    if (filterPriority !== 'ALL' && t.priority !== filterPriority) return false;
    if (filterAssignee !== 'ALL' && t.assignedTo !== filterAssignee) return false;
    return true;
  });

  const assignees = Array.from(new Set(tasks.map(t => t.assignedToName)));

  const getStatusMeta = (status: TaskStatus) => {
    return STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
  };

  const getPriorityMeta = (priority: Priority) => {
    return PRIORITY_OPTIONS.find(p => p.value === priority) || PRIORITY_OPTIONS[0];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col h-[700px] max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Team Tasks - {projectName}</h3>
              <p className="text-xs text-slate-400">View and track tasks assigned to your project team</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-3 bg-slate-800/40 border-b border-slate-800 flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as TaskStatus | 'ALL')}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-purple-500 focus:outline-none"
            >
              <option value="ALL">All Status</option>
              {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <select
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value as Priority | 'ALL')}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-purple-500 focus:outline-none"
            >
              <option value="ALL">All Priority</option>
              {PRIORITY_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            <select
              value={filterAssignee}
              onChange={e => setFilterAssignee(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-purple-500 focus:outline-none"
            >
              <option value="ALL">All Assignees</option>
              {assignees.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-950/40">
          {loading && tasks.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-16 text-slate-500 space-y-2">
              <CheckCircle2 className="w-10 h-10 mx-auto text-slate-600 opacity-60" />
              <p className="text-sm font-medium">No tasks found.</p>
              <p className="text-xs">Try adjusting your filters or create a new task.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-400 font-semibold border-b border-slate-800 uppercase text-[10px] sticky top-0 bg-slate-950/90">
                  <tr>
                    <th className="p-3">Task</th>
                    <th className="p-3">Assignee</th>
                    <th className="p-3 text-center">Priority</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Due Date</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {filteredTasks.map(task => {
                    const statusMeta = getStatusMeta(task.status);
                    const priorityMeta = getPriorityMeta(task.priority);
                    return (
                      <tr key={task.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3">
                          <div className="font-semibold text-white truncate max-w-xs">{task.title}</div>
                          {task.description && (
                            <div className="text-[10px] text-slate-500 truncate max-w-xs mt-0.5">{task.description}</div>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 font-bold flex items-center justify-center text-[10px] border border-purple-500/30">
                              {task.assignedToName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-white text-[11px]">{task.assignedToName}</p>
                              <p className="text-[9px] text-slate-500">{task.projectName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${priorityMeta.color}`}>
                            {priorityMeta.label}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusMeta.color}`}>
                            {statusMeta.label}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center space-x-1 text-[10px]">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span className={`font-mono ${task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED' ? 'text-rose-400' : 'text-slate-300'}`}>
                              {task.dueDate || '—'}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex justify-center space-x-1">
                            <div className="relative">
                              <button
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                              >
                                <MoreVertical className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};