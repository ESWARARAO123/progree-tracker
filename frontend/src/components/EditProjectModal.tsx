import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Briefcase, X, UserPlus, Check } from 'lucide-react';
import type { Priority, ProjectStatus } from '../types';
import type { Project } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

export const EditProjectModal: React.FC<Props> = ({ isOpen, onClose, project }) => {
  const { updateProject, users, currentUser } = useApp();
  const assignableUsers = users.filter(u => u.isActive);

  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [startDate, setStartDate] = useState(project.startDate);
  const [endDate, setEndDate] = useState(project.endDate || '');
  const [priority, setPriority] = useState<Priority>(project.priority as Priority);
  const [status, setStatus] = useState<ProjectStatus>(project.status as ProjectStatus);
  const [ownerId, setOwnerId] = useState(project.owner?.id || '');
  const [githubUrl, setGithubUrl] = useState(project.githubUrl || '');
  const [sharepointUrl, setSharepointUrl] = useState(project.sharepointUrl || '');

  const [assignedIds, setAssignedIds] = useState<string[]>(() => project.assignedUsers ? project.assignedUsers.map(u => u.id) : []);

  if (!isOpen) return null;

  const toggleUser = (id: string) => {
    setAssignedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const payload: any = {
      name,
      description,
      startDate,
      endDate: endDate || null,
      priority,
      status,
      githubUrl: githubUrl || null,
      sharepointUrl: sharepointUrl || null,
    };
    if (currentUser.role === 'ADMIN') {
      payload.ownerId = ownerId || null;
      payload.assignedUserIds = assignedIds;
    }
    updateProject(project.id, payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="bg-slate-800/80 border-b border-slate-700 p-5 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Edit Project</h3>
              <p className="text-xs text-slate-400">Update project details, priority, and status</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Project Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:border-purple-500 focus:outline-none resize-none"
            />
          </div>

          {currentUser.role === 'ADMIN' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Project Owner</label>
              <select
                value={ownerId}
                onChange={e => setOwnerId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="">No owner</option>
                {assignableUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.fullName} ({u.role})</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Target End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as Priority)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
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
                onChange={e => setStatus(e.target.value as ProjectStatus)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="PLANNING">Planning</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">GitHub Repository URL</label>
              <input
                type="text"
                value={githubUrl}
                onChange={e => setGithubUrl(e.target.value)}
                placeholder="https://github.com/org/repo or git@github.com:org/repo.git"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">SharePoint Links (comma-separated)</label>
              <input
                type="text"
                value={sharepointUrl}
                onChange={e => setSharepointUrl(e.target.value)}
                placeholder="https://company.sharepoint.com/sites/project, https://..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          {currentUser.role === 'ADMIN' && (
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              <div className="flex items-center space-x-1.5">
                <UserPlus className="w-3.5 h-3.5" />
                <span>Assign Team Members / Users</span>
              </div>
            </label>
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-2 max-h-36 overflow-y-auto space-y-1">
              {assignableUsers.length === 0 ? (
                <p className="text-[11px] text-slate-500 py-2 text-center">No users available</p>
              ) : (
                assignableUsers.map(u => {
                  const selected = assignedIds.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => toggleUser(u.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition ${
                        selected
                          ? 'bg-purple-500/20 text-purple-200 border border-purple-500/30'
                          : 'text-slate-400 hover:bg-slate-700/50 border border-transparent'
                      }`}
                    >
                      <span>{u.fullName} <span className="text-slate-500">({u.role})</span></span>
                      {selected && <Check className="w-3.5 h-3.5 text-purple-400" />}
                    </button>
                  );
                })
              )}
            </div>
            {assignedIds.length > 0 && (
              <p className="text-[10px] text-purple-400 mt-1">{assignedIds.length} user{assignedIds.length > 1 ? 's' : ''} assigned</p>
            )}
          </div>
          )}

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
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30 transition"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
