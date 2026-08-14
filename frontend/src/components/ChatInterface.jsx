import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, RefreshCw, Layers, ShieldCheck, Sparkles } from 'lucide-react';
import { WorkflowInspector } from './WorkflowInspector.jsx';
import { TicketCard } from './TicketCard.jsx';
import { OrderCard } from './OrderCard.jsx';

const SUGGESTED_QUERIES = [
  'What is your refund policy?',
  'Where is my order ORD-1002?',
  'I received a damaged item in ORD-1003',
  'What is the warranty on electronics?',
  'Can I return an item after 30 days?'
];

export const ChatInterface = ({
  messages,
  onSendMessage,
  isLoading,
  onResetChat,
  onNavigateToTickets
}) => {
  const [inputQuery, setInputQuery] = useState('');
  const [selectedMessageForTrace, setSelectedMessageForTrace] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputQuery.trim() || isLoading) return;
    const query = inputQuery.trim();
    setInputQuery('');
    onSendMessage(query);
  };

  const handleSelectSuggested = (query) => {
    if (isLoading) return;
    onSendMessage(query);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] max-w-4xl mx-auto bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden">
      {/* Chat Header */}
      <div className="bg-white/90 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-violet-500 flex items-center justify-center shrink-0 shadow-md shadow-violet-500/20">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm sm:text-base">
                ShopAssist Support
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-[11px] font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Active Agent
              </span>
            </div>
            <p className="text-xs text-slate-500">Instant AI customer support & order tracking</p>
          </div>
        </div>

        <button
          onClick={onResetChat}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200/80 text-xs font-medium"
        >
          <RefreshCw className="w-3.5 h-3.5 text-violet-600" />
          <span className="hidden sm:inline">Reset Conversation</span>
        </button>
      </div>

      {/* Message History */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-gradient-to-b from-slate-50/90 via-indigo-50/20 to-slate-50/90">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div key={msg.id} className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
              {!isUser && (
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shrink-0 mt-0.5 shadow-md shadow-violet-500/15">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}

              <div className={`space-y-1.5 max-w-[85%] sm:max-w-[78%] ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                  className={`p-4 sm:p-5 text-xs sm:text-sm leading-relaxed transition-all ${
                    isUser
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-3xl rounded-tr-xs shadow-md shadow-violet-500/20 font-medium'
                      : 'bg-white border border-slate-200/70 text-slate-800 rounded-3xl rounded-tl-xs shadow-sm shadow-slate-200/40 space-y-3'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.text}</div>

                  {!isUser && msg.orderData && (
                    <div className="pt-2">
                      <OrderCard order={msg.orderData} />
                    </div>
                  )}

                  {!isUser && msg.createdTicket && (
                    <div className="pt-2">
                      <TicketCard ticket={msg.createdTicket} onViewDetails={onNavigateToTickets} />
                    </div>
                  )}

                  {!isUser && (msg.retrievedChunks?.length || msg.workflowTrace) && (
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      {msg.retrievedChunks && msg.retrievedChunks.length > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-50 border border-cyan-200/80 text-cyan-800 font-medium">
                          <ShieldCheck className="w-3.5 h-3.5 text-cyan-600" />
                          Doc: {msg.retrievedChunks[0].fileName}
                        </span>
                      )}

                      {msg.workflowTrace && (
                        <button
                          onClick={() => setSelectedMessageForTrace(msg)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200/80 font-medium transition-all text-[11px] ml-auto"
                        >
                          <Layers className="w-3.5 h-3.5 text-violet-600" />
                          <span>Trace Graph</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div
                  className={`text-[10px] text-slate-400 ${isUser ? 'text-right' : 'text-left'} px-2 font-medium`}
                >
                  {msg.timestamp}
                </div>
              </div>

              {isUser && (
                <div className="w-9 h-9 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <User className="w-4 h-4 text-slate-200" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 items-center">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-md shadow-violet-500/15 animate-pulse">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white border border-slate-200/70 rounded-3xl rounded-tl-xs px-5 py-3.5 text-xs text-slate-600 shadow-sm flex items-center gap-2">
              <span className="font-medium text-slate-700">ShopAssist is reasoning</span>
              <span className="flex space-x-1 items-center">
                <span className="w-2 h-2 rounded-full bg-violet-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-violet-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-violet-600 animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Queries */}
      <div className="bg-white/95 border-t border-slate-100 px-4 py-2.5 flex items-center gap-2 overflow-x-auto scrollbar-none">
        <span className="text-[11px] font-semibold text-slate-500 shrink-0 flex items-center gap-1 pl-1">
          <Sparkles className="w-3.5 h-3.5 text-violet-600" />
          Suggested:
        </span>
        {SUGGESTED_QUERIES.map((query, idx) => (
          <button
            key={idx}
            onClick={() => handleSelectSuggested(query)}
            disabled={isLoading}
            className="px-3.5 py-1.5 rounded-full bg-slate-50 hover:bg-violet-50 text-slate-700 hover:text-violet-700 border border-slate-200/80 hover:border-violet-200 text-xs font-medium whitespace-nowrap transition-all disabled:opacity-50"
          >
            {query}
          </button>
        ))}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="p-3 sm:p-4 bg-white border-t border-slate-100 flex items-center gap-2 sm:gap-3"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Ask a question or enter order ID (e.g. ORD-1002)..."
          disabled={isLoading}
          className="flex-1 bg-slate-50/80 border border-slate-200/80 focus:border-violet-500 focus:bg-white text-slate-900 placeholder-slate-400 rounded-2xl px-5 py-3 text-xs sm:text-sm focus:outline-none transition-all shadow-inner"
        />
        <button
          type="submit"
          disabled={!inputQuery.trim() || isLoading}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-md shadow-violet-500/20 whitespace-nowrap"
        >
          <span>Send</span>
          <Send className="w-4 h-4" />
        </button>
      </form>

      {selectedMessageForTrace && (
        <WorkflowInspector
          message={selectedMessageForTrace}
          onClose={() => setSelectedMessageForTrace(null)}
        />
      )}
    </div>
  );
};
