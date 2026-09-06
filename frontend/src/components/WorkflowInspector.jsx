import React, { useState } from 'react';
import { X, Layers, Clock, ShieldCheck, Database, Code, CheckCircle } from 'lucide-react';

export const WorkflowInspector = ({ message, onClose }) => {
  const [activeTab, setActiveTab] = useState('nodes');

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-orange-100 rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">

        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200/60 flex items-center justify-center text-[#FA8C00]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">AI Workflow Trace</h3>
              <p className="text-xs text-slate-500">Execution graph for response ID: {message.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-stone-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-stone-100 bg-stone-50/60 px-6">
          {[
            { id: 'nodes', label: `Nodes (${message.workflowTrace?.length || 0})`, icon: <Layers className="w-3.5 h-3.5" /> },
            { id: 'rag',   label: `Chunks (${message.retrievedChunks?.length || 0})`, icon: <Database className="w-3.5 h-3.5" /> },
            { id: 'json',  label: 'Raw JSON', icon: <Code className="w-3.5 h-3.5" /> }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === tab.id ? 'border-[#FA8C00] text-[#FA8C00]' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-white">
          {activeTab === 'nodes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80 text-xs">
                <span className="text-slate-600">Intent: <strong className="text-[#FA8C00]">{message.intent || 'FAQ'}</strong></span>
                <span className="text-slate-600">Low Confidence: <strong className={message.isLowConfidence ? 'text-amber-600' : 'text-emerald-700'}>{message.isLowConfidence ? 'YES' : 'NO'}</strong></span>
              </div>
              {message.workflowTrace?.length > 0 ? (
                <div className="relative border-l-2 border-orange-200 ml-4 space-y-5 pl-6 py-2">
                  {message.workflowTrace.map((node, idx) => (
                    <div key={node.nodeId || idx} className="relative bg-stone-50/80 rounded-2xl p-4 border border-stone-200/80 space-y-2">
                      <div className="absolute -left-[31px] top-4 w-4 h-4 rounded-full bg-[#FA8C00] border-2 border-white" />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{node.nodeName}</span>
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 font-semibold">
                            <CheckCircle className="w-2.5 h-2.5" /> {node.status}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-[#FA8C00]" />{node.durationMs}ms
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                        <div className="bg-white p-2.5 rounded-xl border border-stone-200/80">
                          <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">Input</span>
                          <p className="text-slate-700 font-mono text-[11px] truncate">{node.inputSummary}</p>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-stone-200/80">
                          <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">Output</span>
                          <p className="text-[#FA8C00] font-mono text-[11px] truncate">{node.outputSummary}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs text-slate-400 italic">No node traces recorded.</p>}
            </div>
          )}

          {activeTab === 'rag' && (
            <div className="space-y-4">
              {message.retrievedChunks?.length > 0 ? message.retrievedChunks.map((chunk, i) => (
                <div key={chunk.chunkId || i} className="bg-stone-50 p-4 rounded-2xl border border-stone-200/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-stone-200/80 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{chunk.docTitle}</span>
                      <span className="text-[10px] text-slate-500 font-mono">({chunk.fileName})</span>
                    </div>
                    {chunk.similarityScore !== undefined && (
                      <span className="px-2.5 py-0.5 text-[10px] rounded-full bg-orange-50 text-[#FA8C00] border border-orange-200 font-semibold">
                        {Math.round(chunk.similarityScore * 100)}% match
                      </span>
                    )}
                  </div>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{chunk.text}</p>
                </div>
              )) : (
                <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200/80 text-center text-xs text-slate-500 space-y-1">
                  <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto" />
                  <p>No document chunks retrieved for this query.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'json' && (
            <pre className="bg-stone-950 text-orange-300 p-4 rounded-2xl font-mono text-xs overflow-x-auto border border-stone-800">
              {JSON.stringify(message, null, 2)}
            </pre>
          )}
        </div>

        <div className="px-6 py-3.5 border-t border-stone-100 bg-stone-50 flex items-center justify-between text-xs text-slate-500">
          <span>Grounded RAG Pipeline Trace</span>
          <button onClick={onClose} className="px-4 py-1.5 rounded-xl bg-stone-200 hover:bg-stone-300 text-slate-800 font-semibold transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
