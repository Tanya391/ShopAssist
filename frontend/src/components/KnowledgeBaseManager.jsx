import React, { useState } from 'react';
import { FileText, Edit, Save, Search, Database, CheckCircle2, Sparkles } from 'lucide-react';

export const KnowledgeBaseManager = ({ documents, onUpdateDocument }) => {
  const [selectedDocId, setSelectedDocId] = useState(documents[0]?.id || '');
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [testQuery, setTestQuery] = useState('');
  const [retrievedResults, setRetrievedResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const selectedDoc = documents.find(d => d.id === selectedDocId) || documents[0];

  const handleSelectDoc = (doc) => {
    setSelectedDocId(doc.id);
    setIsEditing(false);
    setEditTitle(doc.title);
    setEditContent(doc.content);
  };

  const handleStartEdit = () => {
    if (!selectedDoc) return;
    setEditTitle(selectedDoc.title);
    setEditContent(selectedDoc.content);
    setIsEditing(true);
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    if (!selectedDoc) return;
    setIsSaving(true);
    try {
      await onUpdateDocument(selectedDoc.id, editTitle, editContent);
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save document:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunRAGTest = async () => {
    if (!testQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: testQuery, history: [] })
      });
      const data = await res.json();
      if (data.retrievedChunks) {
        setRetrievedResults(data.retrievedChunks);
      }
    } catch (err) {
      console.error('RAG search test error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-200/80">
              <Database className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900">Knowledge Base</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Official company policy documents used by ShopAssist.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200/80">
          <span className="text-slate-500 font-medium">Indexed Articles:</span>
          <span className="font-bold text-cyan-700">{documents.length} Documents</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document List */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-2 shadow-sm">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 mb-2">
            Policy Articles
          </h3>
          <div className="space-y-1.5">
            {documents.map(doc => {
              const isSelected = doc.id === selectedDocId;
              return (
                <button
                  key={doc.id}
                  onClick={() => handleSelectDoc(doc)}
                  className={`w-full text-left p-3 rounded-xl transition-all border flex items-center justify-between ${
                    isSelected
                      ? 'bg-violet-50 text-violet-900 border-violet-300 shadow-xs'
                      : 'bg-slate-50/50 text-slate-700 border-slate-200/60 hover:bg-slate-100'
                  }`}
                >
                  <div>
                    <span className="font-semibold text-xs block text-slate-900">{doc.title}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{doc.fileName}</span>
                  </div>
                  <FileText className={`w-4 h-4 ${isSelected ? 'text-violet-600' : 'text-slate-400'}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Document Viewer / Editor */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 space-y-4 shadow-sm">
          {selectedDoc ? (
            <>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedDoc.title}</h3>
                  <span className="text-xs font-mono text-cyan-700">{selectedDoc.fileName}</span>
                </div>
                <div className="flex items-center gap-2">
                  {saveSuccess && (
                    <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Saved & Indexed
                    </span>
                  )}
                  {!isEditing ? (
                    <button
                      onClick={handleStartEdit}
                      className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-semibold rounded-xl hover:from-violet-500 hover:to-indigo-500 transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit
                    </button>
                  ) : (
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" /> Save
                    </button>
                  )}
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-500 font-medium block mb-1">Title</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 font-medium block mb-1">Content</label>
                    <textarea
                      rows={12}
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-mono leading-relaxed focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>
              ) : (
                <pre className="bg-slate-50 p-4 rounded-xl text-xs text-slate-800 font-sans whitespace-pre-wrap leading-relaxed border border-slate-200/70 max-h-[420px] overflow-y-auto">
                  {selectedDoc.content}
                </pre>
              )}
            </>
          ) : (
            <p className="text-slate-400 text-xs italic">Select an article to view.</p>
          )}
        </div>
      </div>

      {/* Policy Search Tester */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-600" />
          <h3 className="font-bold text-slate-900 text-sm">Policy Search Tester</h3>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={testQuery}
            onChange={e => setTestQuery(e.target.value)}
            placeholder="Type a query to test policy retrieval (e.g. 'How long do refunds take?')..."
            className="flex-1 bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-violet-500"
          />
          <button
            onClick={handleRunRAGTest}
            disabled={isSearching || !testQuery.trim()}
            className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-violet-500/15 flex items-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" /> Search
          </button>
        </div>

        {retrievedResults.length > 0 && (
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase">Matching Results:</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {retrievedResults.map((chunk, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5">
                    <span className="font-bold text-slate-900 text-xs">{chunk.docTitle}</span>
                    {chunk.similarityScore !== undefined && (
                      <span className="px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 font-mono text-[10px] font-bold">
                        {Math.round(chunk.similarityScore * 100)}% Match
                      </span>
                    )}
                  </div>
                  <p className="text-slate-700 text-[11px] leading-relaxed italic">
                    "{chunk.text}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
