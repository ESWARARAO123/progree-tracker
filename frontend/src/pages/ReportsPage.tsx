import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BarChart3, FileSpreadsheet, Filter } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { updates, tasks, users, loading } = useApp();
  const [granularity, setGranularity] = useState<'Daily' | 'Weekly' | 'Monthly' | 'Yearly'>('Monthly');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Calculate real metrics from context state
  const totalLoggedHours = updates.reduce((sum, u) => sum + (u.eveningHoursSpent || 0), 0);
  const uniqueDatesCount = new Set(updates.map(u => u.reportDate)).size || 1;
  const uniqueUsersCount = new Set(updates.map(u => u.userId)).size || (users.length || 1);
  const avgHoursPerUserDay = (totalLoggedHours / (uniqueDatesCount * uniqueUsersCount)).toFixed(1);

  const completedUpdates = updates.filter(u => u.morningSubmittedAt && u.eveningSubmittedAt).length;
  const submissionComplianceRate = updates.length > 0 ? ((completedUpdates / updates.length) * 100).toFixed(1) : '100';

  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
  const totalTasks = tasks.length;
  const taskCompletionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(0) : '0';


  const handleExportCSV = () => {
    const headers = ['User Name', 'Email', 'Report Date', 'Morning Planned Work', 'Morning Est Hours', 'Evening Completed Work', 'Evening Hours Spent', 'Locked'];
    const rows = updates.map(u => [
      `"${u.userName}"`,
      `"${u.userEmail}"`,
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
          <p className="text-xs text-slate-400">Generate executive summary reports across projects, attendance, and task completion.</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-2 shadow-lg shadow-emerald-600/30 transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export to CSV / Excel</span>
          </button>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-wrap justify-between items-center gap-4 text-xs">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-white">Report Granularity:</span>
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
          Showing <strong className="text-white">{updates.length}</strong> recorded report entries
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
          <span className="text-xs text-slate-400">Ready for Download</span>
        </div>

        {(() => {
          const fcfsUpdates = [...updates].sort((a, b) => {
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
                    <th className="p-4">FCFS Order</th>
                    <th className="p-4">Employee</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Morning Commitment</th>
                    <th className="p-4">Est. Hrs</th>
                    <th className="p-4">Evening Progress</th>
                    <th className="p-4">Actual Hrs</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {fcfsUpdates.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">No report entries recorded yet.</td>
                    </tr>
                  ) : (
                    fcfsUpdates.map((u, idx) => (
                      <tr key={u.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            #{idx + 1} FCFS
                          </span>
                        </td>
                        <td className="p-4 font-semibold text-white">{u.userName}</td>
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
