import React from 'react';
import { Bot, FileText, Ticket, Package, Terminal, RefreshCw, MessageSquare, Sparkles } from 'lucide-react';

export const Header = ({ activeTab, setActiveTab, onResetChat }) => {
  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-slate-200/80 text-slate-900 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setActiveTab('home')}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-violet-500/20 group-hover:scale-105 transition-transform">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-slate-900 tracking-tight">ShopAssist</span>
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Agent
              </span>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/70">
            {[
              { id: 'home', label: 'Home', icon: null },
              { id: 'chat', label: 'Chat', icon: <MessageSquare className="w-3.5 h-3.5" /> },
              { id: 'knowledge', label: 'Knowledge', icon: <FileText className="w-3.5 h-3.5" /> },
              { id: 'tickets', label: 'Tickets', icon: <Ticket className="w-3.5 h-3.5" /> },
              { id: 'orders', label: 'Orders', icon: <Package className="w-3.5 h-3.5" /> },
              { id: 'logs', label: 'Logs', icon: <Terminal className="w-3.5 h-3.5" /> }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === item.id
                    ? item.id === 'chat'
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm shadow-violet-500/20'
                      : 'bg-white text-violet-700 shadow-sm border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>

          {/* Action Button */}
          <div className="flex items-center gap-2">
            {activeTab === 'chat' && onResetChat ? (
              <button
                onClick={onResetChat}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5 text-xs font-medium border border-slate-200/80"
              >
                <RefreshCw className="w-3.5 h-3.5 text-violet-600" />
                <span>New Conversation</span>
              </button>
            ) : (
              <button
                onClick={() => setActiveTab('chat')}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md shadow-violet-500/20 transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Start Chat</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <div className="md:hidden flex overflow-x-auto border-t border-slate-200/80 px-3 py-2 gap-1.5 scrollbar-none bg-slate-50/90">
        {['home', 'chat', 'knowledge', 'tickets', 'orders', 'logs'].map(id => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors capitalize ${
              activeTab === id
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            {id}
          </button>
        ))}
      </div>
    </header>
  );
};
