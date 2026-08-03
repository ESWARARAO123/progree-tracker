import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Briefcase, X, CheckCircle2, UserPlus, Send } from 'lucide-react';

export const ProjectJoinBanner: React.FC = () => {
  const { currentUser, projects, projectRequests, selectProject, requestProjectAccess, requestToJoinProject, updatePreferences } = useApp();

  const [dismissed, setDismissed] = useState<boolean>(() => !!currentUser.preferences?.dismissedProjectBanner);
  const [requestedIds, setRequestedIds] = useState<Set<string>>(() => new Set(
    projectRequests.filter(r => r.userId === currentUser.id && r.status === 'PENDING').map(r => r.projectId)
  ));
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [requestedAdd, setRequestedAdd] = useState(false);

  if (currentUser.role !== 'EMPLOYEE' || currentUser.currentProjectId || dismissed) return null;

  const assignedProjectIds = new Set(
    projects
      .filter(p => p.assignedUsers.some(u => u.id === currentUser.id) || p.owner?.id === currentUser.id)
      .map(p => p.id)
  );

  const handleDismiss = () => {
    setDismissed(true);
    updatePreferences({ dismissedProjectBanner: true }).catch(() => { /* ignore */ });
  };

  const handleSelect = async (projectId: string) => {
    setSubmittingId(projectId);
    try {
      await selectProject(projectId);
    } catch { /* ignore */ } finally {
      setSubmittingId(null);
    }
  };

  const handleRequest = async (projectId: string) => {
    setSubmittingId(projectId);
    try {
      await requestProjectAccess(projectId);
      setRequestedIds(prev => new Set(prev).add(projectId));
    } finally {
      setSubmittingId(null);
    }
  };

  const handleRequestAdd = async () => {
    setSubmittingId('add');
    try {
      await requestToJoinProject();
      setRequestedAdd(true);
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-orange-950/30 to-amber-950/40 p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">You are not assigned to any project yet</h3>
            <p className="text-xs text-amber-200/70 mt-0.5">Select a project to join and start working, or request an admin to add you.</p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0"
          title="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2.5">
        {projects.length > 0 ? (
          projects.map(p => {
            const isAssigned = assignedProjectIds.has(p.id);
            const isSubmitting = submittingId === p.id;
            const isPending = requestedIds.has(p.id);
            return (
              <div key={p.id} className="flex items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-white truncate">{p.name}</span>
                    {isAssigned && (
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full shrink-0">
                        Assigned
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 truncate">
                    {p.description || `${p.progressPercentage}% complete · ${p.status}`}
                  </div>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  {isPending ? (
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Request Pending
                    </span>
                  ) : (
                    <>
                      {!isAssigned && (
                        <button
                          onClick={() => handleRequest(p.id)}
                          disabled={isSubmitting}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-white transition disabled:opacity-50 flex items-center space-x-1"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Request Access</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleSelect(p.id)}
                        disabled={isSubmitting}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition disabled:opacity-50 flex items-center space-x-1"
                      >
                        {isSubmitting ? (
                          <span className="w-3.5 h-3.5 border-2 border-emerald-300 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        <span>{isAssigned ? 'Select' : 'Join'}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3">
            <div className="text-sm font-semibold text-white">No active projects exist in the system yet</div>
            <div className="text-xs text-slate-400 mt-0.5">Please ask an admin to create a project or add you to one.</div>
          </div>
        )}

        {requestedAdd ? (
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold px-1">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Request sent! Admins have been notified to add you to a project.</span>
          </div>
        ) : (
          <button
            onClick={handleRequestAdd}
            disabled={submittingId === 'add'}
            className="flex items-center space-x-2 text-xs font-semibold text-amber-300 hover:text-amber-200 transition disabled:opacity-50 px-1 py-1"
          >
            {submittingId === 'add' ? (
              <span className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>{submittingId === 'add' ? 'Sending...' : 'Request Admin to add me to a project'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
