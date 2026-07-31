import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Moon, X, CheckCircle, AlertCircle } from 'lucide-react';
import { todayStr } from '../utils/date';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const EveningUpdateModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { submitEveningUpdate, currentUser, updates } = useApp();

  const userTodayUpdate = updates.find(u => u.userId === currentUser.id && u.reportDate === todayStr());
  const isMorningDone = !!userTodayUpdate?.morningSubmittedAt;
  const isEveningDone = !!userTodayUpdate?.eveningSubmittedAt;

  const [completedWork, setCompletedWork] = useState('');
  const [remainingWork, setRemainingWork] = useState('');
  const [hoursSpent, setHoursSpent] = useState(8.0);
  const [challenges, setChallenges] = useState('');
  const [nextDayPlan, setNextDayPlan] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completedWork.trim()) return;
    submitEveningUpdate({
      completedWork,
      remainingWork,
      hoursSpent: Number(hoursSpent),
      challenges,
      nextDayPlan
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border-b border-blue-500/20 p-5 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Moon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Submit Evening Update</h3>
              <p className="text-xs text-slate-300">Wrap up daily accomplishments (4 PM - 10 PM window)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {!isMorningDone ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h4 className="font-semibold text-white">Morning Update Pending</h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Please submit your Morning Update first before submitting your Evening Update.
            </p>
            <button onClick={onClose} className="px-5 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700 transition">
              Close
            </button>
          </div>
        ) : isEveningDone ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-7 h-7" />
            </div>
            <h4 className="font-semibold text-white">Evening Update Already Submitted</h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Submitted today at <strong className="text-blue-400">{userTodayUpdate.eveningSubmittedAt}</strong>. Editable until 10 PM lock trigger.
            </p>
            <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-xl text-left text-xs space-y-2">
              <div><span className="text-slate-400">Completed Work:</span> <span className="text-white">{userTodayUpdate.eveningCompletedWork}</span></div>
              <div><span className="text-slate-400">Hours Spent:</span> <span className="text-blue-300 font-semibold">{userTodayUpdate.eveningHoursSpent} hrs</span></div>
              <div><span className="text-slate-400">Next Day Plan:</span> <span className="text-slate-300">{userTodayUpdate.eveningNextDayPlan}</span></div>
            </div>
            <button onClick={onClose} className="px-5 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700 transition">
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Completed Work Today *</label>
              <textarea
                required
                rows={3}
                value={completedWork}
                onChange={e => setCompletedWork(e.target.value)}
                placeholder="Detail actual accomplishments, code commits, tests passed, or documents created..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Remaining Work / Unfinished Tasks</label>
              <input
                type="text"
                value={remainingWork}
                onChange={e => setRemainingWork(e.target.value)}
                placeholder="Describe items carried over to tomorrow..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Actual Time Spent (Hours) *</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="14"
                  value={hoursSpent}
                  onChange={e => setHoursSpent(parseFloat(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Challenges / Roadblocks</label>
                <input
                  type="text"
                  value={challenges}
                  onChange={e => setChallenges(e.target.value)}
                  placeholder="Optional notes on unexpected delays..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Preliminary Plan for Next Working Day *</label>
              <textarea
                required
                rows={2}
                value={nextDayPlan}
                onChange={e => setNextDayPlan(e.target.value)}
                placeholder="Key goals for tomorrow morning..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none resize-none"
              />
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
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition"
              >
                Submit Evening Wrap-Up
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
