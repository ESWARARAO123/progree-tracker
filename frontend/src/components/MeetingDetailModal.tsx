import React from 'react';
import { useApp } from '../context/AppContext';
import { CalendarDays, X, Clock, Link, UserCheck, Edit, Trash2, Calendar, FileText } from 'lucide-react';
import type { Meeting } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  meeting: Meeting;
  onEdit: () => void;
}

export const MeetingDetailModal: React.FC<Props> = ({ isOpen, onClose, meeting, onEdit }) => {
  const { deleteMeeting, users, currentUser } = useApp();
  const isAdmin = currentUser.role === 'ADMIN';

  if (!isOpen) return null;

  const assigneeNames = meeting.assigneeNames.length > 0
    ? meeting.assigneeNames
    : meeting.assigneeIds.map(id => users.find(u => u.id === id)?.fullName || id);

  const handleDelete = () => {
    if (confirm(`Delete "${meeting.title}" scheduled for ${meeting.date}?`)) {
      deleteMeeting(meeting.id);
      onClose();
    }
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
              <h3 className="font-bold text-lg text-white">Meeting Details</h3>
              <p className="text-xs text-slate-400">{meeting.date}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Title</label>
            <p className="text-sm font-semibold text-white">{meeting.title}</p>
          </div>

          {meeting.description && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Description</label>
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{meeting.description}</p>
            </div>
          )}

          {meeting.mom && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">Minutes of Meeting (MoM)</span>
              </div>
              <p className="text-sm text-emerald-200 whitespace-pre-wrap">{meeting.mom}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start space-x-2">
              <Calendar className="w-4 h-4 text-slate-500 mt-0.5" />
              <div>
                <span className="text-xs text-slate-500">Date</span>
                <p className="text-sm text-white font-medium">{meeting.date}</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <Clock className="w-4 h-4 text-slate-500 mt-0.5" />
              <div>
                <span className="text-xs text-slate-500">Time</span>
                <p className="text-sm text-white font-medium">
                  {meeting.startTime}
                  {meeting.endTime && ` – ${meeting.endTime}`}
                </p>
              </div>
            </div>
          </div>

          {meeting.meetingLink && (
            <div className="flex items-start space-x-2">
              <Link className="w-4 h-4 text-slate-500 mt-0.5" />
              <div className="flex-1">
                <span className="text-xs text-slate-500">Meeting Link</span>
                <a
                  href={meeting.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-indigo-400 hover:text-indigo-300 break-all"
                >
                  {meeting.meetingLink}
                </a>
              </div>
            </div>
          )}

          {assigneeNames.length > 0 && (
            <div className="flex items-start space-x-2">
              <UserCheck className="w-4 h-4 text-slate-500 mt-0.5" />
              <div className="flex-1">
                <span className="text-xs text-slate-500">Assignees</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {assigneeNames.map((name, i) => (
                    <span key={i} className="text-xs px-2 py-1 bg-slate-800 rounded-full text-slate-300">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-start space-x-2">
            <UserCheck className="w-4 h-4 text-slate-500 mt-0.5" />
            <div>
              <span className="text-xs text-slate-500">Created By</span>
              <p className="text-sm text-white font-medium">{meeting.createdByName || meeting.createdBy}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border-t border-slate-700 p-4 flex justify-between items-center">
          {isAdmin ? (
            <button
              onClick={handleDelete}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          ) : <span />}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Close
            </button>
            {isAdmin && (
              <button
                onClick={onEdit}
                className="flex items-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
