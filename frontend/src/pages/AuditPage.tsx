import React from 'react';
import { useApp } from '../context/AppContext';
import { ShieldAlert, Terminal, Clock } from 'lucide-react';


export const AuditPage: React.FC = () => {
  const { auditLogs, loading } = useApp();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5 text-purple-400" />
          <span>System Audit Logs & Security Compliance</span>
        </h2>
        <p className="text-xs text-slate-400">Immutable record of logins, task updates, project changes, and 10 PM lock triggers.</p>
      </div>

      {/* Audit Log Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/60">
          <h3 className="font-bold text-sm text-white flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-purple-400" />
            <span>Audit Records Log</span>
          </h3>
          <span className="text-xs text-slate-400">{auditLogs.length} Total Logs</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[10px]">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Action Type</th>
                <th className="p-4">User</th>
                <th className="p-4">IP Address</th>
                <th className="p-4">Event Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono text-[11px] text-slate-300">
              {auditLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-4 text-slate-400 font-sans flex items-center space-x-1.5">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{log.createdAt}</span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-sans ${
                      log.actionType.includes('MORNING') ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      log.actionType.includes('EVENING') ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                      log.actionType.includes('AUTOMATED') ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    }`}>
                      {log.actionType}
                    </span>
                  </td>
                  <td className="p-4 font-sans font-semibold text-white">{log.userName}</td>
                  <td className="p-4 text-slate-400">{log.ipAddress}</td>
                  <td className="p-4 text-slate-300 font-sans">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
