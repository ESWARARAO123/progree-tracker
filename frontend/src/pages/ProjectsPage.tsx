import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Briefcase, Calendar, AlertCircle, Pencil, Trash2, MoreVertical, CheckCircle2, UserCircle2, Check, X, Clock, MessageSquare } from 'lucide-react';
import { NewProjectModal } from '../components/NewProjectModal';
import { EditProjectModal } from '../components/EditProjectModal';
import { DeleteProjectModal } from '../components/DeleteProjectModal';
import { ProjectChatModal } from '../components/ProjectChatModal';
import type { Project } from '../types';

export const ProjectsPage: React.FC = () => {
  const { projects, currentUser, loading, selectProject, requestProjectAccess, reviewProjectRequest, projectRequests } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [chatProject, setChatProject] = useState<Project | null>(null);
  const [menuProjectId, setMenuProjectId] = useState<string | null>(null);
  const [requestingId, setRequestingId] = useState<string | null>(null);

  const isAdmin = currentUser.role === 'ADMIN';
  const pendingRequests = projectRequests.filter(r => r.status === 'PENDING');

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuProjectId && !(e.target as HTMLElement).closest('[data-project-menu]')) {
        setMenuProjectId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuProjectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  const alreadyRequested = (projectId: string) =>
    projectRequests.some(r => r.projectId === projectId && r.status === 'PENDING');

  const handleRequest = async (projectId: string) => {
    setRequestingId(projectId);
    try {
      await requestProjectAccess(projectId);
    } finally {
      setRequestingId(null);
    }
  };

  const renderProjectCard = (p: Project) => {
    const isMine = p.assignedUsers.some(u => u.id === currentUser.id);
    const isSelected = currentUser.currentProjectId === p.id;
    const isOwner = p.owner?.id === currentUser.id;
    const requested = alreadyRequested(p.id);

    return (
      <div key={p.id} className={`glass-panel p-5 rounded-2xl border space-y-4 flex flex-col justify-between transition ${isSelected ? 'border-emerald-500/50 bg-emerald-500/[0.04]' : 'border-slate-800 hover:border-slate-700'}`}>
        <div className="space-y-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-2">
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                p.priority === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                p.priority === 'HIGH' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                'bg-blue-500/20 text-blue-300 border-blue-500/30'
              }`}>
                {p.priority} PRIORITY
              </span>
              {isOwner && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  OWNED
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {p.status}
              </span>

              {isAdmin && (
                <div className="relative" data-project-menu>
                  <button
                    onClick={() => setMenuProjectId(menuProjectId === p.id ? null : p.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 transition"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>

                  {menuProjectId === p.id && (
                    <div className="absolute right-0 top-8 w-40 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-30 p-1.5">
                      <button
                        onClick={() => { setEditingProject(p); setMenuProjectId(null); }}
                        className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-lg text-xs text-slate-300 hover:bg-slate-700 transition"
                      >
                        <Pencil className="w-3.5 h-3.5 text-purple-400" />
                        <span>Edit Project</span>
                      </button>
                      <button
                        onClick={() => { setDeletingProject(p); setMenuProjectId(null); }}
                        className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Project</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-bold text-base text-white">{p.name}</h3>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{p.description}</p>
          </div>

          {p.owner && (
            <div className="flex items-center space-x-2 text-[11px] text-slate-400 bg-slate-800/50 border border-slate-700/60 rounded-lg px-2.5 py-1.5">
              <UserCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="truncate">Owner: <span className="text-slate-200 font-semibold">{p.owner.fullName}</span></span>
            </div>
          )}

          {/* Progress bar */}
          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Overall Progress</span>
              <span className="font-bold text-white">{p.progressPercentage}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full" style={{ width: `${p.progressPercentage}%` }} />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{p.startDate} - {p.endDate}</span>
            </div>

            {p.overdueTasksCount > 0 && (
              <span className="flex items-center space-x-1 text-rose-400 font-semibold bg-rose-500/10 px-2 py-0.5 rounded text-[10px]">
                <AlertCircle className="w-3 h-3" />
                <span>{p.overdueTasksCount} Overdue</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setChatProject(p)}
              className="flex-1 px-3 py-2 rounded-xl bg-blue-600/20 border border-blue-500/30 hover:bg-blue-600/30 text-blue-300 text-xs font-semibold flex items-center justify-center space-x-1.5 transition"
            >
              <MessageSquare className="w-4 h-4 text-blue-400" />
              <span>Project Chat</span>
            </button>

            {!isAdmin && (
              <>
                {isSelected ? (
                  <span className="px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center justify-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Active</span>
                  </span>
                ) : isMine || isOwner ? (
                  <button
                    onClick={() => selectProject(p.id)}
                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center space-x-1 transition"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Select</span>
                  </button>
                ) : requested ? (
                  <span className="px-3 py-2 rounded-xl text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                    Pending
                  </span>
                ) : (
                  <button
                    onClick={() => handleRequest(p.id)}
                    disabled={requestingId === p.id}
                    className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold flex items-center justify-center space-x-1 transition disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Join</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderCompactProjectCard = (p: Project) => {
    const isSelected = currentUser.currentProjectId === p.id;
    const requested = alreadyRequested(p.id);

    return (
      <div key={p.id} className={`glass-panel p-4 rounded-2xl border space-y-3 transition ${isSelected ? 'border-emerald-500/50 bg-emerald-500/[0.04]' : 'border-slate-800 hover:border-slate-700'}`}>
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <h4 className="font-semibold text-sm text-white truncate">{p.name}</h4>
            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{p.description || 'No description'}</p>
          </div>
          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 shrink-0">{p.status}</span>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>Progress</span>
            <span className="font-semibold text-white">{p.progressPercentage}%</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full" style={{ width: `${p.progressPercentage}%` }} />
          </div>
        </div>

        <div className="text-[10px] text-slate-500 flex items-center space-x-1">
          <Calendar className="w-3 h-3" />
          <span>{p.startDate} - {p.endDate}</span>
        </div>

        <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
          <button
            onClick={() => setChatProject(p)}
            className="flex-1 px-2 py-1.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-300 text-[11px] font-semibold flex items-center justify-center space-x-1 hover:bg-blue-600/30 transition"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat</span>
          </button>

          {isSelected ? (
            <span className="px-2 py-1.5 rounded-xl text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              Active
            </span>
          ) : requested ? (
            <span className="px-2 py-1.5 rounded-xl text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
              Pending
            </span>
          ) : (
            <button
              onClick={() => handleRequest(p.id)}
              disabled={requestingId === p.id}
              className="px-2.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-[11px] font-semibold transition disabled:opacity-50"
            >
              Request
            </button>
          )}
        </div>
      </div>
    );
  };

  const isMemberOf = (p: Project) =>
    p.assignedUsers.some(u => u.id === currentUser.id) || p.owner?.id === currentUser.id;

  const myProjects = projects.filter(isMemberOf);
  const otherProjects = projects.filter(p => !isMemberOf(p));

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Briefcase className="w-5 h-5 text-purple-400" />
            <span>Enterprise Projects Portfolio</span>
          </h2>
          <p className="text-xs text-slate-400">Monitor active projects, milestones, progress %, and owners.</p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center space-x-2 shadow-lg shadow-purple-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Project</span>
          </button>
        )}
      </div>

      {/* Admin: Pending access requests */}
      {isAdmin && (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="px-5 py-4 bg-slate-800/60 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <UserCircle2 className="w-5 h-5 text-amber-400" />
              <h3 className="font-semibold text-sm text-white">Project Access Requests</h3>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {pendingRequests.length} PENDING
            </span>
          </div>
          <div className="p-5 space-y-3">
            {pendingRequests.length === 0 ? (
              <p className="text-xs text-slate-500">No pending project access requests.</p>
            ) : (
              pendingRequests.map(r => (
                <div key={r.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{r.userName} <span className="text-slate-400 font-normal">requested access to</span> {r.projectName}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{r.createdAt}</span>
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => reviewProjectRequest(r.id, 'APPROVED')}
                      className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-500/30 transition"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => reviewProjectRequest(r.id, 'REJECTED')}
                      className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold hover:bg-rose-500/30 transition"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Projects Grid */}
      {isAdmin ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(renderProjectCard)}
        </div>
      ) : (
        <div className="space-y-8">
          {myProjects.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Briefcase className="w-4 h-4 text-purple-400" />
                  <span>My Projects</span>
                </h3>
                <span className="text-xs text-slate-400">{myProjects.length} Projects</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myProjects.map(renderProjectCard)}
              </div>
            </div>
          )}

          {otherProjects.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-slate-500" />
                  <span>Other Projects</span>
                </h3>
                <span className="text-xs text-slate-400">{otherProjects.length} Projects</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {otherProjects.map(renderCompactProjectCard)}
              </div>
            </div>
          )}

          {myProjects.length === 0 && otherProjects.length === 0 && (
            <div className="text-center py-16 glass-panel rounded-2xl border border-slate-800">
              <Briefcase className="w-12 h-12 mx-auto text-slate-600" />
              <p className="text-sm text-slate-400 mt-3">No projects found.</p>
            </div>
          )}
        </div>
      )}

      <NewProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      {editingProject && (
        <EditProjectModal
          key={editingProject.id}
          isOpen={!!editingProject}
          onClose={() => setEditingProject(null)}
          project={editingProject}
        />
      )}
      {deletingProject && (
        <DeleteProjectModal
          isOpen={!!deletingProject}
          onClose={() => setDeletingProject(null)}
          project={deletingProject}
        />
      )}
      <ProjectChatModal
        isOpen={!!chatProject}
        onClose={() => setChatProject(null)}
        project={chatProject}
      />
    </div>
  );
};
