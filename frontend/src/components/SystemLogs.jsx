import React from 'react';
import { Terminal, RefreshCw } from 'lucide-react';

export const SystemLogs = ({ logs, onRefreshLogs }) => {
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200/80">
              <Terminal className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900">System Audit Logs</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time execution log for AI workflow steps, tool calls, and queries.
          </p>
        </div>
        <button
          onClick={onRefreshLogs}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-purple-600" /> Refresh
        </button>
      </div>

      <div className="bg-slate-900 text-slate-100 border border-slate-800 rounded-2xl p-4 font-mono text-xs space-y-2 max-h-[550px] overflow-y-auto shadow-sm">
        {logs.map(log => (
          <div
            key={log.id}
            className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start gap-3"
          >
            <span className="text-[10px] text-slate-500 shrink-0 mt-0.5">{log.timestamp}</span>
            <span
              className={`px-2 py-0.5 text-[10px] rounded font-bold shrink-0 ${
                log.type === 'ERROR'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : log.type === 'WORKFLOW'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : log.type === 'WARN'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              }`}
            >
              {log.category}
            </span>
            <div className="flex-1 space-y-1">
              <p className="text-slate-200">{log.message}</p>
              {log.metadata && (
                <pre className="text-[10px] text-indigo-300 bg-slate-900 p-2 rounded border border-slate-800 overflow-x-auto">
                  {JSON.stringify(log.metadata, null, 2)}
                </pre>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
