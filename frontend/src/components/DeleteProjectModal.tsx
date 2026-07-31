import React from 'react';
import { useApp } from '../context/AppContext';
import { Trash2, X, AlertTriangle } from 'lucide-react';
import type { Project } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

export const DeleteProjectModal: React.FC<Props> = ({ isOpen, onClose, project }) => {
  const { deleteProject } = useApp();

  if (!isOpen) return null;

  const handleDelete = async () => {
    await deleteProject(project.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="bg-rose-950/30 border-b border-rose-500/20 p-5 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Delete Project</h3>
              <p className="text-xs text-slate-400">This action cannot be undone</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-start space-x-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-200/80">
              Deleting <strong className="text-white">{project.name}</strong> will permanently remove this project along with all its tasks and assignments.
            </p>
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
              onClick={handleDelete}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition"
            >
              Delete Project
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
