import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import * as api from '../api';
import { BarChart3, FileSpreadsheet, Filter, ArrowUpDown, User as UserIcon, Briefcase, Presentation, Download } from 'lucide-react';
import type { DailyTaskUpdate } from '../types';

export const ReportsPage: React.FC = () => {
  const { updates, tasks, users, projects, currentUser, loading } = useApp();
  const { token } = useAuth();
  const [granularity, setGranularity] = useState<'Daily' | 'Weekly' | 'Monthly' | 'Yearly'>('Weekly');
  const [selectedUser, setSelectedUser] = useState<string>('ALL');
  const [selectedProject, setSelectedProject] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'FCFS' | 'USER_ASC' | 'PROJECT_ASC' | 'DATE_DESC' | 'DATE_ASC' | 'HOURS_DESC'>('DATE_DESC');
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPPT, setExportingPPT] = useState(false);

  const handleExportExcel = async () => {
    if (!token) return;
    try {
      setExportingExcel(true);
      await api.exportUpdatesExcel(token, 7, selectedUser !== 'ALL' ? selectedUser : undefined);
    } catch (err: any) {
      alert(err.message || 'Failed to export Excel report');
    } finally {
      setExportingExcel(false);
    }
  };

  const handleExportPPT = async () => {
    if (!token) return;
    try {
      setExportingPPT(true);
      await api.exportUpdatesPPT(token, 7, selectedUser !== 'ALL' ? selectedUser : undefined);
    } catch (err: any) {
      alert(err.message || 'Failed to export PowerPoint presentation');
    } finally {
      setExportingPPT(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  const getUpdateProjectId = (u: DailyTaskUpdate) => {
    if (u.morningProjectId) return u.morningProjectId;
    if (u.morningTaskId) {
      const matchedTask = tasks.find(t => t.id === u.morningTaskId);
      if (matchedTask) return matchedTask.projectId;
    }
    const userObj = users.find(usr => usr.id === u.userId);
    return userObj?.currentProjectId || '';
  };

  const getUpdateProjectName = (u: DailyTaskUpdate) => {
    if (u.morningProjectName) return u.morningProjectName;
    if (u.morningTaskId) {
      const matchedTask = tasks.find(t => t.id === u.morningTaskId);
      if (matchedTask) return matchedTask.projectName;
    }
    const userObj = users.find(usr => usr.id === u.userId);
    if (userObj?.currentProjectId) {
      const p = projects.find(proj => proj.id === userObj.currentProjectId);
      if (p) return p.name;
    }
    return 'General / Default';
  };

  // For employees, restrict updates to their own reports only
  const userRoleUpdates = currentUser.role === 'ADMIN' 
    ? updates 
    : updates.filter(u => u.userId === currentUser.id);

  // Filter updates based on selected user and project
  const filteredUpdates = userRoleUpdates.filter(u => {
    if (currentUser.role === 'ADMIN' && selectedUser !== 'ALL' && u.userId !== selectedUser) return false;
    if (selectedProject !== 'ALL' && getUpdateProjectId(u) !== selectedProject) return false;
    return true;
  });

  // Calculate real metrics from context state
  const totalLoggedHours = filteredUpdates.reduce((sum, u) => sum + (u.eveningHoursSpent || 0), 0);
  const uniqueDatesCount = new Set(filteredUpdates.map(u => u.reportDate)).size || 1;
  const uniqueUsersCount = new Set(filteredUpdates.map(u => u.userId)).size || 1;
  const avgHoursPerUserDay = (totalLoggedHours / (uniqueDatesCount * uniqueUsersCount)).toFixed(1);

  const completedUpdates = filteredUpdates.filter(u => u.morningSubmittedAt && u.eveningSubmittedAt).length;
  const submissionComplianceRate = filteredUpdates.length > 0 ? ((completedUpdates / filteredUpdates.length) * 100).toFixed(1) : '100';

  const userTasks = currentUser.role === 'ADMIN' ? tasks : tasks.filter(t => t.assignedTo === currentUser.id);
  const completedTasks = userTasks.filter(t => t.status === 'COMPLETED').length;
  const totalTasks = userTasks.length;
  const taskCompletionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(0) : '0';

  const handleExportCSV = () => {
    const headers = ['User Name', 'Email', 'Project', 'Report Date', 'Morning Planned Work', 'Morning Est Hours', 'Evening Completed Work', 'Evening Hours Spent', 'Locked'];
    const rows = filteredUpdates.map(u => [
      `"${u.userName}"`,
      `"${u.userEmail}"`,
      `"${getUpdateProjectName(u)}"`,
      `"${u.reportDate}"`,
      `"${u.morningPlannedWork || ''}"`,
      u.morningEstHours || 0,
      `"${u.eveningCompletedWork || ''}"`,
      u.eveningHoursSpent || 0,
      u.isLocked ? 'TRUE' : 'FALSE'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Daily_Work_Tracker_Report_${granularity}_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            <span>Reports & Analytics Export Center</span>
          </h2>
          <p className="text-xs text-slate-400">
            {currentUser.role === 'ADMIN'
              ? 'Generate executive summary reports across all employees, projects, and tasks.'
              : 'View your personal work update history, productivity analytics, and report export.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Top Right Sort Dropdown */}
          <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-700/80 px-3 py-2 rounded-xl text-xs shadow-sm">
            <ArrowUpDown className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400 font-semibold hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer text-xs"
            >
              <option value="DATE_DESC" className="bg-slate-900 text-white">Date (Newest First)</option>
              <option value="DATE_ASC" className="bg-slate-900 text-white">Date (Oldest First)</option>
              <option value="FCFS" className="bg-slate-900 text-white">First Come First Serve (FCFS)</option>
              <option value="USER_ASC" className="bg-slate-900 text-white">Employee Name (A-Z)</option>
              <option value="PROJECT_ASC" className="bg-slate-900 text-white">Project Name (A-Z)</option>
              <option value="HOURS_DESC" className="bg-slate-900 text-white">Hours Spent (High to Low)</option>
            </select>
          </div>

          <button
            onClick={handleExportExcel}
            disabled={exportingExcel}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
            title="Export last 1 week updates as formatted Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{exportingExcel ? 'Exporting...' : 'Export Excel (.xlsx)'}</span>
          </button>

          <button
            onClick={handleExportPPT}
            disabled={exportingPPT}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-lg shadow-orange-600/30 transition disabled:opacity-50"
            title="Export last 1 week updates as PowerPoint Presentation (.pptx)"
          >
            <Presentation className="w-4 h-4" />
            <span>{exportingPPT ? 'Exporting...' : 'Export PPT (.pptx)'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition"
            title="Export filtered updates as CSV"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
          {/* Granularity selector */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-white">Granularity:</span>
            {(['Daily', 'Weekly', 'Monthly', 'Yearly'] as const).map(g => (
              <button
                key={g}
                onClick={() => setGranularity(g)}
                className={`px-3 py-1.5 rounded-lg border font-medium transition ${
                  granularity === g
                    ? 'bg-blue-600 border-blue-500 text-white shadow'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          <div className="text-slate-400">
            Showing <strong className="text-white">{filteredUpdates.length}</strong> of {userRoleUpdates.length} entries
          </div>
        </div>

        {/* User & Project Filter Dropdowns */}
        <div className={`grid grid-cols-1 ${currentUser.role === 'ADMIN' ? 'sm:grid-cols-2' : 'sm:grid-cols-1'} gap-3 pt-3 border-t border-slate-800/80 text-xs`}>
          {currentUser.role === 'ADMIN' && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center space-x-1">
                <UserIcon className="w-3.5 h-3.5 text-blue-400" />
                <span>Filter by Employee</span>
              </label>
              <select
                value={selectedUser}
                onChange={e => setSelectedUser(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Employees</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.fullName} ({u.role})</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center space-x-1">
              <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
              <span>Filter by Project</span>
            </label>
            <select
              value={selectedProject}
              onChange={e => setSelectedProject(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="text-xs text-slate-400 font-medium">Logged Working Hours</div>
          <div className="text-2xl font-bold text-white">{totalLoggedHours.toFixed(1)} hrs</div>
          <div className="text-[11px] text-emerald-400">Average {avgHoursPerUserDay} hrs/day per employee</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="text-xs text-slate-400 font-medium">Submission Compliance</div>
          <div className="text-2xl font-bold text-emerald-400">{submissionComplianceRate}%</div>
          <div className="text-[11px] text-slate-400">10 PM lock rule strictly enforced</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="text-xs text-slate-400 font-medium">Task Completion Rate</div>
          <div className="text-2xl font-bold text-blue-400">{completedTasks} / {totalTasks} ({taskCompletionRate}%)</div>
          <div className="text-[11px] text-slate-400">Completed tasks ratio</div>
        </div>
      </div>

      {/* Report Preview Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h3 className="font-bold text-sm text-white">Generated Report Preview ({granularity})</h3>
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <span>Sorted by: <strong className="text-emerald-400 font-medium">{sortBy}</strong></span>
          </div>
        </div>

        {(() => {
          const sortedUpdates = [...filteredUpdates].sort((a, b) => {
            if (sortBy === 'USER_ASC') {
              return a.userName.localeCompare(b.userName);
            }
            if (sortBy === 'PROJECT_ASC') {
              return getUpdateProjectName(a).localeCompare(getUpdateProjectName(b));
            }
            if (sortBy === 'DATE_DESC') {
              return b.reportDate.localeCompare(a.reportDate);
            }
            if (sortBy === 'DATE_ASC') {
              return a.reportDate.localeCompare(b.reportDate);
            }
            if (sortBy === 'HOURS_DESC') {
              return (b.eveningHoursSpent || 0) - (a.eveningHoursSpent || 0);
            }
            // FCFS default
            const dateCmp = b.reportDate.localeCompare(a.reportDate);
            if (dateCmp !== 0) return dateCmp;
            const timeA = a.morningSubmittedAt || a.eveningSubmittedAt || '9999-99-99';
            const timeB = b.morningSubmittedAt || b.eveningSubmittedAt || '9999-99-99';
            return timeA.localeCompare(timeB);
          });

          return (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-4">Queue #</th>
                    <th className="p-4">Employee</th>
                    <th className="p-4">Project</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Morning Commitment</th>
                    <th className="p-4">Est. Hrs</th>
                    <th className="p-4">Evening Progress</th>
                    <th className="p-4">Actual Hrs</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {sortedUpdates.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-500">No report entries match the selected filters.</td>
                    </tr>
                  ) : (
                    sortedUpdates.map((u, idx) => (
                      <tr key={u.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            #{idx + 1}
                          </span>
                        </td>
                        <td className="p-4 font-semibold text-white">{u.userName}</td>
                        <td className="p-4 text-indigo-300 font-medium">{getUpdateProjectName(u)}</td>
                        <td className="p-4 font-mono text-[11px]">{u.reportDate}</td>
                        <td className="p-4 max-w-xs truncate">{u.morningPlannedWork || '—'}</td>
                        <td className="p-4 font-semibold text-white">{u.morningEstHours || 0} hrs</td>
                        <td className="p-4 max-w-xs truncate">{u.eveningCompletedWork || '—'}</td>
                        <td className="p-4 font-semibold text-white">{u.eveningHoursSpent || 0} hrs</td>
                        <td className="p-4">
                          {u.morningSubmittedAt && u.eveningSubmittedAt ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              SUBMITTED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              PARTIAL
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
