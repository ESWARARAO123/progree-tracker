import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Sun, X, CheckCircle, AlertTriangle } from 'lucide-react';
import { todayStr } from '../utils/date';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const MorningUpdateModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { projects, tasks, submitMorningUpdate, currentUser, updates } = useApp();
  
  const userTodayUpdate = updates.find(u => u.userId === currentUser.id && u.reportDate === todayStr());
  const isAlreadySubmitted = !!userTodayUpdate?.morningSubmittedAt;

  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [primaryTask, setPrimaryTask] = useState('');
  const [plannedWork, setPlannedWork] = useState('');
  const [estHours, setEstHours] = useState(8.0);
  const [blockers, setBlockers] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plannedWork.trim()) return;

    // Try to find a matching task by title (case-insensitive)
    const matchedTask = tasks.find(t => t.title.toLowerCase() === primaryTask.trim().toLowerCase());

    submitMorningUpdate({
      projectId,
      taskId: matchedTask ? matchedTask.id : null,
      taskTitle: primaryTask.trim() || undefined,
      plannedWork,
      estHours: Number(estHours),
      blockers
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900/40 to-teal-900/40 border-b border-emerald-500/20 p-5 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sun className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Submit Morning Update</h3>
              <p className="text-xs text-slate-300">Set today's commitment & planned work (9 AM - 12 PM window)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {isAlreadySubmitted ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-7 h-7" />
            </div>
            <h4 className="font-semibold text-white">Morning Update Already Submitted</h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              You submitted your morning report today at <strong className="text-emerald-400">{userTodayUpdate.morningSubmittedAt}</strong>. You can edit this entry until 10:00 PM lock time.
            </p>
            <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-xl text-left text-xs space-y-2">
              <div><span className="text-slate-400">Planned Work:</span> <span className="text-white">{userTodayUpdate.morningPlannedWork}</span></div>
              <div><span className="text-slate-400">Est. Hours:</span> <span className="text-emerald-300 font-semibold">{userTodayUpdate.morningEstHours} hrs</span></div>
            </div>
            <button onClick={onClose} className="px-5 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700 transition">
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Select Project *</label>
              <select
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.priority})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Primary Task *</label>
              <input
                type="text"
                required
                value={primaryTask}
                onChange={e => setPrimaryTask(e.target.value)}
                placeholder="e.g. Implement user authentication"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Planned Work for Today *</label>
              <textarea
                required
                rows={3}
                value={plannedWork}
                onChange={e => setPlannedWork(e.target.value)}
                placeholder="Detail deliverables, features to build, or tasks to complete..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Estimated Hours *</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="14"
                  value={estHours}
                  onChange={e => setEstHours(parseFloat(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Initial Status</label>
                <div className="px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-xl text-xs text-emerald-400 font-semibold flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>IN_PROGRESS</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Potential Blockers / Dependencies (Optional)</label>
              <input
                type="text"
                value={blockers}
                onChange={e => setBlockers(e.target.value)}
                placeholder="e.g. Waiting on API credentials or Figma design..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-2 text-[11px] text-amber-400/90 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Submissions lock permanently at 10:00 PM today.</span>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition"
              >
                Submit Morning Report
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
