import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { FileText, Home, Plane, X, UserPlus } from 'lucide-react';
import { todayIST } from '../utils/date';
import * as api from '../api';
import type { RequestType } from '../types';

const REQUEST_TYPE_OPTIONS: { value: RequestType; label: string; description: string; icon: React.ReactNode }[] = [
  { value: 'LEAVE', label: 'Leave', description: 'Take paid/unpaid time off', icon: <Plane className="w-4 h-4" /> },
  { value: 'WFH', label: 'Work From Home', description: 'Work remotely from home', icon: <Home className="w-4 h-4" /> },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export const ProjectOwnerLeaveModal: React.FC<Props> = ({ isOpen, onClose, projectId }) => {
  const { token } = useAuth();
  const { projects } = useApp();
  const [requestType, setRequestType] = useState<RequestType>('LEAVE');
  const [startDate, setStartDate] = useState(todayIST());
  const [endDate, setEndDate] = useState(todayIST());
  const [reason, setReason] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const project = projects.find(p => p.id === projectId);
  const projectUsers = project?.assignedUsers.filter(u => u.isActive) || [];

  if (!isOpen) return null;

  const selectedOption = REQUEST_TYPE_OPTIONS.find(o => o.value === requestType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    if (selectedUserIds.length === 0) {
      setError('Please select at least one user');
      return;
    }
    if (endDate < startDate) {
      setError('End date cannot be before start date');
      return;
    }
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      for (const userId of selectedUserIds) {
        await api.applyLeave(token, {
          requestType,
          startDate,
          endDate,
          reason,
          user_id: userId,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = (id: string) => {
    setSelectedUserIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="bg-slate-800/80 border-b border-slate-700 p-5 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Add Leave/WFH for Team</h3>
              <p className="text-xs text-slate-400">Submit requests for your project team members</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Team Members *</label>
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-2 max-h-32 overflow-y-auto space-y-1">
              {projectUsers.map(u => {
                const selected = selectedUserIds.includes(u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggleUser(u.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition ${
                      selected
                        ? 'bg-orange-500/20 text-orange-200 border border-orange-500/40 font-semibold'
                        : 'text-slate-400 hover:bg-slate-700/50 border border-transparent'
                    }`}
                  >
                    <span>{u.fullName} <span className="text-slate-500">({u.role})</span></span>
                    {selected && <UserPlus className="w-3.5 h-3.5 text-orange-400" />}
                  </button>
                );
              })}
              {projectUsers.length === 0 && (
                <p className="text-[10px] text-slate-500 px-2 py-1">No active team members in this project.</p>
              )}
            </div>
            {selectedUserIds.length > 0 && (
              <p className="text-[10px] text-orange-400 mt-1">{selectedUserIds.length} member{selectedUserIds.length > 1 ? 's' : ''} selected</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Request Type *</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {REQUEST_TYPE_OPTIONS.map(opt => {
                const selected = requestType === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRequestType(opt.value)}
                    className={`flex flex-col items-start text-left px-3 py-2.5 rounded-xl border text-xs transition ${
                      selected
                        ? 'bg-orange-500/15 border-orange-500/50 text-white'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <span className={`flex items-center space-x-1.5 font-semibold ${selected ? 'text-orange-300' : 'text-slate-300'}`}>
                      {opt.icon}
                      <span>{opt.label}</span>
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1 leading-snug">{opt.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">End Date *</label>
              <input
                type="date"
                required
                min={startDate}
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 bg-slate-800/60 border border-slate-700/80 rounded-xl px-3 py-2">
            <FileText className="w-3.5 h-3.5 shrink-0 text-orange-400" />
            <span>Requests can be applied from today onwards. Past dates are not allowed.</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Reason *</label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder={`Provide clear justification for the ${selectedOption?.label.toLowerCase()} request...`}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:border-orange-500 focus:outline-none resize-none"
            />
          </div>

          {error && (
            <div className="text-[11px] text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2 flex items-center space-x-1.5">
              <X className="w-3.5 h-3.5" />
              <span>{error}</span>
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
              disabled={loading || selectedUserIds.length === 0}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit for Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};