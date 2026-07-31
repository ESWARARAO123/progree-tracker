import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Briefcase, CheckCircle2, FolderPlus, ArrowRight } from 'lucide-react';

export const ProjectSelectionModal: React.FC = () => {
  const { currentUser, projects, selectProject, loading } = useApp();
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  if (currentUser.role !== 'EMPLOYEE' || currentUser.currentProjectId || loading) return null;

  const handleSelect = async (projectId: string) => {
    setSubmittingId(projectId);
    try {
      await selectProject(projectId);
    } catch (err: any) {
      alert(err.message || 'Failed to select project');
    } finally {
      setSubmittingId(null);
    }
  };

  const assignedProjectIds = new Set(
    projects
      .filter(p => p.assignedUsers.some(u => u.id === currentUser.id) || p.owner?.id === currentUser.id)
      .map(p => p.id)
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="bg-slate-800/80 border-b border-slate-700 p-5 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">Welcome back, {currentUser.fullName}</h3>
            <p className="text-xs text-slate-400">Select a project to join and start working today</p>
          </div>
        </div>

        <div className="p-5 max-h-[70vh] overflow-y-auto space-y-3">
          {projects.length === 0 ? (
            <div className="text-center py-8">
              <FolderPlus className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p className="text-sm text-slate-400">
                No active projects exist in the system yet. Please ask an admin to create a project.
              </p>
            </div>
          ) : (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Select an Existing Project to Join
              </p>
              <div className="space-y-2.5">
                {projects.map(p => {
                  const isAssigned = assignedProjectIds.has(p.id);
                  const isSubmitting = submittingId === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleSelect(p.id)}
                      disabled={isSubmitting}
                      className="w-full text-left bg-slate-800/60 border border-slate-700/80 hover:border-blue-500 hover:bg-slate-800 rounded-xl p-3.5 transition group flex items-center justify-between"
                    >
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-semibold text-white truncate group-hover:text-blue-300">
                            {p.name}
                          </p>
                          {isAssigned && (
                            <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full shrink-0">
                              Assigned
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                          {p.description || `${p.progressPercentage}% complete · ${p.status}`}
                        </p>
                      </div>
                      <div className="shrink-0">
                        {isSubmitting ? (
                          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                        ) : isAssigned ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        ) : (
                          <div className="flex items-center space-x-1 text-xs font-medium text-blue-400 group-hover:text-blue-300">
                            <span>Join</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
