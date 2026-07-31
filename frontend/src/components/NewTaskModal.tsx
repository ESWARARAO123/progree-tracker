import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CheckSquare, X, UserPlus, Check } from 'lucide-react';
import type { Priority, TaskStatus } from '../types';


interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const NewTaskModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { createTask, projects, users, currentUser } = useApp();
  const activeUsers = users.filter(u => u.isActive);

  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [status, setStatus] = useState<TaskStatus>('NOT_STARTED');
  const [assignedToIds, setAssignedToIds] = useState<string[]>(() => currentUser?.id ? [currentUser.id] : []);
  const [dueDate, setDueDate] = useState('');

  if (!isOpen) return null;

  const toggleUser = (id: string) => {
    setAssignedToIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const proj = projects.find(p => p.id === projectId);

    createTask({
      projectId,
      projectName: proj?.name || 'Project',
      title,
      description,
      priority,
      status,
      assignedTo: assignedToIds[0] || null,
      assignedToIds: assignedToIds.length > 0 ? assignedToIds : (currentUser?.id ? [currentUser.id] : []),
      dueDate
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="bg-slate-800/80 border-b border-slate-700 p-5 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <CheckSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Create New Task</h3>
              <p className="text-xs text-slate-400">Assign deliverables to single or multiple team members</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Target Project *</label>
            <select
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Task Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Write unit tests for JWT auth service"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Provide implementation details..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:border-blue-500 focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
              <UserPlus className="w-3.5 h-3.5 text-blue-400" />
              <span>Assignees (Select 1 or Multiple) *</span>
            </label>

            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-2 max-h-32 overflow-y-auto space-y-1">
              {activeUsers.map(u => {
                const selected = assignedToIds.includes(u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggleUser(u.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition ${
                      selected
                        ? 'bg-blue-500/20 text-blue-200 border border-blue-500/40 font-semibold'
                        : 'text-slate-400 hover:bg-slate-700/50 border border-transparent'
                    }`}
                  >
                    <span>{u.fullName} <span className="text-slate-500">({u.role})</span></span>
                    {selected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                  </button>
                );
              })}
            </div>
            {assignedToIds.length > 0 && (
              <p className="text-[10px] text-blue-400 mt-1">{assignedToIds.length} assignee{assignedToIds.length > 1 ? 's' : ''} selected (will replicate to all assigned users)</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as Priority)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as TaskStatus)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="NOT_STARTED">Not Started</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="BLOCKED">Blocked</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>


          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
