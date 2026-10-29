import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { FileText, Home, Plane, X, User as UserIcon, CheckCircle, Clock } from 'lucide-react';
import { todayIST } from '../utils/date';
import type { RequestType } from '../types';

const REQUEST_TYPE_OPTIONS: { value: RequestType; label: string; description: string; icon: React.ReactNode }[] = [
  { value: 'LEAVE', label: 'Leave', description: 'Take paid/unpaid time off', icon: <Plane className="w-4 h-4" /> },
  { value: 'WFH', label: 'Work From Home', description: 'Work remotely from home', icon: <Home className="w-4 h-4" /> },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialUserId?: string;
  initialDate?: string;
}

export const LeaveRequestModal: React.FC<Props> = ({ isOpen, onClose, initialUserId, initialDate }) => {
  const { applyLeave, leaveBalance, currentUser, users } = useApp();
  const isAdmin = currentUser.role === 'ADMIN';

  const [selectedUserId, setSelectedUserId] = useState<string>(initialUserId || currentUser.id);
  const [requestType, setRequestType] = useState<RequestType>('LEAVE');
  const [startDate, setStartDate] = useState(initialDate || todayIST());
  const [endDate, setEndDate] = useState(initialDate || todayIST());
  const [reason, setReason] = useState('');
  const [adminStatus, setAdminStatus] = useState<'APPROVED' | 'PENDING'>('APPROVED');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedUserId(initialUserId || currentUser.id);
      if (initialDate) {
        setStartDate(initialDate);
        setEndDate(initialDate);
      } else {
        setStartDate(todayIST());
        setEndDate(todayIST());
      }
      setReason('');
      setAdminStatus('APPROVED');
    }
  }, [isOpen, initialUserId, initialDate, currentUser.id]);

  const activeUsers = useMemo(() => (users || []).filter(u => u.isActive), [users]);
  const targetUser = useMemo(() => activeUsers.find(u => u.id === selectedUserId) || currentUser, [activeUsers, selectedUserId, currentUser]);

  if (!isOpen) return null;

  const minStartDate = isAdmin ? undefined : todayIST();
  const isLeave = requestType === 'LEAVE';
  const selectedOption = REQUEST_TYPE_OPTIONS.find(o => o.value === requestType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    if (!isAdmin && startDate < todayIST()) {
      alert('Past dates are not allowed. Request must start from today or later.');
      return;
    }
    if (endDate < startDate) {
      alert('End date cannot be before start date.');
      return;
    }
    setSubmitting(true);
    try {
      await applyLeave({
        requestType,
        startDate,
        endDate,
        reason,
        userId: isAdmin ? selectedUserId : undefined,
        status: isAdmin ? adminStatus : undefined,
      });
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
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
              <h3 className="font-bold text-lg text-white">
                {isAdmin ? (selectedUserId === currentUser.id ? 'Apply Leave (Admin)' : `Record Leave for ${targetUser.fullName}`) : 'Apply Request'}
              </h3>
              <p className="text-xs text-slate-400">
                {isAdmin
                  ? 'Submit or record leave/WFH for yourself or any team member'
                  : 'Submit application for Admin approval'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Admin Employee Selection */}
          {isAdmin && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-orange-400" />
                  <span>Employee / User *</span>
                </label>
                {selectedUserId !== currentUser.id && (
                  <span className="text-[10px] text-orange-400 font-medium bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                    Applying for team member
                  </span>
                )}
              </div>
              <select
                value={selectedUserId}
                onChange={e => setSelectedUserId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:border-orange-500 focus:outline-none"
              >
                <option value={currentUser.id}>
                  {currentUser.fullName} ({currentUser.email}) — Myself (Admin)
                </option>
                <optgroup label="Active Team Members">
                  {activeUsers
                    .filter(u => u.id !== currentUser.id)
                    .sort((a, b) => a.fullName.localeCompare(b.fullName))
                    .map(u => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.email}){u.department ? ` • ${u.department}` : ''}{u.designation ? ` (${u.designation})` : ''}
                      </option>
                    ))}
                </optgroup>
              </select>
            </div>
          )}

          {/* Admin Status Selection */}
          {isAdmin && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Approval Status</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdminStatus('APPROVED')}
                  className={`flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition ${
                    adminStatus === 'APPROVED'
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-sm'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Approved (Instant)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAdminStatus('PENDING')}
                  className={`flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition ${
                    adminStatus === 'PENDING'
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pending Review</span>
                </button>
              </div>
            </div>
          )}

          {!isAdmin && isLeave && leaveBalance && (
            <div className="flex items-center justify-between rounded-xl px-4 py-3 border text-xs bg-slate-800/60 border-slate-700 text-slate-300">
              <span className="font-semibold">{leaveBalance.month}</span>
              <span className="font-bold">
                {leaveBalance.usedLeave} leaves used this month
              </span>
            </div>
          )}

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
                min={minStartDate}
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
              >
              </input>
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
              >
              </input>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 bg-slate-800/60 border border-slate-700/80 rounded-xl px-3 py-2">
            <FileText className="w-3.5 h-3.5 shrink-0 text-orange-400" />
            <span>
              {isAdmin
                ? 'As Admin, you can add requests for any user, including retrospective entries.'
                : 'Requests can be applied from today onwards. Past dates are not allowed.'}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Reason *</label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder={`Provide clear justification for this ${selectedOption?.label.toLowerCase()} request...`}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:border-orange-500 focus:outline-none resize-none"
            />
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
              disabled={submitting || (!isAdmin && isLeave && leaveBalance?.available === 0)}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : isAdmin ? (adminStatus === 'APPROVED' ? 'Record & Approve Leave' : 'Submit Leave Request') : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
