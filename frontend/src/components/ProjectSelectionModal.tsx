import React from 'react';
import { useApp } from '../context/AppContext';
import { Briefcase, CheckCircle2, XCircle } from 'lucide-react';

export const ProjectSelectionModal: React.FC = () => {
  const { currentUser, projects, selectProject, loading } = useApp();

  if (currentUser.role !== 'EMPLOYEE' || currentUser.currentProjectId || loading) return null;

  const myProjects = projects.filter(p =>
    p.assignedUsers.some(u => u.id === currentUser.id) || p.owner?.id === currentUser.id
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="bg-slate-800/80 border-b border-slate-700 p-5 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">Welcome back, {currentUser.fullName}</h3>
            <p className="text-xs text-slate-400">Select the project you're working on today</p>
          </div>
        </div>

        <div className="p-6 space-y-3">
          {myProjects.length === 0 ? (
            <div className="text-center py-8">
              <XCircle className="w-10 h-10 mx-auto text-slate-600" />
              <p className="text-sm text-slate-400 mt-3">
                You're not assigned to any project yet. Contact your admin to get added, or request access from the Projects page.
              </p>
            </div>
          ) : (
            myProjects.map(p => (
              <button
                key={p.id}
                onClick={() => selectProject(p.id)}
                className="w-full text-left bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 hover:border-purple-500 hover:bg-slate-800 transition group"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate group-hover:text-purple-300">{p.name}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{p.progressPercentage}% complete · {p.status}</p>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-slate-600 group-hover:text-emerald-400 shrink-0" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
