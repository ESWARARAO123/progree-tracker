import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { PartyPopper, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  date: string;
}

export const CompanyHolidayModal: React.FC<Props> = ({ isOpen, onClose, date }) => {
  const { createCompanyHoliday } = useApp();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [holidayDate, setHolidayDate] = useState(date || new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setHolidayDate(date || new Date().toISOString().split('T')[0]);
    }
  }, [isOpen, date]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !holidayDate) return;
    createCompanyHoliday({
      name,
      description,
      date: holidayDate,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="bg-slate-800/80 border-b border-slate-700 p-5 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <PartyPopper className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Add Company Holiday</h3>
              <p className="text-xs text-slate-400">Official office holidays</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Holiday Date *</label>
            <input
              type="date"
              required
              value={holidayDate}
              onChange={e => setHolidayDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Holiday Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Diwali"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Note / Reason</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Optional details about the holiday..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:border-teal-500 focus:outline-none resize-none"
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
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-600/30 transition"
            >
              Add Holiday
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
