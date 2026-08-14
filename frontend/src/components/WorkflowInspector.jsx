import React, { useState } from 'react';
import { X, Layers, Clock, ShieldCheck, Database, Code, CheckCircle } from 'lucide-react';

export const WorkflowInspector = ({ message, onClose }) => {
  const [activeTab, setActiveTab] = useState('nodes');

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl text-slate-900 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-700 border border-violet-100 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                AI Workflow Trace
              </h3>
              <p className="text-xs text-slate-500">
                Execution graph for response ID: {message.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/60 px-6">
          {[
            { id: 'nodes', label: `Workflow Nodes (${message.workflowTrace?.length || 0})`, icon: <Layers className="w-3.5 h-3.5" /> },
            { id: 'rag', label: `Retrieved Chunks (${message.retrievedChunks?.length || 0})`, icon: <Database className="w-3.5 h-3.5" /> },
            { id: 'json', label: 'Raw Payload JSON', icon: <Code className="w-3.5 h-3.5" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'border-violet-600 text-violet-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-white">
          {activeTab === 'nodes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-xs">
                <span className="text-slate-600">
                  Detected Intent:{' '}
                  <strong className="text-violet-700">{message.intent || 'FAQ'}</strong>
                </span>
                <span className="text-slate-600">
                  Low Confidence:{' '}
                  <strong className={message.isLowConfidence ? 'text-amber-600' : 'text-emerald-700'}>
                    {message.isLowConfidence ? 'YES' : 'NO'}
                  </strong>
                </span>
              </div>

              {message.workflowTrace && message.workflowTrace.length > 0 ? (
                <div className="relative border-l-2 border-violet-200 ml-4 space-y-5 pl-6 py-2">
                  {message.workflowTrace.map((node, idx) => (
                    <div
                      key={node.nodeId || idx}
                      className="relative bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-2"
                    >
                      <div className="absolute -left-[31px] top-4 w-4 h-4 rounded-full bg-violet-600 border-2 border-white" />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{node.nodeName}</span>
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 font-semibold">
                            <CheckCircle className="w-2.5 h-2.5" /> {node.status}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-violet-600" />
                          {node.durationMs}ms
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                          <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                            Input
                          </span>
                          <p className="text-slate-700 font-mono text-[11px] truncate">
                            {node.inputSummary}
                          </p>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                          <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                            Output
                          </span>
                          <p className="text-violet-700 font-mono text-[11px] truncate">
                            {node.outputSummary}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  No node traces recorded for this turn.
                </p>
              )}
            </div>
          )}

          {activeTab === 'rag' && (
            <div className="space-y-4">
              {message.retrievedChunks && message.retrievedChunks.length > 0 ? (
                message.retrievedChunks.map((chunk, i) => (
                  <div
                    key={chunk.chunkId || i}
                    className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{chunk.docTitle}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          ({chunk.fileName})
                        </span>
                      </div>
                      {chunk.similarityScore !== undefined && (
                        <span className="px-2.5 py-0.5 text-[10px] rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 font-semibold">
                          Similarity: {Math.round(chunk.similarityScore * 100)}%
                        </span>
                      )}
                    </div>
                    <p className="text-slate-700 leading-relaxed font-sans whitespace-pre-wrap">
                      {chunk.text}
                    </p>
                  </div>
                ))
              ) : (
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 text-center text-xs text-slate-500 space-y-1">
                  <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto" />
                  <p>
                    No document chunks were retrieved for this query (e.g. direct tool call or
                    out-of-scope).
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'json' && (
            <pre className="bg-slate-900 text-emerald-400 p-4 rounded-2xl font-mono text-xs overflow-x-auto border border-slate-800">
              {JSON.stringify(message, null, 2)}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Grounded RAG Pipeline Trace</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
