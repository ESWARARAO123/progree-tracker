import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CheckSquare, X, UserPlus, Check } from 'lucide-react';
import type { Priority, TaskStatus, User } from '../types';


interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialProjectId?: string;
}

export const NewTaskModal: React.FC<Props> = ({ isOpen, onClose, initialProjectId }) => {
  const { createTask, projects, users, currentUser } = useApp();
  const activeUsers = users.filter(u => u.isActive);

  const isAdmin = currentUser?.role === 'ADMIN';
  const ownedProjectIds = new Set(
    projects.filter(p => p.owner?.id === currentUser?.id).map(p => p.id)
  );
  const memberProjectIds = new Set(
    projects.filter(p => p.assignedUsers.some(u => u.id === currentUser?.id)).map(p => p.id)
  );
  const visibleProjects = isAdmin
    ? projects
    : projects.filter(p => ownedProjectIds.has(p.id) || memberProjectIds.has(p.id));

  const initialProject =
    projects.find(p => p.id === (initialProjectId || currentUser?.currentProjectId || '')) ||
    projects.find(p => ownedProjectIds.has(p.id) || memberProjectIds.has(p.id)) ||
    projects[0];

  const [projectId, setProjectId] = useState(initialProject?.id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [status, setStatus] = useState<TaskStatus>('NOT_STARTED');
  const [assignedToIds, setAssignedToIds] = useState<string[]>(() => currentUser?.id ? [currentUser.id] : []);
  const [dueDate, setDueDate] = useState('');

  const selectedProject = projects.find(p => p.id === projectId);
  const isOwnerOfSelected = !!selectedProject && selectedProject.owner?.id === currentUser?.id;

  let assigneeCandidates: User[];
  if (isAdmin) {
    assigneeCandidates = activeUsers;
  } else if (isOwnerOfSelected) {
    assigneeCandidates = selectedProject.assignedUsers.filter(u => u.isActive);
    if (!assigneeCandidates.some(u => u.id === currentUser?.id) && currentUser) {
      assigneeCandidates = [...assigneeCandidates, currentUser];
    }
  } else {
    assigneeCandidates = currentUser ? [currentUser] : [];
  }

  if (!isOpen) return null;

  const toggleUser = (id: string) => {
    setAssignedToIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleProjectChange = (id: string) => {
    setProjectId(id);
    const p = projects.find(x => x.id === id);
    const owned = !!p && p.owner?.id === currentUser?.id;
    let allowed: Set<string>;
    if (isAdmin) {
      allowed = new Set(activeUsers.map(u => u.id));
    } else if (owned && p) {
      allowed = new Set(p.assignedUsers.map(u => u.id));
      if (currentUser?.id) allowed.add(currentUser.id);
    } else {
      allowed = new Set(currentUser?.id ? [currentUser.id] : []);
    }
    setAssignedToIds(prev => {
      const kept = prev.filter(x => allowed.has(x));
      return kept.length > 0 ? kept : (currentUser?.id ? [currentUser.id] : []);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const proj = projects.find(p => p.id === projectId);

    createTask({
      projectId,
      projectName: projectId ? (proj?.name || 'Project') : 'Others',
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
              onChange={e => handleProjectChange(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
            >
              {visibleProjects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
              <option value="">Others (no specific project)</option>
            </select>
            {visibleProjects.length === 0 && (
              <p className="text-[10px] text-amber-400 mt-1">You are not assigned to any project yet. Ask an admin to add you.</p>
            )}
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
              {assigneeCandidates.map(u => {
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
              {assigneeCandidates.length === 0 && (
                <p className="text-[10px] text-slate-500 px-2 py-1">No assignable users.</p>
              )}
            </div>
            {assignedToIds.length > 0 && (
              <p className="text-[10px] text-blue-400 mt-1">{assignedToIds.length} assignee{assignedToIds.length > 1 ? 's' : ''} selected (will replicate to all assigned users)</p>
            )}
            {!isAdmin && !isOwnerOfSelected && (
              <p className="text-[10px] text-slate-500 mt-1">Only admins and project owners can assign tasks to other team members.</p>
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
