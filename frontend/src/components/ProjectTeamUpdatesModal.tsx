import React, { useEffect, useState } from 'react';
import { X, MessageSquare, CheckSquare, Calendar, User, Download } from 'lucide-react';
import * as api from '../api';
import type { Project, DailyTaskUpdate, Task, TaskStatus, User as UserType } from '../types';

const statusProgress: Record<TaskStatus, number> = {
  'NOT_STARTED': 0,
  'IN_PROGRESS': 50,
  'BLOCKED': 30,
  'COMPLETED': 100,
};

interface ProjectTeamUpdatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  token: string;
}

export const ProjectTeamUpdatesModal: React.FC<ProjectTeamUpdatesModalProps> = ({
  isOpen,
  onClose,
  project,
  token,
}) => {
  const [updates, setUpdates] = useState<DailyTaskUpdate[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'updates' | 'tasks'>('updates');
  const [selectedUserId, setSelectedUserId] = useState<string | 'all'>('all');
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (isOpen && project && token) {
      fetchData();
    }
  }, [isOpen, project?.id, token]);

  const fetchData = async () => {
    if (!project || !token) return;
    setLoading(true);
    try {
      const [updatesRes, tasksRes, membersRes] = await Promise.all([
        api.getProjectUpdates(token, project.id, dateRange.from, dateRange.to),
        api.getTasks(token, project.id),
        api.getProjectMembers(token, project.id),
      ]);
      setUpdates(updatesRes || []);
      setTasks(tasksRes || []);
      setTeamMembers(membersRes || []);
    } catch (err) {
      console.error('Failed to fetch team updates:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUpdates = updates.filter(u => 
    selectedUserId === 'all' || u.userId === selectedUserId
  );

  const filteredTasks = tasks.filter(t => 
    selectedUserId === 'all' || t.assignedTo === selectedUserId
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col h-[85vh] max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Team Updates & Tasks</h3>
              <p className="text-xs text-slate-400">{project?.name} • {teamMembers.length} members</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-950/40">
          {/* Filters */}
          <div className="p-4 border-b border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={e => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
                <span className="text-slate-500 text-xs">to</span>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={e => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
                <button
                  onClick={fetchData}
                  disabled={loading}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Refresh</span>
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-slate-400" />
                <select
                  value={selectedUserId}
                  onChange={e => setSelectedUserId(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="all">All Team Members</option>
                  {teamMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.fullName} ({m.email})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center space-x-1 bg-slate-800/50 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('updates')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'updates'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 inline mr-1.5" />
                Updates ({filteredUpdates.length})
              </button>
              <button
                onClick={() => setActiveTab('tasks')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'tasks'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5 inline mr-1.5" />
                Tasks ({filteredTasks.length})
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            {activeTab === 'updates' ? (
              filteredUpdates.length === 0 ? (
                <div className="text-center py-12 text-slate-500 space-y-2">
                  <MessageSquare className="w-12 h-12 mx-auto text-slate-600 opacity-60" />
                  <p className="text-sm">No updates found</p>
                  <p className="text-xs">Adjust filters or date range</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                  {filteredUpdates.map(u => (
                    <div key={u.id} className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
                            {u.userName?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-white text-sm">{u.userName}</p>
                            <p className="text-xs text-slate-400">{u.userEmail}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 text-xs">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {u.morningSubmittedAt ? 'Morning' : ''} {u.eveningSubmittedAt ? 'Evening' : ''}
                          </span>
                          <span className="text-slate-500">{u.reportDate}</span>
                        </div>
                      </div>

                      {u.morningPlannedWork && (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-xs">
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">MORNING</span>
                          </div>
                          <p className="text-sm text-slate-300 ml-8">{u.morningPlannedWork}</p>
                          {u.morningTaskTitle && <p className="text-xs text-emerald-400 ml-8">Task: {u.morningTaskTitle}</p>}
                          {u.morningBlockers && <p className="text-xs text-rose-400 ml-8">Blocker: {u.morningBlockers}</p>}
                          {u.morningEstHours && <p className="text-xs text-slate-400 ml-8">Est. Hours: {u.morningEstHours}</p>}
                          {u.morningSubmittedAt && <p className="text-xs text-slate-500 ml-8">Submitted: {new Date(u.morningSubmittedAt).toLocaleString()}</p>}
                        </div>
                      )}

                      {u.eveningCompletedWork && (
                        <div className="space-y-2 border-t border-slate-800 pt-3">
                          <div className="flex items-center space-x-2 text-xs">
                            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">EVENING</span>
                          </div>
                          <p className="text-sm text-slate-300 ml-8">{u.eveningCompletedWork}</p>
                          {u.eveningChallenges && <p className="text-xs text-amber-400 ml-8">Challenges: {u.eveningChallenges}</p>}
                          {u.eveningNextDayPlan && <p className="text-xs text-blue-400 ml-8">Next: {u.eveningNextDayPlan}</p>}
                          {u.eveningHoursSpent && <p className="text-xs text-slate-400 ml-8">Hours Spent: {u.eveningHoursSpent}</p>}
                          {u.eveningSubmittedAt && <p className="text-xs text-slate-500 ml-8">Submitted: {new Date(u.eveningSubmittedAt).toLocaleString()}</p>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            ) : (
              filteredTasks.length === 0 ? (
                <div className="text-center py-12 text-slate-500 space-y-2">
                  <CheckSquare className="w-12 h-12 mx-auto text-slate-600 opacity-60" />
                  <p className="text-sm">No tasks found</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                  {filteredTasks.map(t => (
                    <div key={t.id} className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold text-white truncate">{t.title}</h4>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              t.priority === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                              t.priority === 'HIGH' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                              'bg-slate-800 text-slate-300 border-slate-700'
                            }`}>
                              {t.priority}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              t.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                              t.status === 'IN_PROGRESS' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                              t.status === 'BLOCKED' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                              'bg-slate-800 text-slate-300 border-slate-700'
                            }`}>
                              {t.status.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1 truncate">{t.description}</p>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-slate-400">
                          <div className="flex items-center space-x-1">
                            <User className="w-3.5 h-3.5" />
                            <span>{t.assignedToName || 'Unassigned'}</span>
                          </div>
                          {t.dueDate && (
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{t.dueDate}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1 pt-2 border-t border-slate-800">
                        <div className="flex justify-between text-[11px] text-slate-400">
                          <span>Progress</span>
                          <span className="font-semibold text-white">{statusProgress[t.status] || 0}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-blue-500 h-full rounded-full" style={{ width: `${statusProgress[t.status] || 0}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};