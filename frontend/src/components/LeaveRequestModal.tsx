import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FileText, Home, Building2, Plane, X } from 'lucide-react';
import type { RequestType } from '../types';

const REQUEST_TYPE_OPTIONS: { value: RequestType; label: string; description: string; icon: React.ReactNode }[] = [
  { value: 'LEAVE', label: 'Leave', description: 'Take paid/unpaid time off', icon: <Plane className="w-4 h-4" /> },
  { value: 'WFH', label: 'Work From Home', description: 'Work remotely from home', icon: <Home className="w-4 h-4" /> },
  { value: 'WFBO', label: 'Work From Bellandur Office', description: 'Work from the Bellandur office', icon: <Building2 className="w-4 h-4" /> },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const LeaveRequestModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { applyLeave, leaveBalance } = useApp();

  const [requestType, setRequestType] = useState<RequestType>('LEAVE');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const isLeave = requestType === 'LEAVE';
  const selectedOption = REQUEST_TYPE_OPTIONS.find(o => o.value === requestType);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    applyLeave({
      requestType,
      startDate,
      endDate,
      reason
    });
    onClose();
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
              <h3 className="font-bold text-lg text-white">Apply Request</h3>
              <p className="text-xs text-slate-400">Submit application for Admin approval</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {isLeave && leaveBalance && (
            <div className="flex items-center justify-between rounded-xl px-4 py-3 border text-xs bg-slate-800/60 border-slate-700 text-slate-300">
              <span className="font-semibold">{leaveBalance.month}</span>
              <span className="font-bold">
                {leaveBalance.usedLeave} leaves used this month
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Request Type *</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Reason *</label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder={`Provide clear justification for your ${selectedOption?.label.toLowerCase()} request...`}
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
              disabled={isLeave && leaveBalance?.available === 0}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
