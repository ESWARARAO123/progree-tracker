import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { CalendarDays, X, UserCheck, Link, Clock, FileText } from 'lucide-react';
import type { Meeting } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  meeting?: Meeting | null;
}

export const PlanMeetingModal: React.FC<Props> = ({ isOpen, onClose, date, meeting }) => {
  const { createMeeting, updateMeeting, users } = useApp();
  const assignableUsers = users.filter(u => u.isActive);
  const isEdit = !!meeting;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [meetingDate, setMeetingDate] = useState(date);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [mom, setMom] = useState('');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);

  useEffect(() => {
    if (meeting) {
      setTitle(meeting.title);
      setDescription(meeting.description || '');
      setMeetingDate(meeting.date);
      setStartTime(meeting.startTime);
      setEndTime(meeting.endTime || '');
      setMeetingLink(meeting.meetingLink || '');
      setMom(meeting.mom || '');
      setAssigneeIds(meeting.assigneeIds);
    } else {
      setTitle('');
      setDescription('');
      setMeetingDate(date || new Date().toISOString().split('T')[0]);
      setStartTime('10:00');
      setEndTime('');
      setMeetingLink('');
      setMom('');
      setAssigneeIds([]);
    }
  }, [meeting, date]);

  if (!isOpen) return null;

  const toggleUser = (id: string) => {
    setAssigneeIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSelectAdd = (userId: string) => {
    if (!userId) return;
    if (!assigneeIds.includes(userId)) {
      setAssigneeIds(prev => [...prev, userId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startTime || !meetingDate) return;
    const payload = {
      title,
      description,
      date: meetingDate,
      startTime,
      endTime: endTime || undefined,
      meetingLink: meetingLink || undefined,
      mom: mom || undefined,
      assigneeIds,
    };
    if (isEdit && meeting) {
      await updateMeeting(meeting.id, payload);
    } else {
      await createMeeting(payload);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="bg-slate-800/80 border-b border-slate-700 p-5 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">{isEdit ? 'Edit Meeting' : 'Plan Meeting'}</h3>
              <p className="text-xs text-slate-400">Schedule meetings for team members</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Meeting Date *</label>
            <input
              type="date"
              required
              value={meetingDate}
              onChange={e => setMeetingDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Meeting Name *</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Sprint Planning"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Agenda, goals, and context..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Start Time *</span>
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5" />
                <span>End Time</span>
              </label>
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center space-x-1">
              <Link className="w-3.5 h-3.5" />
              <span>Meeting Link (Optional)</span>
            </label>
            <input
              type="url"
              value={meetingLink}
              onChange={e => setMeetingLink(e.target.value)}
              placeholder="https://meet.google.com/..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center space-x-1">
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Minutes of Meeting (MoM)</span>
            </label>
            <textarea
              rows={3}
              value={mom}
              onChange={e => setMom(e.target.value)}
              placeholder="Key decisions, action items, discussion points..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:border-emerald-500 focus:outline-none resize-none"
            />
            <p className="text-[10px] text-slate-500 mt-1">Visible to all meeting assignees</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center space-x-1.5">
              <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Select Assignees *</span>
            </label>
            {assignableUsers.length === 0 ? (
              <p className="text-xs text-slate-500">No active users available.</p>
            ) : (
              <div className="space-y-2">
                <select
                  defaultValue=""
                  onChange={e => {
                    handleSelectAdd(e.target.value);
                    e.target.value = '';
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none cursor-pointer"
                >
                  <option value="" disabled>-- Select user to add --</option>
                  {assignableUsers.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.role})
                    </option>
                  ))}
                </select>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                  {assignableUsers.map(u => {
                    const checked = assigneeIds.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => toggleUser(u.id)}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-semibold transition ${
                          checked
                            ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-sm'
                            : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <span className={`w-2 h-2 rounded-full ${checked ? 'bg-indigo-400' : 'bg-slate-600'}`} />
                          <span className="truncate">{u.fullName}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 ml-1 shrink-0">{u.role}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
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
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition"
            >
              {isEdit ? 'Update Meeting' : 'Schedule Meeting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
