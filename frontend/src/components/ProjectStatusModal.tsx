import React, { useEffect, useRef, useState } from 'react';
import { X, MessageSquare, Calendar, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { Project } from '../types';

interface ProjectStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onSave: (projectId: string, status: string) => void;
}

export const ProjectStatusModal: React.FC<ProjectStatusModalProps> = ({
  isOpen,
  onClose,
  project,
  onSave,
}) => {
  const { token } = useAuth();
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<{status: string; date: string}[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setStatus('');
      loadHistory();
      setTimeout(() => textareaRef.current?.focus(), 100);
    } else {
      setStatus('');
      setHistory([]);
    }
  }, [isOpen, project?.id]);

  const loadHistory = async () => {
    if (!token || !project) return;
    try {
      setLoadingHistory(true);
      // Try to get project history from API
      // For now, use the current ownerStatus as the only entry
      // In future, this could fetch from a dedicated history endpoint
      if (project.ownerStatus) {
        setHistory([{
          status: project.ownerStatus,
          date: project.ownerStatusUpdatedAt || new Date().toISOString()
        }]);
      }
    } catch (err) {
      console.error('Failed to load status history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!status.trim() || !project) return;
    setSubmitting(true);
    try {
      await onSave(project.id, status.trim());
      onClose(); // Only close on success
    } catch (err) {
      console.error('Failed to save:', err);
      // Keep modal open on error
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !project) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col h-[70vh] max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Project Updates</h3>
              <p className="text-xs text-slate-400">{project.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            disabled={submitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Previous Updates */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>Previous Updates</span>
            </h4>
            {loadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 text-slate-500 space-y-2">
                <MessageSquare className="w-10 h-10 mx-auto text-slate-600 opacity-60" />
                <p className="text-sm">No previous updates</p>
              </div>
            ) : (
              history.map((entry, idx) => (
                <div key={idx} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 space-y-2">
                  <p className="text-sm text-slate-300 whitespace-pre-line">{entry.status}</p>
                  <p className="text-[10px] text-slate-500 flex items-center space-x-1">
                    <Calendar className="w-2.5 h-2.5" />
                    <span>{new Date(entry.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </p>
                </div>
              ))
            )}
          </div>

          {/* New Update Input */}
          <form onSubmit={handleSubmit} className="space-y-4 border-t border-slate-800 pt-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>Add New Update</span>
            </h4>
            <div className="space-y-2">
              <textarea
                ref={textareaRef}
                value={status}
                onChange={e => setStatus(e.target.value)}
                rows={4}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none resize-none"
                placeholder="Enter your project status update..."
                disabled={submitting}
              />
              <p className="text-[10px] text-slate-500 flex justify-between">
                <span>{status.length}/2000 characters</span>
                <span>Date: {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition disabled:opacity-50"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
                disabled={submitting || !status.trim()}
              >
                {submitting ? 'Saving...' : 'Add Update'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};