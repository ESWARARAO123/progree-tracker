import React, { useState, useRef } from 'react';
import { X, Upload, CheckSquare, Loader2, FileText, Image as ImageIcon } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import * as api from '../api';
import type { Task, TaskStatus } from '../types';

interface UpdateTaskStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
}

export const UpdateTaskStatusModal: React.FC<UpdateTaskStatusModalProps> = ({ isOpen, onClose, task }) => {
  const { updateTaskStatus } = useApp();
  const { token } = useAuth();
  const [status, setStatus] = useState<TaskStatus>('IN_PROGRESS');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (task) {
      setStatus(task.status);
      setSelectedFile(null);
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const isImageFile = (fileName?: string) => {
    if (!fileName) return false;
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext || '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let attachmentUrl = task.attachmentUrl;
      let attachmentName = task.attachmentName;

      if (selectedFile && token) {
        const uploadRes = await api.uploadFile(token, selectedFile);
        attachmentUrl = uploadRes.file_url;
        attachmentName = uploadRes.file_name;
      }

      await updateTaskStatus(task.id, status, attachmentUrl, attachmentName);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to update task status');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <CheckSquare className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-white text-base">Update Task Status & Proof</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Task Title</label>
            <div className="text-sm font-semibold text-white bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
              {task.title}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Select Status</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'NOT_STARTED', label: 'Todo', color: 'border-slate-600 bg-slate-800 text-slate-300' },
                { id: 'IN_PROGRESS', label: 'In Progress', color: 'border-blue-500/50 bg-blue-500/20 text-blue-300' },
                { id: 'BLOCKED', label: 'Blocked', color: 'border-rose-500/50 bg-rose-500/20 text-rose-300' },
                { id: 'COMPLETED', label: 'Completed', color: 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300' },
              ].map(item => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setStatus(item.id as TaskStatus)}
                  className={`p-3 rounded-xl text-xs font-semibold border text-center transition ${
                    status === item.id ? `${item.color} ring-2 ring-blue-500/30` : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Upload Proof (Screenshot / Docs)
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setSelectedFile(e.target.files[0]);
                }
              }}
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-blue-500 p-4 rounded-xl text-center cursor-pointer bg-slate-950/40 transition flex flex-col items-center space-y-2"
            >
              <Upload className="w-6 h-6 text-slate-400" />
              <span className="text-xs text-slate-300 font-medium">
                {selectedFile ? selectedFile.name : 'Click to select screenshot or document file'}
              </span>
              <span className="text-[10px] text-slate-500">Supports PNG, JPG, PDF, DOCX, etc.</span>
            </div>

            {selectedFile && (
              <div className="mt-2 flex items-center justify-between text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 p-2 rounded-lg">
                <div className="flex items-center space-x-2 truncate">
                  {isImageFile(selectedFile.name) ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                  <span className="truncate">{selectedFile.name}</span>
                </div>
                <button type="button" onClick={() => setSelectedFile(null)} className="text-slate-400 hover:text-rose-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {!selectedFile && task.attachmentUrl && (
              <div className="mt-2 text-xs text-slate-400">
                Current attachment:{' '}
                <a href={task.attachmentUrl} target="_blank" rel="noreferrer" className="text-blue-400 underline font-medium">
                  {task.attachmentName || 'View Attachment'}
                </a>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-lg shadow-blue-600/30 transition disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Save Status & Proof</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
