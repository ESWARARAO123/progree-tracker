import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { FileText, Home, Plane, User as UserIcon, CheckCircle, Clock, CalendarDays } from 'lucide-react';
import { todayIST } from '../utils/date';
import type { RequestType, LeaveRequest } from '../types';

const REQUEST_TYPE_OPTIONS: { value: RequestType; label: string; description: string; icon: React.ReactNode }[] = [
  { value: 'LEAVE', label: 'Leave', description: 'Take paid/unpaid time off', icon: <Plane className="w-4 h-4" /> },
  { value: 'WFH', label: 'Work From Home', description: 'Work remotely from home', icon: <Home className="w-4 h-4" /> },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialUserId?: string;
  initialDate?: string;
  editLeave?: LeaveRequest | null;
}

export const LeaveRequestModal: React.FC<Props> = ({
  isOpen,
  onClose,
  initialUserId,
  initialDate,
  editLeave,
}) => {
  const { applyLeave, updateLeaveRequest, leaveBalance, currentUser, users } = useApp();
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
      if (editLeave) {
        setSelectedUserId(editLeave.userId);
        setRequestType(editLeave.requestType as RequestType);
        setStartDate(editLeave.startDate);
        setEndDate(editLeave.endDate);
        setReason(editLeave.reason || '');
        setAdminStatus(editLeave.status === 'APPROVED' ? 'APPROVED' : 'PENDING');
      } else {
        setSelectedUserId(initialUserId || currentUser.id);
        if (initialDate) {
          setStartDate(initialDate);
          setEndDate(initialDate);
        } else {
          setStartDate(todayIST());
          setEndDate(todayIST());
        }
        setRequestType('LEAVE');
        setReason('');
        setAdminStatus('APPROVED');
      }
    }
  }, [isOpen, initialUserId, initialDate, editLeave, currentUser.id]);

  const activeUsers = useMemo(() => (users || []).filter(u => u.isActive), [users]);
  const targetUser = useMemo(
    () => activeUsers.find(u => u.id === selectedUserId) || currentUser,
    [activeUsers, selectedUserId, currentUser]
  );

  if (!isOpen) return null;

  const isLeave = requestType === 'LEAVE';
  const selectedOption = REQUEST_TYPE_OPTIONS.find(o => o.value === requestType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    if (endDate < startDate) {
      alert('End date cannot be before start date.');
      return;
    }

    setSubmitting(true);
    try {
      if (editLeave) {
        // Update existing leave request (past or upcoming)
        await updateLeaveRequest(editLeave.id, {
          requestType,
          startDate,
          endDate,
          reason,
          status: isAdmin ? adminStatus : undefined,
        });
      } else {
        // Create new leave request (past dates allowed for everyone)
        await applyLeave({
          requestType,
          startDate,
          endDate,
          reason,
          userId: isAdmin ? selectedUserId : undefined,
          status: isAdmin ? adminStatus : undefined,
        });
      }
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
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-lg text-white">
                  {editLeave
                    ? 'Update Leave / WFH Record'
                    : isAdmin
                    ? selectedUserId === currentUser.id
                      ? 'Apply Leave (Admin)'
                      : `Record Leave for ${targetUser.fullName}`
                    : 'Apply Request'}
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Past Dates Allowed
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {editLeave
                  ? 'Update dates, type, or notes for this past or scheduled record'
                  : isAdmin
                  ? 'Submit or record leave/WFH for yourself or any team member'
                  : 'Submit request for past or future dates for approval'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* User selector for Admin when applying new leave */}
          {isAdmin && !editLeave && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Select Team Member *
              </label>
              <div className="relative">
                <select
                  value={selectedUserId}
                  onChange={e => setSelectedUserId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none appearance-none"
                >
                  <optgroup label="You (Admin)">
                    <option value={currentUser.id}>{currentUser.fullName} (You)</option>
                  </optgroup>
                  <optgroup label="All Team Members">
                    {activeUsers
                      .filter(u => u.id !== currentUser.id)
                      .map(u => (
                        <option key={u.id} value={u.id}>
                          {u.fullName} ({u.email}) - {u.designation || u.role}
                        </option>
                      ))}
                  </optgroup>
                </select>
                <UserIcon className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>
          )}

          {/* User badge when editing */}
          {editLeave && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/80">
              <div className="flex items-center space-x-2.5">
                <UserIcon className="w-4 h-4 text-blue-400" />
                <div>
                  <span className="text-xs font-semibold text-white">
                    {editLeave.userName || targetUser.fullName}
                  </span>
                  <div className="text-[10px] text-slate-400">Current status: {editLeave.status}</div>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Editing Record
              </span>
            </div>
          )}

          {/* Admin instant approval vs pending selector */}
          {isAdmin && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Record Status *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdminStatus('APPROVED')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-2 transition ${
                    adminStatus === 'APPROVED'
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-sm'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Approved (Instant)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAdminStatus('PENDING')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-2 transition ${
                    adminStatus === 'PENDING'
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-sm'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Pending Review</span>
                </button>
              </div>
            </div>
          )}

          {/* Request Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Request Type *</label>
            <div className="grid grid-cols-2 gap-2">
              {REQUEST_TYPE_OPTIONS.map(opt => {
                const selected = requestType === opt.value;
                return (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => setRequestType(opt.value)}
                    className={`p-3 rounded-xl border text-left flex flex-col transition ${
                      selected
                        ? 'bg-orange-500/20 border-orange-500/50 shadow-sm'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <span
                      className={`flex items-center space-x-1.5 font-semibold ${
                        selected ? 'text-orange-300' : 'text-slate-300'
                      }`}
                    >
                      {opt.icon}
                      <span>{opt.label}</span>
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1 leading-snug">
                      {opt.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date range pickers (past dates fully supported) */}
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

          {/* Past dates badge / note */}
          <div className="flex items-center space-x-2 text-[11px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3.5 py-2">
            <CalendarDays className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>
              <strong>Past leaves supported:</strong> You can apply or update records for any past date.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Reason *</label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder={`Provide clear details/justification for this ${selectedOption?.label.toLowerCase()} record...`}
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
              disabled={submitting || (!isAdmin && !editLeave && isLeave && leaveBalance?.available === 0)}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting
                ? 'Saving...'
                : editLeave
                ? 'Update Leave Record'
                : isAdmin
                ? adminStatus === 'APPROVED'
                  ? 'Record & Approve Leave'
                  : 'Submit Leave Request'
                : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
